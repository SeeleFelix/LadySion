// AnimaWeave 图执行器
// 负责执行调度、控制流管理、数据流处理等功能

import type { WeaveGraph, WeaveConnection, WeaveNode, VesselRegistry, SemanticValue, Port } from "./core.ts";
import { Port as PortClass } from "./core.ts";

/**
 * 图执行器 - 处理图的动态执行
 */
export class GraphExecutor {
  constructor(private registry: VesselRegistry) {}

  /**
   * 执行图
   */
  async executeWeaveGraph(graph: WeaveGraph): Promise<Record<string, SemanticValue>> {
    console.log("🔄 开始执行图...");

    const nodeResults = new Map<string, Port[]>();
    
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
      
      console.log(`⚙️ 执行节点: ${nodeId} (${node.vessel}.${node.type})`);

      // 收集输入Port数组
      const inputPorts = this.collectNodeInputPorts(node, graph.connections, nodeResults);

      // 执行节点
      const outputPorts = await this.registry.executeNode(node.vessel, node.type, inputPorts);

      // 存储结果
      nodeResults.set(nodeId, outputPorts);
      console.log(`✅ 节点 ${nodeId} 执行完成:`, outputPorts.map(p => ({ name: p.name, value: p.getValue()?.value })));

      // 处理控制输出，更新下游节点的就绪状态
      this.updateDownstreamReadiness(nodeId, outputPorts, graph, receivedControlInputs, controlInputCounts, readyQueue);
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
      // 这样可以支持任何容器的Signal类型，不只是basic.Signal
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
    outputs: Port[],
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
      const outputValue = outputs.find(p => p.name === connection.from.output)?.getValue();
      
      // 只有当控制信号为true时才计数
      if (outputValue?.value === true) {
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
    nodeResults: Map<string, Port[]>,
  ): Record<string, unknown> {
    const inputs: Record<string, unknown> = {};

    // 从连接收集输入
    const incomingConnections = connections.filter((conn) => conn.to.node === node.id);

    for (const connection of incomingConnections) {
      const sourceResults = nodeResults.get(connection.from.node);
      if (sourceResults) {
        // 在Port数组中找到对应的输出端口
        const sourcePort = sourceResults.find(port => port.name === connection.from.output);
        if (sourcePort) {
          const value = sourcePort.getValue();
          inputs[connection.to.input] = value ? value.value : undefined;
        }
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
    nodeResults: Map<string, Port[]>,
  ): Record<string, SemanticValue> {
    const terminalOutputs: Record<string, SemanticValue> = {};

    for (const [nodeId, results] of nodeResults) {
      const node = graph.nodes[nodeId];
      
      for (const port of results) {
        const isConsumed = graph.connections.some((conn) =>
          conn.from.node === nodeId && conn.from.output === port.name
        );

        if (!isConsumed) {
          const key = `${nodeId}.${port.name}`;
          
          // 获取输出端口的语义标签
          const semanticLabel = this.getOutputSemanticLabel(node, port.name);
          
          // 构建语义标签感知的值
          const portValue = port.getValue();
          const rawValue = portValue ? portValue.value : undefined;
          const semanticValue = this.buildSemanticValue(semanticLabel, rawValue);
          
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
      const metadata = this.registry.getNodeMetadata(node.vessel, node.type);
      if (!metadata) {
        console.warn(`⚠️ 节点元数据未找到: ${node.vessel}.${node.type}`);
        return "unknown";
      }

      const outputPort = metadata.outputs.find(port => port.name === outputName);
      if (!outputPort) {
        console.warn(`⚠️ 输出端口未找到: ${outputName}`);
        return "unknown";
      }

      // 从Port的label构造器获取标签名称
      const labelInstance = new outputPort.label(null);
      return `${node.vessel}.${labelInstance.labelName}`;
    } catch (error) {
      console.warn(`⚠️ 获取语义标签失败:`, error);
      return "unknown";
    }
  }

  /**
   * 构建语义标签感知的值
   */
  private buildSemanticValue(semanticLabel: string, value: unknown): SemanticValue {
    // 如果值是复合类型（包含SemanticLabel字段），需要递归处理
    if (typeof value === 'object' && value !== null) {
      const obj = value as Record<string, unknown>;
      const processedValue: Record<string, SemanticValue> = {};
      
      for (const [fieldName, fieldValue] of Object.entries(obj)) {
        // 检查字段是否是SemanticLabel
        if (fieldValue && typeof fieldValue === 'object' && 'labelName' in fieldValue && 'value' in fieldValue) {
          const semanticLabel = fieldValue as any;
          const fieldSemanticLabel = `basic.${semanticLabel.labelName}`;
          processedValue[fieldName] = this.buildSemanticValue(fieldSemanticLabel, semanticLabel.value);
        } else {
          // 如果不是SemanticLabel，直接使用原值
          processedValue[fieldName] = {
            semantic_label: "unknown",
            value: fieldValue
          };
        }
      }
      
      return {
        semantic_label: semanticLabel,
        value: processedValue
      };
    }

    // 对于基础类型，直接包装
    return {
      semantic_label: semanticLabel,
      value: value
    };
  }

  /**
   * 判断节点是否需要trigger输入
   */
  private nodeRequiresTrigger(node: WeaveNode): boolean {
    try {
      const metadata = this.registry.getNodeMetadata(node.vessel, node.type);
      if (!metadata) return false;

      // 检查节点是否有trigger输入端口
      return metadata.inputs.some(port => port.name === 'trigger');
    } catch (error) {
      // 如果无法确定，保守地认为需要trigger
      return true;
    }
  }

  /**
   * 将输入数据转换为Port数组
   */
  private convertDataToPorts(node: WeaveNode, data: Record<string, unknown>): Port[] {
    const ports: Port[] = [];
    
    // 获取节点元数据以了解输入端口的类型
    const metadata = this.registry.getNodeMetadata(node.vessel, node.type);
    if (!metadata) {
      throw new Error(`Node metadata not found: ${node.vessel}.${node.type}`);
    }
    
    // 为每个输入创建Port
    for (const [inputName, value] of Object.entries(data)) {
      const inputPort = metadata.inputs.find(port => port.name === inputName);
      if (inputPort) {
        const label = new inputPort.label(value);
        const port = new PortClass(inputName, inputPort.label, label);
        ports.push(port);
      }
    }
    
    return ports;
  }

  /**
   * 将输入数据转换为Port数组
   */
  private collectNodeInputPorts(node: WeaveNode, connections: WeaveConnection[], nodeResults: Map<string, Port[]>): Port[] {
    const inputs: Record<string, unknown> = this.collectNodeInputs(node, connections, nodeResults);
    return this.convertDataToPorts(node, inputs);
  }
} 