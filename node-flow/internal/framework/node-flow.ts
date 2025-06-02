/**
 * 🧩 NodeFlow框架主实现
 */

import { 
  INodeFlow, 
  IFlowGraph, 
  INodeFactory, 
  IGraphExecutor,
  IFlowSerializer,
  IFlowDeserializer, 
  IFlowComparator,
  IFlowEditor
} from '../../public/interfaces.ts';

import { ExecutionResult, FlowDiff } from '../../public/types.ts';

import { FlowGraph } from '../config/flow-graph.ts';
import { NodeFactory } from '../config/node-factory.ts';
import { GraphExecutorAdapter } from './executor-adapter.ts';
import { FlowSerializer } from '../config/flow-serializer.ts';
import { FlowDeserializer } from '../config/flow-deserializer.ts';
import { FlowComparator } from '../config/flow-comparator.ts';
import { FlowEditor } from '../config/flow-editor.ts';

export class NodeFlow implements INodeFlow {
  
  // 工厂方法
  createGraph(): IFlowGraph {
    return new FlowGraph();
  }

  createNodeFactory(): INodeFactory {
    return new NodeFactory();
  }

  createExecutor(): IGraphExecutor {
    return new GraphExecutorAdapter();
  }

  createSerializer(): IFlowSerializer {
    return new FlowSerializer();
  }

  createDeserializer(nodeFactory: INodeFactory): IFlowDeserializer {
    return new FlowDeserializer(nodeFactory as NodeFactory);
  }

  createComparator(): IFlowComparator {
    return new FlowComparator();
  }

  createEditor(graph: IFlowGraph, nodeFactory: INodeFactory): IFlowEditor {
    return new FlowEditor(graph as FlowGraph, nodeFactory as NodeFactory);
  }

  // 便捷方法
  loadFromJson(json: string): IFlowGraph {
    const nodeFactory = this.createNodeFactory();
    const deserializer = this.createDeserializer(nodeFactory);
    return deserializer.deserialize(json);
  }

  saveToJson(graph: IFlowGraph): string {
    const serializer = this.createSerializer();
    return serializer.serialize(graph);
  }

  async executeWorkflow(graph: IFlowGraph): Promise<ExecutionResult> {
    const executor = this.createExecutor();
    return await executor.execute(graph);
  }

  compareGraphs(graphA: IFlowGraph, graphB: IFlowGraph): FlowDiff {
    const comparator = this.createComparator();
    return comparator.compare(graphA, graphB);
  }
} 