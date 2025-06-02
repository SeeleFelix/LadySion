/**
 * 🧩 节点工厂 - 用于动态创建不同类型的节点
 */

import { Node } from '@node-flow/internal/core/node.ts';
import { PureNode } from '@node-flow/internal/core/pure-node.ts';
import { UIInputNode } from '@node-flow/internal/core/ui-input-node.ts';
import { UIOutputNode } from '@node-flow/internal/core/ui-output-node.ts';
import { NodeType } from '@node-flow/internal/core/types.ts';

export class NodeFactory {
  createNode(id: string, name: string, type: NodeType): Node {
    switch (type) {
      case NodeType.PURE:
        return new PureNode(id, name);
      case NodeType.UI_INPUT:
        return new UIInputNode(id, name);
      case NodeType.UI_OUTPUT:
        return new UIOutputNode(id, name);
      case NodeType.COMPOSITE:
        throw new Error('复合节点类型暂未实现');
      default:
        throw new Error(`不支持的节点类型: ${type}`);
    }
  }

  createNodeFromType(id: string, name: string, typeString: string): Node {
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
} 