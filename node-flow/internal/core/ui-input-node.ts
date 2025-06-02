/**
 * 🧩 UI输入节点实现
 */

import { Node } from '@node-flow/internal/core/node.ts';
import { NodeType, NodeData } from '@node-flow/internal/core/types.ts';

export class UIInputNode extends Node {
  public readonly hasSideEffects: boolean = true;
  public readonly canHaveOutputs: boolean = true;

  constructor(id: string, name: string) {
    super(id, name, NodeType.UI_INPUT);
  }

  async getUserInput(): Promise<NodeData> {
    // 最简实现：返回模拟输入数据
    return { userInput: 'mock input data' };
  }
} 