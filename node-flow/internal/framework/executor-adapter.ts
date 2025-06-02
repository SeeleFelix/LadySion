/**
 * 🧩 图执行器适配器
 */

import { IGraphExecutor, IFlowGraph } from '../../public/interfaces.ts';
import { ExecutionResult } from '../../public/types.ts';
import { GraphExecutor } from '../engine/graph-executor.ts';

export class GraphExecutorAdapter implements IGraphExecutor {
  private executor = new GraphExecutor();

  async execute(graph: IFlowGraph): Promise<ExecutionResult> {
    const nodes = graph.getAllNodes();
    const connections = graph.getAllConnections();
    
    const result = await this.executor.execute(nodes as any[], connections);
    
    // 添加兼容字段
    return {
      ...result,
      executedNodes: result.success ? nodes.map(n => n.id) : [],
      totalNodes: nodes.length
    };
  }
} 