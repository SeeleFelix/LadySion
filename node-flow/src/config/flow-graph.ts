/**
 * 🧩 工作流图管理器
 */

import { Node } from '@node-flow/core/node.ts';
import { Connection } from '@node-flow/engine/dag-validator.ts';

export interface NodePosition {
  x: number;
  y: number;
}

export interface FlowMetadata {
  name?: string;
  description?: string;
  version?: string;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class FlowGraph {
  private nodes: Map<string, Node> = new Map();
  private connections: Connection[] = [];
  private nodePositions: Map<string, NodePosition> = new Map();
  public metadata: FlowMetadata = {};

  addNode(node: Node, position?: NodePosition): void {
    this.nodes.set(node.id, node);
    if (position) {
      this.nodePositions.set(node.id, position);
    } else {
      // 默认位置
      this.nodePositions.set(node.id, { x: 0, y: 0 });
    }
  }

  removeNode(nodeId: string): void {
    this.nodes.delete(nodeId);
    this.nodePositions.delete(nodeId);
    // 移除相关连接
    this.connections = this.connections.filter(
      conn => conn.from !== nodeId && conn.to !== nodeId
    );
  }

  getNode(nodeId: string): Node | undefined {
    return this.nodes.get(nodeId);
  }

  getAllNodes(): Node[] {
    return Array.from(this.nodes.values());
  }

  addConnection(from: string, to: string): void {
    if (!this.nodes.has(from) || !this.nodes.has(to)) {
      throw new Error(`节点不存在: ${from} 或 ${to}`);
    }
    this.connections.push({ from, to });
  }

  removeConnection(from: string, to: string): void {
    this.connections = this.connections.filter(
      conn => !(conn.from === from && conn.to === to)
    );
  }

  getAllConnections(): Connection[] {
    return [...this.connections];
  }

  getNodePosition(nodeId: string): NodePosition | undefined {
    return this.nodePositions.get(nodeId);
  }

  setNodePosition(nodeId: string, position: NodePosition): void {
    if (!this.nodes.has(nodeId)) {
      throw new Error(`节点不存在: ${nodeId}`);
    }
    this.nodePositions.set(nodeId, position);
  }

  clear(): void {
    this.nodes.clear();
    this.connections = [];
    this.nodePositions.clear();
    this.metadata = {};
  }
} 