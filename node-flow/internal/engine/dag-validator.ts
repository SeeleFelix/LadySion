/**
 * 🧩 DAG验证器实现
 * 高性能的循环检测和拓扑排序算法
 */

import { Node } from '@node-flow/internal/core/node.ts';

export interface Connection {
  from: string;
  to: string;
}

export class DAGValidator {
  validateDAG(nodes: Node[], connections: Connection[]): boolean {
    // 使用DFS进行循环检测
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const adjacencyList = this.buildAdjacencyList(nodes, connections);
    
    const hasCycle = (nodeId: string): boolean => {
      if (visiting.has(nodeId)) {
        throw new Error('检测到循环依赖');
      }
      if (visited.has(nodeId)) {
        return false;
      }
      
      visiting.add(nodeId);
      const neighbors = adjacencyList.get(nodeId) || [];
      
      for (const neighbor of neighbors) {
        hasCycle(neighbor);
      }
      
      visiting.delete(nodeId);
      visited.add(nodeId);
      return false;
    };
    
    for (const node of nodes) {
      if (!visited.has(node.id)) {
        hasCycle(node.id);
      }
    }
    
    return true;
  }

  topologicalSort(nodes: Node[], connections: Connection[]): Node[] {
    // 使用Kahn算法进行拓扑排序
    const adjacencyList = this.buildAdjacencyList(nodes, connections);
    const inDegree = new Map<string, number>();
    const nodeMap = new Map(nodes.map(node => [node.id, node]));
    
    // 初始化入度
    for (const node of nodes) {
      inDegree.set(node.id, 0);
    }
    
    for (const connection of connections) {
      inDegree.set(connection.to, (inDegree.get(connection.to) || 0) + 1);
    }
    
    // 找到入度为0的节点
    const queue: string[] = [];
    for (const [nodeId, degree] of inDegree) {
      if (degree === 0) {
        queue.push(nodeId);
      }
    }
    
    const result: Node[] = [];
    
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      result.push(nodeMap.get(nodeId)!);
      
      const neighbors = adjacencyList.get(nodeId) || [];
      for (const neighbor of neighbors) {
        const newDegree = inDegree.get(neighbor)! - 1;
        inDegree.set(neighbor, newDegree);
        
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }
    
    return result;
  }

  private buildAdjacencyList(nodes: Node[], connections: Connection[]): Map<string, string[]> {
    const adjacencyList = new Map<string, string[]>();
    
    // 初始化节点
    for (const node of nodes) {
      adjacencyList.set(node.id, []);
    }
    
    // 添加边
    for (const connection of connections) {
      const neighbors = adjacencyList.get(connection.from) || [];
      neighbors.push(connection.to);
      adjacencyList.set(connection.from, neighbors);
    }
    
    return adjacencyList;
  }
} 