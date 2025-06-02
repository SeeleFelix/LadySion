/**
 * 🧩 纯函数节点实现
 */

import { INode } from '../../public/interfaces.ts';
import { NodeType, Port } from '../../public/types.ts';

export class PureNode implements INode {
  public readonly id: string;
  public name: string;
  public readonly type: NodeType = NodeType.PURE;
  public readonly hasSideEffects: boolean = false;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  getInputPorts(): Port[] {
    return [{ name: 'data', type: 'any' }];
  }

  getOutputPorts(): Port[] {
    return [{ name: 'result', type: 'any' }];
  }

  process(data?: any): any {
    // 最简实现：直接返回输入数据
    return { result: data?.data || data };
  }
} 