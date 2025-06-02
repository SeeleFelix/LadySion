/**
 * 🧩 工作流图管理器
 */

import { IFlowGraph, INode } from '../../public/interfaces.ts';
import { NodePosition, FlowMetadata, Connection, PortConnection } from '../../public/types.ts';
import { AdvancedNode } from '../core/advanced-node.ts';

export class FlowGraph implements IFlowGraph {
  private nodes: Map<string, INode> = new Map();
  private connections: Connection[] = [];
  private portConnections: PortConnection[] = [];
  private nodePositions: Map<string, NodePosition> = new Map();
  public metadata: FlowMetadata = {};

  addNode(node: INode, position?: NodePosition): void {
    this.nodes.set(node.id, node);
    if (position) {
      this.nodePositions.set(node.id, position);
    } else {
      // 默认位置
      this.nodePositions.set(node.id, { x: 0, y: 0 });
    }
  }

  removeNode(nodeId: string): void {
    this.nodes.delete(nodeId);
    this.nodePositions.delete(nodeId);
    // 移除相关连接
    this.connections = this.connections.filter(
      conn => conn.from !== nodeId && conn.to !== nodeId
    );
    this.portConnections = this.portConnections.filter(
      conn => conn.fromNode !== nodeId && conn.toNode !== nodeId
    );
  }

  getNode(nodeId: string): INode | undefined {
    return this.nodes.get(nodeId);
  }

  getAllNodes(): INode[] {
    return Array.from(this.nodes.values());
  }

  addConnection(from: string, to: string): void {
    if (!this.nodes.has(from) || !this.nodes.has(to)) {
      throw new Error(`节点不存在: ${from} 或 ${to}`);
    }
    this.connections.push({ from, to });
  }

  removeConnection(from: string, to: string): void {
    this.connections = this.connections.filter(
      conn => !(conn.from === from && conn.to === to)
    );
  }

  getAllConnections(): Connection[] {
    return [...this.connections];
  }

  addPortConnection(fromNode: string, fromPort: string, toNode: string, toPort: string): void {
    if (!this.nodes.has(fromNode) || !this.nodes.has(toNode)) {
      throw new Error(`节点不存在: ${fromNode} 或 ${toNode}`);
    }

    // 验证端口存在
    const fromNodeObj = this.nodes.get(fromNode)!;
    const toNodeObj = this.nodes.get(toNode)!;
    
    if (fromNodeObj.getOutputPorts && !fromNodeObj.getOutputPorts().some(p => p.name === fromPort)) {
      throw new Error(`输出端口不存在: ${fromNode}.${fromPort}`);
    }
    
    if (toNodeObj.getInputPorts && !toNodeObj.getInputPorts().some(p => p.name === toPort)) {
      throw new Error(`输入端口不存在: ${toNode}.${toPort}`);
    }

    // 验证输入端口连接唯一性
    const existingConnection = this.portConnections.find(
      conn => conn.toNode === toNode && conn.toPort === toPort
    );
    if (existingConnection) {
      throw new Error('输入端口已被占用');
    }

    this.portConnections.push({ fromNode, fromPort, toNode, toPort });
  }

  removePortConnection(fromNode: string, fromPort: string, toNode: string, toPort: string): void {
    this.portConnections = this.portConnections.filter(
      conn => !(conn.fromNode === fromNode && conn.fromPort === fromPort && 
                conn.toNode === toNode && conn.toPort === toPort)
    );
  }

  getPortConnections(): PortConnection[] {
    return [...this.portConnections];
  }

  packNodesAsComposite(nodeIds: string[], compositeId: string, config: any): INode {
    // 获取要打包的节点
    const nodesToPack = nodeIds.map(id => {
      const node = this.nodes.get(id);
      if (!node) {
        throw new Error(`节点不存在: ${id}`);
      }
      return node;
    });

    // 创建子图
    const subGraph = new FlowGraph();
    nodesToPack.forEach(node => {
      subGraph.addNode(node, this.getNodePosition(node.id));
    });

    // 复制内部连接
    this.portConnections.forEach(conn => {
      if (nodeIds.includes(conn.fromNode) && nodeIds.includes(conn.toNode)) {
        subGraph.addPortConnection(conn.fromNode, conn.fromPort, conn.toNode, conn.toPort);
      }
    });

    // 创建复合节点
    const compositeNode = new AdvancedNode(compositeId, compositeId, 'composite' as any, {
      subGraph,
      exposedInputs: config.exposedInputs,
      exposedOutputs: config.exposedOutputs
    });

    // 从当前图中移除原节点
    nodeIds.forEach(id => this.removeNode(id));

    // 添加复合节点
    this.addNode(compositeNode);

    return compositeNode;
  }

  getNodePosition(nodeId: string): NodePosition | undefined {
    return this.nodePositions.get(nodeId);
  }

  setNodePosition(nodeId: string, position: NodePosition): void {
    if (!this.nodes.has(nodeId)) {
      throw new Error(`节点不存在: ${nodeId}`);
    }
    this.nodePositions.set(nodeId, position);
  }

  clear(): void {
    this.nodes.clear();
    this.connections = [];
    this.portConnections = [];
    this.nodePositions.clear();
    this.metadata = {};
  }
} 