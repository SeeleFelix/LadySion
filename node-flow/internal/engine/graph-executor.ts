/**
 * 🧩 图执行引擎实现
 */

import { Node } from '@node-flow/core/node.ts';
import { PureNode } from '@node-flow/core/pure-node.ts';
import { UIInputNode } from '@node-flow/core/ui-input-node.ts';
import { UIOutputNode } from '@node-flow/core/ui-output-node.ts';
import { NodeData } from '@node-flow/core/types.ts';
import { DAGValidator, Connection } from '@node-flow/engine/dag-validator.ts';

export interface ExecutionResult {
  success: boolean;
  error?: string;
  nodeResults?: Map<string, NodeData>;
  executionTime?: number;
}

export class GraphExecutor {
  private validator: DAGValidator;

  constructor() {
    this.validator = new DAGValidator();
  }

  async execute(nodes: Node[], connections: Connection[]): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      // 1. 验证DAG
      this.validator.validateDAG(nodes, connections);
      
      // 2. 获取拓扑排序
      const sortedNodes = this.validator.topologicalSort(nodes, connections);
      
      // 3. 执行节点
      const nodeResults = new Map<string, NodeData>();
      const dependencyMap = this.buildDependencyMap(connections);
      
      for (const node of sortedNodes) {
        try {
          const inputData = this.collectInputData(node.id, dependencyMap, nodeResults);
          const result = await this.executeNode(node, inputData);
          
          if (result !== null) {
            nodeResults.set(node.id, result);
          }
        } catch (error) {
          return {
            success: false,
            error: `节点 ${node.id} 执行失败: ${error instanceof Error ? error.message : '未知错误'}`,
            executionTime: Date.now() - startTime
          };
        }
      }
      
      return {
        success: true,
        nodeResults,
        executionTime: Date.now() - startTime
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '执行失败',
        executionTime: Date.now() - startTime
      };
    }
  }

  private buildDependencyMap(connections: Connection[]): Map<string, string[]> {
    const dependencyMap = new Map<string, string[]>();
    
    for (const connection of connections) {
      const dependencies = dependencyMap.get(connection.to) || [];
      dependencies.push(connection.from);
      dependencyMap.set(connection.to, dependencies);
    }
    
    return dependencyMap;
  }

  private collectInputData(nodeId: string, dependencyMap: Map<string, string[]>, nodeResults: Map<string, NodeData>): NodeData {
    const dependencies = dependencyMap.get(nodeId) || [];
    const inputData: NodeData = {};
    
    for (const depId of dependencies) {
      const depResult = nodeResults.get(depId);
      if (depResult) {
        Object.assign(inputData, depResult);
      }
    }
    
    return inputData;
  }

  private async executeNode(node: Node, inputData: NodeData): Promise<NodeData | null> {
    if (node instanceof PureNode) {
      return await node.process(inputData);
    } else if (node instanceof UIInputNode) {
      return await node.getUserInput();
    } else if (node instanceof UIOutputNode) {
      await node.displayOutput(inputData);
      return null; // UI输出节点不产生数据输出
    }
    
    throw new Error(`不支持的节点类型: ${node.constructor.name}`);
  }
} 