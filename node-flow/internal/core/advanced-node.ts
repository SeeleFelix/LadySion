/**
 * 🧩 高级节点 - 支持多输入输出端口
 */

import { INode, IFlowGraph } from '../../public/interfaces.ts';
import { NodeType, Port } from '../../public/types.ts';

export interface AdvancedNodeConfig {
  inputs?: Port[];
  outputs?: Port[];
  process?: (inputs: any) => any;
  subGraph?: IFlowGraph;
  exposedInputs?: Array<{ internalNode: string; internalPort: string; externalName: string }>;
  exposedOutputs?: Array<{ internalNode: string; internalPort: string; externalName: string }>;
}

export class AdvancedNode implements INode {
  public readonly id: string;
  public name: string;
  public readonly type: NodeType;
  
  private inputs: Port[];
  private outputs: Port[];
  private processFunction?: (inputs: any) => any;
  private subGraph?: IFlowGraph;
  private exposedInputs?: Array<{ internalNode: string; internalPort: string; externalName: string }>;
  private exposedOutputs?: Array<{ internalNode: string; internalPort: string; externalName: string }>;

  constructor(id: string, name: string, type: NodeType, config: AdvancedNodeConfig) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.inputs = config.inputs || [];
    this.outputs = config.outputs || [];
    this.processFunction = config.process;
    this.subGraph = config.subGraph;
    this.exposedInputs = config.exposedInputs;
    this.exposedOutputs = config.exposedOutputs;
  }

  getInputPorts(): Port[] {
    if (this.type === NodeType.COMPOSITE && this.exposedInputs) {
      return this.exposedInputs.map(exp => ({ name: exp.externalName, type: 'any' }));
    }
    return [...this.inputs];
  }

  getOutputPorts(): Port[] {
    if (this.type === NodeType.COMPOSITE && this.exposedOutputs) {
      return this.exposedOutputs.map(exp => ({ name: exp.externalName, type: 'any' }));
    }
    return [...this.outputs];
  }

  getSubGraph(): IFlowGraph | undefined {
    return this.subGraph;
  }

  process(data?: any): any {
    if (this.processFunction) {
      return this.processFunction(data);
    }
    return data;
  }

  getUserInput(): any {
    if (this.type === NodeType.UI_INPUT) {
      // 返回默认输入值
      const result: any = {};
      this.outputs.forEach(port => {
        result[port.name] = port.defaultValue || null;
      });
      return result;
    }
    return null;
  }

  displayOutput(data: any): void {
    if (this.type === NodeType.UI_OUTPUT) {
      console.log(`[${this.name}] Output:`, data);
    }
  }
} 