/**
 * 🧩 工作流序列化器
 */

import { FlowGraph, NodePosition, FlowMetadata } from '@node-flow/config/flow-graph.ts';
import { Node } from '@node-flow/core/node.ts';
import { NodeConfig } from '@node-flow/core/types.ts';
import { Connection } from '@node-flow/engine/dag-validator.ts';

export interface SerializedNode {
  id: string;
  name: string;
  type: string;
  position: NodePosition;
  config: NodeConfig;
}

export interface SerializedConnection {
  from: string;
  to: string;
}

export interface SerializedFlow {
  metadata: FlowMetadata;
  nodes: SerializedNode[];
  connections: SerializedConnection[];
  version: string;
  createdAt: string;
}

export class FlowSerializer {
  serialize(graph: FlowGraph): string {
    const nodes = graph.getAllNodes();
    const connections = graph.getAllConnections();
    
    const serializedNodes: SerializedNode[] = nodes.map(node => ({
      id: node.id,
      name: node.name,
      type: node.type,
      position: graph.getNodePosition(node.id) || { x: 0, y: 0 },
      config: {} // 基础节点暂时没有配置
    }));

    const serializedConnections: SerializedConnection[] = connections.map(conn => ({
      from: conn.from,
      to: conn.to
    }));

    const serializedFlow: SerializedFlow = {
      metadata: {
        ...graph.metadata,
        updatedAt: new Date().toISOString()
      },
      nodes: serializedNodes,
      connections: serializedConnections,
      version: '1.0.0',
      createdAt: graph.metadata.createdAt || new Date().toISOString()
    };

    return JSON.stringify(serializedFlow, null, 2);
  }

  deserialize(json: string): FlowGraph {
    const serializedFlow: SerializedFlow = JSON.parse(json);
    const graph = new FlowGraph();
    
    // 设置元数据
    graph.metadata = serializedFlow.metadata;
    
    // TODO: 这里需要节点工厂来重建节点
    // 暂时抛出错误，在下个任务中实现
    throw new Error('反序列化功能尚未实现');
  }
} 