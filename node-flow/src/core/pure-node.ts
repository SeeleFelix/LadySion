/**
 * 🧩 纯函数节点实现
 */

import { Node } from '@node-flow/core/node.ts';
import { NodeType, NodeData } from '@node-flow/core/types.ts';

export class PureNode extends Node {
  public readonly hasSideEffects: boolean = false;

  constructor(id: string, name: string) {
    super(id, name, NodeType.PURE);
  }

  async process(data: NodeData): Promise<NodeData> {
    // 最简实现：直接返回输入数据
    return data;
  }
} 