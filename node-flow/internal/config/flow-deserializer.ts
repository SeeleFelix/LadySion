/**
 * 🧩 工作流反序列化器
 */

import { FlowGraph } from '@node-flow/internal/config/flow-graph.ts';
import { NodeFactory } from '@node-flow/internal/config/node-factory.ts';
import { SerializedFlow } from '@node-flow/internal/config/flow-serializer.ts';

export class FlowDeserializer {
  constructor(private nodeFactory: NodeFactory) {}

  deserialize(json: string): FlowGraph {
    let serializedFlow: SerializedFlow;
    
    try {
      serializedFlow = JSON.parse(json);
    } catch (error) {
      throw new Error(`JSON格式错误: ${error instanceof Error ? error.message : '未知错误'}`);
    }
    
    const graph = new FlowGraph();
    
    // 设置元数据
    graph.metadata = serializedFlow.metadata;
    
    // 重建节点
    for (const nodeData of serializedFlow.nodes) {
      try {
        const node = this.nodeFactory.createNodeFromType(
          nodeData.id,
          nodeData.name,
          nodeData.type
        );
        
        graph.addNode(node, nodeData.position);
      } catch (error) {
        if (error instanceof Error && error.message.includes('未知节点类型')) {
          throw new Error(`未知节点类型: ${nodeData.type}`);
        }
        throw error;
      }
    }
    
    // 重建连接
    for (const connectionData of serializedFlow.connections) {
      graph.addConnection(connectionData.from, connectionData.to);
    }
    
    return graph;
  }
} 