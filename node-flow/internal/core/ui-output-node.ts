/**
 * 🧩 UI输出节点实现
 */

import { INode } from '../../public/interfaces.ts';
import { NodeType, Port } from '../../public/types.ts';

export class UIOutputNode implements INode {
  public readonly id: string;
  public name: string;
  public readonly type: NodeType = NodeType.UI_OUTPUT;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  getInputPorts(): Port[] {
    return [{ name: 'data', type: 'any' }];
  }

  getOutputPorts(): Port[] {
    return []; // UI输出节点没有输出端口
  }

  displayOutput(data: any): void {
    console.log(`[${this.name}] Output:`, data);
  }

  process(data?: any): any {
    this.displayOutput(data);
    return undefined; // UI输出节点不返回数据
  }
} 