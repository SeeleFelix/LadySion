/**
 * 🌟 NodeFlow 公共接口定义
 * 
 * 这是框架对外暴露的所有核心接口
 */

import { NodeType, NodePosition, FlowMetadata, Connection, Port, PortConnection, ExecutionResult, FlowDiff } from './types.ts';

// 节点接口
export interface INode {
  readonly id: string;
  name: string;
  readonly type: NodeType;
  process?(data?: any): any;
  getUserInput?(): any;
  displayOutput?(data: any): void;
  
  // 端口系统
  getInputPorts?(): Port[];
  getOutputPorts?(): Port[];
  getSubGraph?(): IFlowGraph | undefined;
}

// 工作流图接口
export interface IFlowGraph {
  // 节点管理
  addNode(node: INode, position?: NodePosition): void;
  removeNode(nodeId: string): void;
  getNode(nodeId: string): INode | undefined;
  getAllNodes(): INode[];

  // 连接管理
  addConnection(from: string, to: string): void;
  removeConnection(from: string, to: string): void;
  getAllConnections(): Connection[];
  
  // 端口连接管理
  addPortConnection(fromNode: string, fromPort: string, toNode: string, toPort: string): void;
  removePortConnection(fromNode: string, fromPort: string, toNode: string, toPort: string): void;
  getPortConnections(): PortConnection[];
  
  // 节点组管理
  packNodesAsComposite(nodeIds: string[], compositeId: string, config: any): INode;

  // 位置管理
  getNodePosition(nodeId: string): NodePosition | undefined;
  setNodePosition(nodeId: string, position: NodePosition): void;

  // 元数据
  metadata: FlowMetadata;

  // 清理
  clear(): void;
}

// 节点工厂接口
export interface INodeFactory {
  createNode(id: string, name: string, type: NodeType): INode;
  createNodeFromType(id: string, name: string, typeString: string): INode;
  
  // 高级节点创建
  createAdvancedNode(id: string, name: string, config: any): INode;
  createCompositeNode(id: string, name: string, config: any): INode;
  
  // 自定义节点类型注册
  registerNodeType(typeName: string, config: any): void;
}

// 图执行器接口
export interface IGraphExecutor {
  execute(graph: IFlowGraph): Promise<ExecutionResult>;
}

// 序列化器接口
export interface IFlowSerializer {
  serialize(graph: IFlowGraph): string;
}

// 反序列化器接口
export interface IFlowDeserializer {
  deserialize(json: string): IFlowGraph;
}

// 图对比器接口
export interface IFlowComparator {
  compare(graphA: IFlowGraph, graphB: IFlowGraph): FlowDiff;
}

// 命令接口
export interface ICommand {
  execute(): void;
  undo(): void;
  redo(): void;
  canExecute(): boolean;
  canUndo(): boolean;
  canRedo(): boolean;
}

// 图编辑器接口
export interface IFlowEditor {
  // 节点编辑
  addNode(id: string, name: string, type: NodeType, position?: NodePosition): ICommand;
  removeNode(nodeId: string): ICommand;
  updateNodeName(nodeId: string, newName: string): ICommand;
  moveNode(nodeId: string, position: NodePosition): ICommand;

  // 连接编辑
  addConnection(fromNodeId: string, toNodeId: string): ICommand;
  removeConnection(fromNodeId: string, toNodeId: string): ICommand;

  // 批量操作
  createBatchCommand(commands: ICommand[]): ICommand;
}

// NodeFlow 主要框架接口
export interface INodeFlow {
  // 工厂方法
  createGraph(): IFlowGraph;
  createNodeFactory(): INodeFactory;
  createExecutor(): IGraphExecutor;
  createSerializer(): IFlowSerializer;
  createDeserializer(nodeFactory: INodeFactory): IFlowDeserializer;
  createComparator(): IFlowComparator;
  createEditor(graph: IFlowGraph, nodeFactory: INodeFactory): IFlowEditor;

  // 便捷方法
  loadFromJson(json: string): IFlowGraph;
  saveToJson(graph: IFlowGraph): string;
  executeWorkflow(graph: IFlowGraph): Promise<ExecutionResult>;
  compareGraphs(graphA: IFlowGraph, graphB: IFlowGraph): FlowDiff;
} 