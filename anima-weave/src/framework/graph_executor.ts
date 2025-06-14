// AnimaWeave 图执行器
// 负责执行调度、控制流管理、数据流处理等功能

import type { WeaveGraph, WeaveConnection, WeaveNode, PluginRegistry, SemanticValue } from "./core.ts";

/**
 * 图执行器 - 处理图的动态执行
 */
export class GraphExecutor {
  constructor(private registry: PluginRegistry) {}

  /**
   * 执行图
   */
  async executeWeaveGraph(graph: WeaveGraph): Promise<Record<string, SemanticValue>> {
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
  private getTypeDefinition(semanticLabel: string): any | undefined {
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