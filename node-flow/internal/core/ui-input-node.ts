/**
 * 🧩 UI输入节点实现
 */

import { INode } from '../../public/interfaces.ts';
import { NodeType, Port } from '../../public/types.ts';

export class UIInputNode implements INode {
  public readonly id: string;
  public name: string;
  public readonly type: NodeType = NodeType.UI_INPUT;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  getInputPorts(): Port[] {
    return []; // UI输入节点没有输入端口
  }

  getOutputPorts(): Port[] {
    return [{ name: 'data', type: 'any' }];
  }

  getUserInput(): any {
    return { data: 'mock-user-input' };
  }

  process(data?: any): any {
    return this.getUserInput();
  }
} 