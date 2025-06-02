/**
 * 🧩 基础节点类
 */

export class Node {
  public readonly id: string;
  public readonly name: string;
  public readonly type: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
    this.type = 'basic';
  }
} 