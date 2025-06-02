/**
 * 🏭 节点工厂 - 创建各种类型的节点
 */

import { INode, INodeFactory } from '../../public/interfaces.ts';
import { NodeType, Port } from '../../public/types.ts';
import { PureNode } from '../core/pure-node.ts';
import { UIInputNode } from '../core/ui-input-node.ts';
import { UIOutputNode } from '../core/ui-output-node.ts';
import { AdvancedNode, AdvancedNodeConfig } from '../core/advanced-node.ts';

export interface CustomNodeTypeConfig {
  defaultInputs?: Port[];
  defaultOutputs?: Port[];
  extends?: NodeType;
  additionalInputs?: Port[];
  additionalOutputs?: Port[];
  process?: (inputs: any) => any;
}

export class NodeFactory implements INodeFactory {
  private customTypes = new Map<string, CustomNodeTypeConfig>();

  createNode(id: string, name: string, type: NodeType): INode {
    switch (type) {
      case NodeType.PURE:
        return new PureNode(id, name);
      case NodeType.UI_INPUT:
        return new UIInputNode(id, name);
      case NodeType.UI_OUTPUT:
        return new UIOutputNode(id, name);
      case NodeType.COMPOSITE:
        return new AdvancedNode(id, name, NodeType.COMPOSITE, {});
      default:
        throw new Error(`不支持的节点类型: ${type}`);
    }
  }

  createNodeFromType(id: string, name: string, typeString: string): INode {
    // 检查是否为自定义类型
    if (this.customTypes.has(typeString)) {
      const config = this.customTypes.get(typeString)!;
      
      let inputs = config.defaultInputs || [];
      let outputs = config.defaultOutputs || [];
      
      // 如果是继承类型，合并基础输入输出
      if (config.extends) {
        const baseNode = this.createNode('temp', 'temp', config.extends);
        if (baseNode.getInputPorts) {
          inputs = [...baseNode.getInputPorts(), ...inputs];
        }
        if (baseNode.getOutputPorts) {
          outputs = [...baseNode.getOutputPorts(), ...outputs];
        }
      }
      
      // 添加额外的输入输出
      if (config.additionalInputs) {
        inputs = [...inputs, ...config.additionalInputs];
      }
      if (config.additionalOutputs) {
        outputs = [...outputs, ...config.additionalOutputs];
      }
      
      return new AdvancedNode(id, name, typeString as NodeType, {
        inputs,
        outputs,
        process: config.process
      });
    }
    
    // 标准类型
    let nodeType: NodeType;
    
    switch (typeString) {
      case 'pure':
        nodeType = NodeType.PURE;
        break;
      case 'ui-input':
        nodeType = NodeType.UI_INPUT;
        break;
      case 'ui-output':
        nodeType = NodeType.UI_OUTPUT;
        break;
      case 'composite':
        nodeType = NodeType.COMPOSITE;
        break;
      default:
        throw new Error(`未知节点类型: ${typeString}`);
    }
    
    return this.createNode(id, name, nodeType);
  }

  createAdvancedNode(id: string, name: string, config: AdvancedNodeConfig): INode {
    return new AdvancedNode(id, name, NodeType.PURE, config);
  }

  createCompositeNode(id: string, name: string, config: AdvancedNodeConfig): INode {
    return new AdvancedNode(id, name, NodeType.COMPOSITE, config);
  }

  registerNodeType(typeName: string, config: CustomNodeTypeConfig): void {
    this.customTypes.set(typeName, config);
  }
} 