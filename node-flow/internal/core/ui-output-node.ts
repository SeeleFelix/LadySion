/**
 * 🧩 UI输出节点实现
 */

import { Node } from '@node-flow/internal/core/node.ts';
import { NodeType, NodeData } from '@node-flow/internal/core/types.ts';

export class UIOutputNode extends Node {
  public readonly hasSideEffects: boolean = true;
  public readonly canHaveOutputs: boolean = false;

  constructor(id: string, name: string) {
    super(id, name, NodeType.UI_OUTPUT);
  }

  async displayOutput(data: NodeData): Promise<void> {
    // 最简实现：模拟显示输出
    console.log(`UI Output [${this.name}]:`, data);
  }
} 