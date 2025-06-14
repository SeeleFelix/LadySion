// AnimaWeave 执行引擎
// 框架核心引擎，动态加载和执行插件

import { ExecutionStatus, PluginRegistry as Registry } from "./core.ts";
import type {
  ErrorDetails,
  FateEcho,
  IAnimaPlugin,
  NodeDefinition,
  PluginDefinition,
  PluginRegistry,
  SemanticValue,
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

      // 3. 静态检查阶段 - 类型检查、连接验证等
      await this.validateGraph(graph);

      // 4. 确保所需插件已加载
      await this.ensureRequiredPluginsLoaded(graph, sanctumPath);

      // 5. 执行图
      const result = await this.executeWeaveGraph(graph);
      const rawResult = this.extractRawOutputs(result);

      return {
        status: ExecutionStatus.Success,
        outputs: JSON.stringify(result),
        error: undefined,
        getOutputs: () => result,
        getRawOutputs: () => rawResult,
        getErrorDetails: () => null,
      };
    } catch (error) {
      return this.createErrorFateEcho(error, sanctumPath, weaveName);
    }
  }

  /**
   * 静态图验证 - 在执行前进行类型检查和连接验证
   */
  private async validateGraph(graph: WeaveGraph): Promise<void> {
    console.log("🔍 开始静态图验证...");
    
    // 检查所有数据连接的类型兼容性
    for (const connection of graph.connections) {
      if (connection.from && connection.to) {
        await this.validateConnection(connection, graph);
      }
    }
    
    console.log("✅ 静态图验证通过");
  }

  /**
   * 验证单个连接的类型兼容性
   */
  private async validateConnection(connection: WeaveConnection, graph: WeaveGraph): Promise<void> {
    const fromNode = graph.nodes[connection.from.node];
    const toNode = graph.nodes[connection.to.node];
    
    if (!fromNode || !toNode) {
      throw new Error(`Connection validation failed: node not found`);
    }

    // 获取输出端口和输入端口的类型信息
    const fromPlugin = this.registry.getPlugin(fromNode.plugin);
    const toPlugin = this.registry.getPlugin(toNode.plugin);
    
    if (!fromPlugin || !toPlugin) {
      throw new Error(`Plugin not found for connection validation`);
    }

    const fromDefinition = fromPlugin.getPluginDefinition();
    const toDefinition = toPlugin.getPluginDefinition();
    
    // 从 "basic.Start" 中提取 "Start"
    const fromNodeType = fromNode.type.includes('.') ? fromNode.type.split('.')[1] : fromNode.type;
    const toNodeType = toNode.type.includes('.') ? toNode.type.split('.')[1] : toNode.type;
    
    const fromNodeDef = fromDefinition.nodes[fromNodeType];
    const toNodeDef = toDefinition.nodes[toNodeType];
    
    console.log(`🔍 查找节点定义: ${fromNodeType} -> ${toNodeType}`);
    console.log(`📋 可用节点:`, Object.keys(fromDefinition.nodes), Object.keys(toDefinition.nodes));
    
    if (!fromNodeDef || !toNodeDef) {
      throw new Error(`Node definition not found for connection validation`);
    }

    // 获取端口类型
    const outputType = fromNodeDef.outputs[connection.from.output];
    const inputType = toNodeDef.inputs[connection.to.input];
    
    if (!outputType || !inputType) {
      throw new Error(`Port not found: ${connection.from.output} -> ${connection.to.input}`);
    }

    // 类型兼容性检查
    if (!this.areTypesCompatible(outputType, inputType)) {
      const errorMessage = `Type mismatch in static validation: Cannot connect ${outputType} to ${inputType} (${connection.from.node}.${connection.from.output} -> ${connection.to.node}.${connection.to.input})`;
      
      console.log(`❌ 静态类型检查失败: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    console.log(`✅ 连接类型检查通过: ${outputType} -> ${inputType}`);
  }

  /**
   * 检查两个类型是否兼容
   */
  private areTypesCompatible(outputType: string, inputType: string): boolean {
    // 完全匹配
    if (outputType === inputType) {
      return true;
    }
    
    // 🔧 重构：动态查询插件的类型兼容性规则，而不是硬编码basic.类型
    try {
      // 解析输出类型的插件名
      const [outputPluginName] = outputType.split('.');
      const outputPlugin = this.registry.getPlugin(outputPluginName);
      
      if (!outputPlugin) {
        console.warn(`⚠️ 输出类型的插件未找到: ${outputPluginName}`);
        return false;
      }
      
      // 获取插件的类型兼容性规则
      const compatibilityRules = this.getPluginTypeCompatibilityRules(outputPlugin);
      const compatibleTypes = compatibilityRules[outputType] || [];
      
      return compatibleTypes.includes(inputType);
    } catch (error) {
      console.warn(`⚠️ 类型兼容性检查失败:`, error);
      return false;
    }
  }

  /**
   * 获取插件的类型兼容性规则
   */
  private getPluginTypeCompatibilityRules(plugin: IAnimaPlugin): Record<string, string[]> {
    try {
      const definition = plugin.getPluginDefinition();
      const rules: Record<string, string[]> = {};
      
      // 为每个语义标签建立兼容性规则
      for (const [typeName, typeDef] of Object.entries(definition.semantic_labels)) {
        const fullTypeName = `${definition.metadata.name}.${typeName}`;
        const typeDefinition = typeDef as TypeDefinition;
        
        // 基础规则：类型与自己兼容
        rules[fullTypeName] = [fullTypeName];
        
        // 特殊兼容性规则
        if (typeName === "UUID") {
          // UUID可以作为String使用
          rules[fullTypeName].push(`${definition.metadata.name}.String`);
        }
        
        // 可以在这里添加更多插件特定的兼容性规则
        // 例如：不同插件间的类型兼容性
      }
      
      return rules;
    } catch (error) {
      console.warn(`⚠️ 获取插件类型兼容性规则失败:`, error);
      return {};
    }
  }

  /**
   * 创建错误FateEcho - 根据错误类型分类
   */
  private createErrorFateEcho(error: unknown, sanctumPath?: string, weaveName?: string): FateEcho {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ 图执行失败:", errorMessage);

    // 错误分类逻辑
    let errorCode: ExecutionStatus;
    let location: any = undefined;

    if (errorMessage.includes("parse") || errorMessage.includes("syntax")) {
      errorCode = ExecutionStatus.ParseError;
    } else if (errorMessage.includes("type") || errorMessage.includes("connection") || errorMessage.includes("validation")) {
      errorCode = ExecutionStatus.ValidationError;
    } else if (errorMessage.includes("plugin") || errorMessage.includes("import")) {
      errorCode = ExecutionStatus.ConfigError;
    } else if (errorMessage.includes("requires") && errorMessage.includes("input")) {
      // 这是运行时的节点执行错误
      errorCode = ExecutionStatus.RuntimeError;
    } else if (errorMessage.includes("data") || errorMessage.includes("conversion")) {
      errorCode = ExecutionStatus.DataError;
    } else {
      errorCode = ExecutionStatus.FlowError;
    }

    if (sanctumPath && weaveName) {
      location = {
        file: `${sanctumPath}/${weaveName}.weave`
      };
    }

    const errorDetails: ErrorDetails = {
      code: errorCode,
      message: errorMessage,
      location,
      context: { timestamp: new Date().toISOString() }
    };

    const errorSemanticValue: SemanticValue = {
      semantic_label: "system.Error",
      value: errorMessage
    };

    return {
      status: errorCode,
      outputs: JSON.stringify({ error: errorSemanticValue }),
      error: errorDetails,
      getOutputs: () => ({ error: errorSemanticValue }),
      getRawOutputs: () => ({ error: errorMessage }),
      getErrorDetails: () => errorDetails,
    };
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
    for (const [typeName, typeDef] of Object.entries(definition.semantic_labels)) {
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
  private async executeWeaveGraph(graph: WeaveGraph): Promise<Record<string, SemanticValue>> {
    console.log("🔄 开始执行图...");

    const nodeResults = new Map<string, Record<string, unknown>>();
    
    // 🎯 动态控制流调度实现
    const readyQueue = new Set<string>();
    const controlInputCounts = new Map<string, number>();
    const receivedControlInputs = new Map<string, number>();
    
    // 初始化控制输入计数
    for (const nodeId of Object.keys(graph.nodes)) {
      const node = graph.nodes[nodeId];
      const controlInputs = graph.connections.filter(conn => 
        conn.to.node === nodeId && this.isControlConnection(conn, graph)
      );
      controlInputCounts.set(nodeId, controlInputs.length);
      receivedControlInputs.set(nodeId, 0);
      
      // 修复：只有真正的入口节点才立即就绪
      // 入口节点的特征：1) 没有控制输入连接 2) 不需要trigger输入
      if (controlInputs.length === 0 && !this.nodeRequiresTrigger(node)) {
        readyQueue.add(nodeId);
      }
    }
    
    console.log("📋 初始就绪队列:", Array.from(readyQueue));
    console.log("📊 控制输入计数:", Object.fromEntries(controlInputCounts));

    // 动态执行循环
    while (readyQueue.size > 0) {
      const nodeIterator = readyQueue.values().next();
      if (nodeIterator.done || !nodeIterator.value) {
        break;
      }
      const nodeId = nodeIterator.value;
      readyQueue.delete(nodeId);
      
      const node = graph.nodes[nodeId];
      if (!node) {
        console.warn(`⚠️ 节点未找到: ${nodeId}`);
        continue;
      }
      
      console.log(`⚙️ 执行节点: ${nodeId} (${node.plugin}.${node.type})`);

      // 收集输入数据
      const inputs = this.collectNodeInputs(node, graph.connections, nodeResults);

      // 执行节点
      const outputs = await this.registry.executeNode(node.plugin, node.type, inputs);

      // 存储结果
      nodeResults.set(nodeId, outputs);
      console.log(`✅ 节点 ${nodeId} 执行完成:`, outputs);

      // 处理控制输出，更新下游节点的就绪状态
      this.updateDownstreamReadiness(nodeId, outputs, graph, receivedControlInputs, controlInputCounts, readyQueue);
    }

    // 收集终端输出（带语义标签）
    const terminalOutputs = this.collectTerminalOutputs(graph, nodeResults);

    console.log("🎯 图执行完成，终端输出:", terminalOutputs);

    return terminalOutputs;
  }

  /**
   * 判断连接是否为控制连接
   */
  private isControlConnection(connection: WeaveConnection, graph: WeaveGraph): boolean {
    // 🔧 重构：通过语义标签判断控制连接，而不是硬编码端口名
    try {
      const sourceNode = graph.nodes[connection.from.node];
      if (!sourceNode) return false;
      
      // 获取输出端口的语义标签
      const semanticLabel = this.getOutputSemanticLabel(sourceNode, connection.from.output);
      
      // 控制连接的特征：语义标签以".Signal"结尾
      // 这样可以支持任何插件的Signal类型，不只是basic.Signal
      return semanticLabel.endsWith('.Signal');
    } catch (error) {
      console.warn(`⚠️ 判断控制连接失败:`, error);
      // 降级到简单判断作为备选方案
      const outputPort = connection.from.output;
      return outputPort === "signal" || outputPort === "done" || outputPort === "trigger";
    }
  }

  /**
   * 更新下游节点的就绪状态
   */
  private updateDownstreamReadiness(
    nodeId: string,
    outputs: Record<string, unknown>,
    graph: WeaveGraph,
    receivedControlInputs: Map<string, number>,
    controlInputCounts: Map<string, number>,
    readyQueue: Set<string>
  ): void {
    // 找到当前节点的控制输出连接
    const controlOutputConnections = graph.connections.filter(conn => 
      conn.from.node === nodeId && this.isControlConnection(conn, graph)
    );

    for (const connection of controlOutputConnections) {
      const targetNodeId = connection.to.node;
      const outputValue = outputs[connection.from.output];
      
      // 只有当控制信号为true时才计数
      if (outputValue === true) {
        const currentCount = receivedControlInputs.get(targetNodeId) || 0;
        const newCount = currentCount + 1;
        receivedControlInputs.set(targetNodeId, newCount);
        
        const expectedCount = controlInputCounts.get(targetNodeId) || 0;
        console.log(`🔄 节点 ${targetNodeId} 收到控制信号: ${newCount}/${expectedCount}`);
        
        // 当收到所有控制输入时，节点变为就绪
        if (newCount === expectedCount && expectedCount > 0) {
          readyQueue.add(targetNodeId);
          console.log(`✅ 节点 ${targetNodeId} 就绪，加入执行队列`);
        }
      }
    }
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
   * 收集终端输出（带语义标签信息）
   */
  private collectTerminalOutputs(
    graph: WeaveGraph,
    nodeResults: Map<string, Record<string, unknown>>,
  ): Record<string, SemanticValue> {
    const terminalOutputs: Record<string, SemanticValue> = {};

    for (const [nodeId, results] of nodeResults) {
      const node = graph.nodes[nodeId];
      
      for (const [outputName, value] of Object.entries(results)) {
        const isConsumed = graph.connections.some((conn) =>
          conn.from.node === nodeId && conn.from.output === outputName
        );

        if (!isConsumed) {
          const key = `${nodeId}.${outputName}`;
          
          // 获取输出端口的语义标签
          const semanticLabel = this.getOutputSemanticLabel(node, outputName);
          
          // 构建语义标签感知的值
          const semanticValue = this.buildSemanticValue(semanticLabel, value);
          
          terminalOutputs[key] = semanticValue;
        }
      }
    }

    return terminalOutputs;
  }

  /**
   * 获取节点输出端口的语义标签
   */
  private getOutputSemanticLabel(node: WeaveNode, outputName: string): string {
    try {
      const plugin = this.registry.getPlugin(node.plugin);
      if (!plugin) {
        console.warn(`⚠️ 插件未找到: ${node.plugin}`);
        return "unknown";
      }

      const definition = plugin.getPluginDefinition();
      const nodeDefinition = definition.nodes[node.type.split('.').pop() || ''];
      
      if (!nodeDefinition) {
        console.warn(`⚠️ 节点定义未找到: ${node.type}`);
        return "unknown";
      }

      const semanticLabel = nodeDefinition.outputs[outputName];
      return semanticLabel || "unknown";
    } catch (error) {
      console.warn(`⚠️ 获取语义标签失败:`, error);
      return "unknown";
    }
  }

  /**
   * 构建语义标签感知的值
   */
  private buildSemanticValue(semanticLabel: string, value: unknown): SemanticValue {
    // 对于复合类型，需要递归构建嵌套结构
    if (this.isCompositeType(semanticLabel) && typeof value === 'object' && value !== null) {
      const compositeValue: Record<string, SemanticValue> = {};
      const typeDefinition = this.getTypeDefinition(semanticLabel);
      
      if (typeDefinition && typeDefinition.fields) {
        for (const [fieldName, fieldValue] of Object.entries(value as Record<string, unknown>)) {
          const fieldSemanticLabel = typeDefinition.fields[fieldName];
          if (fieldSemanticLabel) {
            compositeValue[fieldName] = this.buildSemanticValue(fieldSemanticLabel, fieldValue);
          }
        }
      }
      
      return {
        semantic_label: semanticLabel,
        value: compositeValue
      };
    }

    // 对于基础类型，直接包装
    return {
      semantic_label: semanticLabel,
      value: value
    };
  }

  /**
   * 检查是否为复合类型
   */
  private isCompositeType(semanticLabel: string): boolean {
    const typeDefinition = this.getTypeDefinition(semanticLabel);
    return typeDefinition?.kind === "composite" && !!typeDefinition.fields;
  }

  /**
   * 获取类型定义
   */
  private getTypeDefinition(semanticLabel: string): TypeDefinition | undefined {
    try {
      const [pluginName, typeName] = semanticLabel.split('.');
      const plugin = this.registry.getPlugin(pluginName);
      if (!plugin) return undefined;

      const definition = plugin.getPluginDefinition();
      return definition.semantic_labels[typeName];
    } catch (error) {
      return undefined;
    }
  }

  /**
   * 将语义标签感知的输出转换为原始值（向后兼容）
   */
  private extractRawOutputs(semanticOutputs: Record<string, SemanticValue>): Record<string, unknown> {
    const rawOutputs: Record<string, unknown> = {};
    
    for (const [key, semanticValue] of Object.entries(semanticOutputs)) {
      rawOutputs[key] = this.extractRawValue(semanticValue);
    }
    
    return rawOutputs;
  }

  /**
   * 从语义标签值中提取原始值
   */
  private extractRawValue(semanticValue: SemanticValue): unknown {
    if (typeof semanticValue.value === 'object' && semanticValue.value !== null) {
      // 检查是否为嵌套的语义标签结构
      const firstValue = Object.values(semanticValue.value)[0];
      if (firstValue && typeof firstValue === 'object' && 'semantic_label' in firstValue) {
        // 这是嵌套的语义标签结构，递归提取
        const rawObject: Record<string, unknown> = {};
        for (const [fieldName, fieldSemanticValue] of Object.entries(semanticValue.value as Record<string, SemanticValue>)) {
          rawObject[fieldName] = this.extractRawValue(fieldSemanticValue);
        }
        return rawObject;
      }
    }
    
    return semanticValue.value;
  }

  /**
   * 获取插件注册表（用于调试）
   */
  getRegistry(): PluginRegistry {
    return this.registry;
  }

  /**
   * 判断节点是否需要trigger输入
   */
  private nodeRequiresTrigger(node: WeaveNode): boolean {
    try {
      const plugin = this.registry.getPlugin(node.plugin);
      if (!plugin) return false;

      const definition = plugin.getPluginDefinition();
      const nodeDefinition = definition.nodes[node.type.split('.').pop() || ''];
      
      if (!nodeDefinition) return false;

      // 检查节点是否有trigger输入端口
      return 'trigger' in nodeDefinition.inputs;
    } catch (error) {
      // 如果无法确定，保守地认为需要trigger
      return true;
    }
  }
}
