// AnimaWeave 执行引擎
// 框架核心引擎，动态加载和执行插件

import { ExecutionStatus, PluginRegistry as Registry } from "./core.ts";
import type {
  FateEcho,
  IAnimaPlugin,
  NodeDefinition,
  PluginDefinition,
  PluginRegistry,
  TypeDefinition,
  WeaveConnection,
  WeaveGraph,
  WeaveNode,
} from "./core.ts";
import { WeaveParser } from "../parser/weave_parser.ts";

/**
 * AnimaWeave 动态执行引擎
 */
export class AnimaWeaveEngine {
  private parser: WeaveParser;
  private registry: PluginRegistry;
  private initialized = false;

  constructor() {
    this.parser = new WeaveParser();
    this.registry = new Registry();
  }

  /**
   * 初始化引擎 - 动态发现和加载插件
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log("🚀 初始化AnimaWeave引擎...");

    // 动态发现和加载插件
    await this.discoverAndLoadPlugins();

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

      // 3. 确保所需插件已加载
      await this.ensureRequiredPluginsLoaded(graph, sanctumPath);

      // 4. 执行图
      const result = await this.executeWeaveGraph(graph);

      return {
        status: ExecutionStatus.Success,
        outputs: JSON.stringify(result),
        getOutputs: () => result,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("❌ 图执行失败:", errorMessage);

      return {
        status: ExecutionStatus.Error,
        outputs: JSON.stringify({ error: errorMessage }),
        getOutputs: () => ({ error: errorMessage }),
      };
    }
  }

  /**
   * 动态发现和加载插件
   */
  private async discoverAndLoadPlugins(): Promise<void> {
    console.log("🔍 动态发现插件...");

    // 策略1: 扫描plugins目录，发现TypeScript插件实现
    await this.scanPluginModules();

    // 策略2: 自动生成anima文件（给AI看的元数据）
    await this.generateAnimaFiles();

    console.log(`📊 已加载插件: ${this.registry.listPlugins().join(", ")}`);
  }

  /**
   * 扫描插件目录，加载TypeScript插件实现
   */
  private async scanPluginModules(): Promise<void> {
    try {
      const pluginsPath = "src/plugins";

      // 读取plugins目录
      for await (const dirEntry of Deno.readDir(pluginsPath)) {
        if (dirEntry.isDirectory) {
          const pluginName = dirEntry.name;
          console.log(`🔍 发现插件模块: ${pluginName}`);

          try {
            // 尝试加载插件的TypeScript实现
            await this.loadPluginModule(pluginName);
          } catch (error) {
            console.warn(
              `⚠️ 无法加载插件 ${pluginName}:`,
              error instanceof Error ? error.message : String(error),
            );
          }
        }
      }
    } catch (error) {
      console.warn(
        "⚠️ 无法扫描plugins目录:",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * 加载单个插件模块
   */
  private async loadPluginModule(pluginName: string): Promise<void> {
    console.log(`🔌 加载插件模块: ${pluginName}`);

    try {
      // 动态导入插件的TypeScript实现 - 修复路径问题
      const modulePath = `../plugins/${pluginName}/plugin.ts`;
      const pluginModule = await import(modulePath);

      // 创建插件实例 - 插件自己知道自己的定义
      const PluginClass =
        pluginModule[`${pluginName.charAt(0).toUpperCase() + pluginName.slice(1)}Plugin`];
      if (!PluginClass) {
        throw new Error(`Plugin class not found in module: ${modulePath}`);
      }

      // 插件自己提供定义，不需要外部anima文件
      const plugin = new PluginClass();
      this.registry.register(plugin);

      console.log(`✅ 成功加载插件: ${pluginName}`);
    } catch (error) {
      throw new Error(
        `Failed to load plugin ${pluginName}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * 根据已加载的插件自动生成anima文件（给AI看的）
   */
  private async generateAnimaFiles(): Promise<void> {
    console.log("📝 自动生成anima文件...");

    for (const pluginName of this.registry.listPlugins()) {
      try {
        const plugin = this.registry.getPlugin(pluginName);
        if (!plugin) continue;

        // 从插件获取定义
        const definition = plugin.getPluginDefinition();

        // 生成anima文件内容
        const animaContent = this.generateAnimaContent(definition);

        // 写入anima文件
        const animaPath = `sanctums/${pluginName}.anima`;
        await Deno.writeTextFile(animaPath, animaContent);

        console.log(`📄 生成anima文件: ${animaPath}`);
      } catch (error) {
        console.warn(
          `⚠️ 无法生成${pluginName}的anima文件:`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }
  }

  /**
   * 生成anima文件内容
   */
  private generateAnimaContent(definition: PluginDefinition): string {
    let content = "-- types\n";

    // 生成类型定义
    for (const [typeName, typeDef] of Object.entries(definition.types)) {
      const typeDefinition = typeDef as TypeDefinition;
      if (typeDefinition.kind === "composite" && typeDefinition.fields) {
        content += `${typeName} {\n`;
        for (const [fieldName, fieldType] of Object.entries(typeDefinition.fields)) {
          content += `    ${fieldName} ${fieldType}\n`;
        }
        content += "}\n";
      } else {
        content += `${typeName}\n`;
      }
    }

    content += "--\n\n-- nodes\n";

    // 生成节点定义
    for (const [nodeName, nodeDef] of Object.entries(definition.nodes)) {
      const nodeDefinition = nodeDef as NodeDefinition;
      content += `${nodeName} {\n`;
      content += `    mode ${nodeDefinition.mode}\n`;
      content += `    in {\n`;
      for (const [inputName, inputType] of Object.entries(nodeDefinition.inputs)) {
        content += `        ${inputName} ${inputType}\n`;
      }
      content += `    }\n`;
      content += `    out {\n`;
      for (const [outputName, outputType] of Object.entries(nodeDefinition.outputs)) {
        content += `        ${outputName} ${outputType}\n`;
      }
      content += `    }\n`;
      content += "}\n\n";
    }

    content += "--\n";

    return content;
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

    // 检查并加载缺失的插件
    for (const pluginName of requiredPlugins) {
      if (!this.registry.getPlugin(pluginName)) {
        await this.loadPlugin(pluginName, sanctumPath);
      }
    }
  }

  /**
   * 动态加载插件
   */
  private async loadPlugin(pluginName: string, sanctumPath: string): Promise<void> {
    console.log(`🔌 动态加载插件: ${pluginName}`);

    try {
      // 直接导入插件的TypeScript实现（插件自己定义能力）
      const modulePath = `./src/plugins/${pluginName}/plugin.ts`;
      const pluginModule = await import(modulePath);

      // 创建插件实例 - 插件自己知道自己的定义
      const PluginClass =
        pluginModule[`${pluginName.charAt(0).toUpperCase() + pluginName.slice(1)}Plugin`];
      if (!PluginClass) {
        throw new Error(`Plugin class not found in module: ${modulePath}`);
      }

      const plugin = new PluginClass();
      this.registry.register(plugin);

      console.log(`✅ 成功动态加载插件: ${pluginName}`);
    } catch (error) {
      throw new Error(
        `Failed to load plugin ${pluginName}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
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
   * 执行图
   */
  private async executeWeaveGraph(graph: WeaveGraph): Promise<Record<string, unknown>> {
    console.log("🔄 开始执行图...");

    const nodeResults = new Map<string, Record<string, unknown>>();

    // 按拓扑顺序执行节点
    const executionOrder = this.topologicalSort(graph);
    console.log("📋 执行顺序:", executionOrder);

    for (const nodeId of executionOrder) {
      const node = graph.nodes[nodeId];

      console.log(`⚙️ 执行节点: ${nodeId} (${node.plugin}.${node.type})`);

      // 收集输入数据
      const inputs = this.collectNodeInputs(node, graph.connections, nodeResults);

      // 执行节点
      const outputs = await this.registry.executeNode(node.plugin, node.type, inputs);

      // 存储结果
      nodeResults.set(nodeId, outputs);

      console.log(`✅ 节点 ${nodeId} 执行完成:`, outputs);
    }

    // 收集终端输出
    const terminalOutputs = this.collectTerminalOutputs(graph, nodeResults);

    console.log("🎯 图执行完成，终端输出:", terminalOutputs);

    return terminalOutputs;
  }

  /**
   * 拓扑排序
   */
  private topologicalSort(graph: WeaveGraph): string[] {
    const result: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (nodeId: string) => {
      if (visiting.has(nodeId)) {
        throw new Error(`Circular dependency detected: ${nodeId}`);
      }

      if (visited.has(nodeId)) return;

      visiting.add(nodeId);

      // 找到依赖当前节点的节点
      const dependents = graph.connections
        .filter((conn) => conn.from.node === nodeId)
        .map((conn) => conn.to.node);

      for (const dependent of dependents) {
        visit(dependent);
      }

      visiting.delete(nodeId);
      visited.add(nodeId);
      result.unshift(nodeId);
    };

    // 从入口点开始
    for (const entryPoint of graph.metadata.entry_points) {
      visit(entryPoint);
    }

    // 确保所有节点都被访问
    for (const nodeId of Object.keys(graph.nodes)) {
      if (!visited.has(nodeId)) {
        visit(nodeId);
      }
    }

    return result;
  }

  /**
   * 收集节点输入
   */
  private collectNodeInputs(
    node: WeaveNode,
    connections: WeaveConnection[],
    nodeResults: Map<string, Record<string, unknown>>,
  ): Record<string, unknown> {
    const inputs: Record<string, unknown> = {};

    // 从连接收集输入
    const incomingConnections = connections.filter((conn) => conn.to.node === node.id);

    for (const connection of incomingConnections) {
      const sourceResult = nodeResults.get(connection.from.node);
      if (sourceResult && connection.from.output in sourceResult) {
        inputs[connection.to.input] = sourceResult[connection.from.output];
      }
    }

    // 添加节点参数
    if (node.parameters) {
      Object.assign(inputs, node.parameters);
    }

    return inputs;
  }

  /**
   * 收集终端输出
   */
  private collectTerminalOutputs(
    graph: WeaveGraph,
    nodeResults: Map<string, Record<string, unknown>>,
  ): Record<string, unknown> {
    const terminalOutputs: Record<string, unknown> = {};

    for (const [nodeId, results] of nodeResults) {
      for (const [outputName, value] of Object.entries(results)) {
        const isConsumed = graph.connections.some((conn) =>
          conn.from.node === nodeId && conn.from.output === outputName
        );

        if (!isConsumed) {
          const key = `${nodeId}.${outputName}`;
          terminalOutputs[key] = value;
        }
      }
    }

    return terminalOutputs;
  }

  /**
   * 获取插件注册表（用于调试）
   */
  getRegistry(): PluginRegistry {
    return this.registry;
  }
}
