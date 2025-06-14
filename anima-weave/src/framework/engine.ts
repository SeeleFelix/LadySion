// AnimaWeave 执行引擎
// 框架核心引擎，协调各个模块

import { ExecutionStatus, VesselRegistry as Registry } from "./core.ts";
import type { FateEcho, VesselRegistry, WeaveGraph } from "./core.ts";
import { WeaveParser } from "../parser/weave_parser.ts";
import { VesselManager } from "./vessel_manager.ts";
import { GraphValidator } from "./graph_validator.ts";
import { GraphExecutor } from "./graph_executor.ts";
import { SemanticHandler } from "./semantic_handler.ts";
import { ErrorHandler } from "./error_handler.ts";

/**
 * AnimaWeave 动态执行引擎
 */
export class AnimaWeaveEngine {
  private parser: WeaveParser;
  private registry: VesselRegistry;
  private vesselManager: VesselManager;
  private graphValidator: GraphValidator;
  private graphExecutor: GraphExecutor;
  private semanticHandler: SemanticHandler;
  private errorHandler: ErrorHandler;
  private initialized = false;

  constructor() {
    this.parser = new WeaveParser();
    this.registry = new Registry();
    this.vesselManager = new VesselManager(this.registry);
    this.graphValidator = new GraphValidator(this.registry);
    this.graphExecutor = new GraphExecutor(this.registry);
    this.semanticHandler = new SemanticHandler();
    this.errorHandler = new ErrorHandler();
  }

  /**
   * 初始化引擎 - 动态发现和加载容器
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log("🚀 初始化AnimaWeave引擎...");

    // 动态发现和加载容器
    await this.vesselManager.discoverAndLoadVessels();

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

      // 4. 确保所需容器已加载
      await this.ensureRequiredVesselsLoaded(graph, sanctumPath);

      // 5. 执行图
      const result = await this.graphExecutor.executeWeaveGraph(graph);
      const rawResult = this.semanticHandler.extractRawOutputs(result.outputs);

      return {
        status: ExecutionStatus.Success,
        outputs: JSON.stringify(result.outputs),
        error: undefined,
        executionTrace: result.executionTrace,
        getOutputs: () => result.outputs,
        getRawOutputs: () => rawResult,
        getErrorDetails: () => null,
        getExecutionTrace: () => result.executionTrace,
      };
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes("validation error") || (error as any).validationErrors)
      ) {
        return ErrorHandler.handleValidationError(error);
      } else {
        return this.errorHandler.createErrorFateEcho(error, sanctumPath, weaveName);
      }
    }
  }

  /**
   * 确保所需容器已加载
   */
  private async ensureRequiredVesselsLoaded(graph: WeaveGraph, sanctumPath: string): Promise<void> {
    const requiredVessels = new Set<string>();

    // 从图中提取所需的容器
    for (const node of Object.values(graph.nodes)) {
      requiredVessels.add(node.vessel);
    }

    // 委托给容器管理器
    await this.vesselManager.ensureRequiredVesselsLoaded(requiredVessels, sanctumPath);
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
   * 获取容器注册表（用于调试）
   */
  getRegistry(): VesselRegistry {
    return this.registry;
  }

  /**
   * 重新生成anima文件（从vessel定义）
   */
  async regenerateAnimaFiles(): Promise<void> {
    await this.vesselManager.discoverAndLoadVessels();
  }
}
