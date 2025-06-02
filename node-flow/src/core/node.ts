/**
 * 🧩 基础节点类
 */

import { NodeType } from '@node-flow/core/types.ts';

export class Node {
  public readonly id: string;
  public readonly name: string;
  public readonly type: NodeType;

  constructor(id: string, name: string, type: NodeType = NodeType.PURE) {
    this.id = id;
    this.name = name;
    this.type = type;
  }
} 