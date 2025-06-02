/**
 * 🧩 图执行器适配器 - 支持端口连接和复合节点
 */

import { IGraphExecutor, IFlowGraph, INode } from '../../public/interfaces.ts';
import { ExecutionResult, NodeType } from '../../public/types.ts';
import { AdvancedNode } from '../core/advanced-node.ts';

export class GraphExecutorAdapter implements IGraphExecutor {

  async execute(graph: IFlowGraph): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      const nodes = graph.getAllNodes();
      const portConnections = graph.getPortConnections();
      
      // 构建依赖图
      const dependencyMap = this.buildPortDependencyMap(portConnections);
      
      // 拓扑排序
      const sortedNodes = this.topologicalSort(nodes, dependencyMap);
      
      // 执行节点
      const nodeResults = new Map<string, any>();
      
      for (const node of sortedNodes) {
        try {
          const inputData = this.collectPortInputData(node, dependencyMap, nodeResults);
          const result = await this.executeNode(node, inputData);
          
          if (result !== undefined) {
            nodeResults.set(node.id, result);
          }
        } catch (error) {
          return {
            success: false,
            error: `节点 ${node.id} 执行失败: ${error instanceof Error ? error.message : '未知错误'}`,
            executionTime: Date.now() - startTime,
            executedNodes: Array.from(nodeResults.keys()),
            totalNodes: nodes.length
          };
        }
      }
      
      return {
        success: true,
        nodeResults,
        executionTime: Date.now() - startTime,
        executedNodes: nodes.map(n => n.id),
        totalNodes: nodes.length
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '执行失败',
        executionTime: Date.now() - startTime,
        executedNodes: [],
        totalNodes: 0
      };
    }
  }

  private buildPortDependencyMap(portConnections: any[]): Map<string, Array<{fromNode: string, fromPort: string, toPort: string}>> {
    const dependencyMap = new Map<string, Array<{fromNode: string, fromPort: string, toPort: string}>>();
    
    for (const conn of portConnections) {
      const dependencies = dependencyMap.get(conn.toNode) || [];
      dependencies.push({
        fromNode: conn.fromNode,
        fromPort: conn.fromPort,
        toPort: conn.toPort
      });
      dependencyMap.set(conn.toNode, dependencies);
    }
    
    return dependencyMap;
  }

  private topologicalSort(nodes: INode[], dependencyMap: Map<string, any[]>): INode[] {
    const visited = new Set<string>();
    const result: INode[] = [];
    const nodeMap = new Map<string, INode>();
    
    nodes.forEach(node => nodeMap.set(node.id, node));
    
    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      const dependencies = dependencyMap.get(nodeId) || [];
      for (const dep of dependencies) {
        visit(dep.fromNode);
      }
      
      const node = nodeMap.get(nodeId);
      if (node) {
        result.push(node);
      }
    };
    
    for (const node of nodes) {
      visit(node.id);
    }
    
    return result;
  }

  private collectPortInputData(node: INode, dependencyMap: Map<string, any[]>, nodeResults: Map<string, any>): any {
    const dependencies = dependencyMap.get(node.id) || [];
    const inputData: any = {};
    
    for (const dep of dependencies) {
      const sourceResult = nodeResults.get(dep.fromNode);
      if (sourceResult && dep.fromPort in sourceResult) {
        inputData[dep.toPort] = sourceResult[dep.fromPort];
      }
    }
    
    return inputData;
  }

  private async executeNode(node: INode, inputData: any): Promise<any> {
    // 如果是复合节点，递归执行其子图
    if (node.type === NodeType.COMPOSITE && node.getSubGraph) {
      const subGraph = node.getSubGraph();
      if (subGraph) {
        const subResult = await this.execute(subGraph);
        return subResult.success ? subResult.nodeResults : undefined;
      }
    }
    
    // 执行普通节点
    if (node.process) {
      return node.process(inputData);
    }
    
    return undefined;
  }
} 