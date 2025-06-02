/**
 * 🧩 工作流图编辑器
 */

import { FlowGraph } from '@node-flow/internal/config/flow-graph.ts';
import { NodePosition } from '../../public/types.ts';
import { NodeFactory } from '@node-flow/internal/config/node-factory.ts';
import { DAGValidator } from '@node-flow/internal/engine/dag-validator.ts';
import { NodeType } from '@node-flow/internal/core/types.ts';
import { BaseCommand, BatchCommand, Command } from '@node-flow/internal/config/command.ts';

export class AddNodeCommand extends BaseCommand {
  private nodeAdded = false;

  constructor(
    private graph: FlowGraph,
    private factory: NodeFactory,
    private nodeId: string,
    private nodeName: string,
    private nodeType: NodeType,
    private position?: NodePosition
  ) {
    super();
  }

  override canExecute(): boolean {
    return super.canExecute() && !this.graph.getNode(this.nodeId);
  }

  doExecute(): void {
    if (this.graph.getNode(this.nodeId)) {
      throw new Error(`节点ID已存在: ${this.nodeId}`);
    }

    const node = this.factory.createNode(this.nodeId, this.nodeName, this.nodeType);
    this.graph.addNode(node, this.position);
    this.nodeAdded = true;
  }

  doUndo(): void {
    if (this.nodeAdded) {
      this.graph.removeNode(this.nodeId);
      this.nodeAdded = false;
    }
  }
}

export class RemoveNodeCommand extends BaseCommand {
  private removedNode: any = null;
  private removedPosition: NodePosition | undefined;
  private removedConnections: Array<{ from: string; to: string }> = [];

  constructor(
    private graph: FlowGraph,
    private nodeId: string
  ) {
    super();
  }

  override canExecute(): boolean {
    return super.canExecute() && !!this.graph.getNode(this.nodeId);
  }

  doExecute(): void {
    const node = this.graph.getNode(this.nodeId);
    if (!node) {
      throw new Error(`节点不存在: ${this.nodeId}`);
    }

    // 保存删除的数据以便撤销
    this.removedNode = node;
    this.removedPosition = this.graph.getNodePosition(this.nodeId);
    this.removedConnections = this.graph.getAllConnections().filter(
      conn => conn.from === this.nodeId || conn.to === this.nodeId
    );

    this.graph.removeNode(this.nodeId);
  }

  doUndo(): void {
    if (this.removedNode) {
      this.graph.addNode(this.removedNode, this.removedPosition);
      
      // 恢复连接
      for (const conn of this.removedConnections) {
        this.graph.addConnection(conn.from, conn.to);
      }
    }
  }
}

export class UpdateNodeNameCommand extends BaseCommand {
  private oldName: string = '';

  constructor(
    private graph: FlowGraph,
    private nodeId: string,
    private newName: string
  ) {
    super();
  }

  override canExecute(): boolean {
    return super.canExecute() && !!this.graph.getNode(this.nodeId);
  }

  doExecute(): void {
    const node = this.graph.getNode(this.nodeId);
    if (!node) {
      throw new Error(`节点不存在: ${this.nodeId}`);
    }

    this.oldName = node.name;
    node.name = this.newName;
  }

  doUndo(): void {
    const node = this.graph.getNode(this.nodeId);
    if (node) {
      node.name = this.oldName;
    }
  }
}

export class MoveNodeCommand extends BaseCommand {
  private oldPosition: NodePosition | undefined;

  constructor(
    private graph: FlowGraph,
    private nodeId: string,
    private newPosition: NodePosition
  ) {
    super();
  }

  override canExecute(): boolean {
    return super.canExecute() && !!this.graph.getNode(this.nodeId);
  }

  doExecute(): void {
    if (!this.graph.getNode(this.nodeId)) {
      throw new Error(`节点不存在: ${this.nodeId}`);
    }

    this.oldPosition = this.graph.getNodePosition(this.nodeId);
    this.graph.setNodePosition(this.nodeId, this.newPosition);
  }

  doUndo(): void {
    if (this.oldPosition) {
      this.graph.setNodePosition(this.nodeId, this.oldPosition);
    }
  }
}

export class AddConnectionCommand extends BaseCommand {
  private validator = new DAGValidator();

  constructor(
    private graph: FlowGraph,
    private fromNodeId: string,
    private toNodeId: string
  ) {
    super();
  }

  override canExecute(): boolean {
    if (!super.canExecute()) return false;
    if (!this.graph.getNode(this.fromNodeId) || !this.graph.getNode(this.toNodeId)) {
      return false;
    }

    // 检查是否会产生循环
    const testConnections = [...this.graph.getAllConnections(), { from: this.fromNodeId, to: this.toNodeId }];
    try {
      this.validator.validateDAG(this.graph.getAllNodes(), testConnections);
      return true;
    } catch {
      return false;
    }
  }

  doExecute(): void {
    if (!this.graph.getNode(this.fromNodeId) || !this.graph.getNode(this.toNodeId)) {
      throw new Error(`节点不存在: ${this.fromNodeId} 或 ${this.toNodeId}`);
    }

    // 再次检查循环
    const testConnections = [...this.graph.getAllConnections(), { from: this.fromNodeId, to: this.toNodeId }];
    try {
      this.validator.validateDAG(this.graph.getAllNodes(), testConnections);
    } catch {
      throw new Error('会产生循环依赖');
    }

    this.graph.addConnection(this.fromNodeId, this.toNodeId);
  }

  doUndo(): void {
    this.graph.removeConnection(this.fromNodeId, this.toNodeId);
  }
}

export class RemoveConnectionCommand extends BaseCommand {
  constructor(
    private graph: FlowGraph,
    private fromNodeId: string,
    private toNodeId: string
  ) {
    super();
  }

  override canExecute(): boolean {
    if (!super.canExecute()) return false;
    return this.graph.getAllConnections().some(
      conn => conn.from === this.fromNodeId && conn.to === this.toNodeId
    );
  }

  doExecute(): void {
    this.graph.removeConnection(this.fromNodeId, this.toNodeId);
  }

  doUndo(): void {
    this.graph.addConnection(this.fromNodeId, this.toNodeId);
  }
}

export class FlowEditor {
  constructor(
    private graph: FlowGraph,
    private nodeFactory: NodeFactory
  ) {}

  addNode(id: string, name: string, type: NodeType, position?: NodePosition): Command {
    return new AddNodeCommand(this.graph, this.nodeFactory, id, name, type, position);
  }

  removeNode(nodeId: string): Command {
    return new RemoveNodeCommand(this.graph, nodeId);
  }

  updateNodeName(nodeId: string, newName: string): Command {
    return new UpdateNodeNameCommand(this.graph, nodeId, newName);
  }

  moveNode(nodeId: string, position: NodePosition): Command {
    return new MoveNodeCommand(this.graph, nodeId, position);
  }

  addConnection(fromNodeId: string, toNodeId: string): Command {
    return new AddConnectionCommand(this.graph, fromNodeId, toNodeId);
  }

  removeConnection(fromNodeId: string, toNodeId: string): Command {
    return new RemoveConnectionCommand(this.graph, fromNodeId, toNodeId);
  }

  createBatchCommand(commands: Command[]): Command {
    return new BatchCommand(commands);
  }
} 