// AnimaWeave 执行引擎
// 框架核心引擎，协调各个模块

import { ExecutionStatus, PluginRegistry as Registry } from "./core.ts";
import type {
  FateEcho,
  PluginRegistry,
  WeaveGraph,
} from "./core.ts";
import { WeaveParser } from "../parser/weave_parser.ts";
import { PluginManager } from "./plugin_manager.ts";
import { GraphValidator } from "./graph_validator.ts";
import { GraphExecutor } from "./graph_executor.ts";
import { SemanticHandler } from "./semantic_handler.ts";
import { ErrorHandler } from "./error_handler.ts";

/**
 * AnimaWeave 动态执行引擎
 */
export class AnimaWeaveEngine {
  private parser: WeaveParser;
  private registry: PluginRegistry;
  private pluginManager: PluginManager;
  private graphValidator: GraphValidator;
  private graphExecutor: GraphExecutor;
  private semanticHandler: SemanticHandler;
  private errorHandler: ErrorHandler;
  private initialized = false;

  constructor() {
    this.parser = new WeaveParser();
    this.registry = new Registry();
    this.pluginManager = new PluginManager(this.registry);
    this.graphValidator = new GraphValidator(this.registry);
    this.graphExecutor = new GraphExecutor(this.registry);
    this.semanticHandler = new SemanticHandler();
    this.errorHandler = new ErrorHandler();
  }

  /**
   * 初始化引擎 - 动态发现和加载插件
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log("🚀 初始化AnimaWeave引擎...");

    // 动态发现和加载插件
    await this.pluginManager.discoverAndLoadPlugins();

    this.initialized = true;
    console.log("✅ AnimaWeave引擎初始化完成");
  }

  /**
   * 执行图
   */
  async executeGraph(sanctumPath: string, weaveName: string): Promise<FateEcho> {
    await this.initialize();

    try {
      console.log(`🎯 执行图: ${sanctumPath}/${weaveName}.weave`);

      // 1. 读取weave文件
      const weaveContent = await this.readWeaveFile(sanctumPath, weaveName);

      // 2. 解析图结构  
      const graph = await this.parser.parseWeave(weaveContent);

      // 3. 静态检查阶段 - 类型检查、连接验证等
      await this.graphValidator.validateGraph(graph);

      // 4. 确保所需插件已加载
      await this.ensureRequiredPluginsLoaded(graph, sanctumPath);

      // 5. 执行图
      const result = await this.graphExecutor.executeWeaveGraph(graph);
      const rawResult = this.semanticHandler.extractRawOutputs(result);

      return {
        status: ExecutionStatus.Success,
        outputs: JSON.stringify(result),
        error: undefined,
        getOutputs: () => result,
        getRawOutputs: () => rawResult,
        getErrorDetails: () => null,
      };
    } catch (error) {
      return this.errorHandler.createErrorFateEcho(error, sanctumPath, weaveName);
    }
  }



  /**
   * 确保所需插件已加载
   */
  private async ensureRequiredPluginsLoaded(graph: WeaveGraph, sanctumPath: string): Promise<void> {
    const requiredPlugins = new Set<string>();

    // 从图中提取所需的插件
    for (const node of Object.values(graph.nodes)) {
      requiredPlugins.add(node.plugin);
    }

    // 委托给插件管理器
    await this.pluginManager.ensureRequiredPluginsLoaded(requiredPlugins, sanctumPath);
  }

  /**
   * 读取weave文件
   */
  private async readWeaveFile(sanctumPath: string, weaveName: string): Promise<string> {
    const filePath = `${sanctumPath}/${weaveName}.weave`;

    try {
      return await Deno.readTextFile(filePath);
    } catch (error) {
      throw new Error(
        `Failed to read weave file ${filePath}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * 获取插件注册表（用于调试）
   */
  getRegistry(): PluginRegistry {
    return this.registry;
  }


}
