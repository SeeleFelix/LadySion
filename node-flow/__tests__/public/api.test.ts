/**
 * 🧪 公共API测试
 */

import { describe, it } from '@std/testing/bdd';
import { assertExists, assertEquals } from '@std/assert';
import { createNodeFlow, NodeType } from '../../public/index.ts';

describe('NodeFlow公共API', () => {
  describe('当使用框架创建工作流时', () => {
    it('应该能够创建框架实例', () => {
      const nodeFlow = createNodeFlow();
      
      assertExists(nodeFlow);
      assertExists(nodeFlow.createGraph);
      assertExists(nodeFlow.createNodeFactory);
      assertExists(nodeFlow.executeWorkflow);
    });

    it('应该能够创建图和节点', () => {
      const nodeFlow = createNodeFlow();
      const graph = nodeFlow.createGraph();
      const factory = nodeFlow.createNodeFactory();
      
      assertExists(graph);
      assertExists(factory);
      
      const node = factory.createNode('test', 'Test Node', NodeType.PURE);
      assertExists(node);
      assertEquals(node.id, 'test');
      assertEquals(node.name, 'Test Node');
      assertEquals(node.type, NodeType.PURE);
    });

    it('应该支持JSON序列化和反序列化', () => {
      const nodeFlow = createNodeFlow();
      const graph = nodeFlow.createGraph();
      const factory = nodeFlow.createNodeFactory();
      
      // 添加节点
      const node = factory.createNode('test', 'Test Node', NodeType.PURE);
      graph.addNode(node);
      
      // 序列化
      const json = nodeFlow.saveToJson(graph);
      assertExists(json);
      assertEquals(typeof json, 'string');
      
      // 反序列化
      const loadedGraph = nodeFlow.loadFromJson(json);
      assertExists(loadedGraph);
      assertEquals(loadedGraph.getAllNodes().length, 1);
      assertEquals(loadedGraph.getAllNodes()[0].id, 'test');
    });

    it('应该支持工作流执行', async () => {
      const nodeFlow = createNodeFlow();
      const graph = nodeFlow.createGraph();
      const factory = nodeFlow.createNodeFactory();
      
      // 创建简单的线性工作流
      const inputNode = factory.createNode('input', 'Input', NodeType.UI_INPUT);
      const outputNode = factory.createNode('output', 'Output', NodeType.UI_OUTPUT);
      
      graph.addNode(inputNode);
      graph.addNode(outputNode);
      graph.addConnection('input', 'output');
      
      // 执行工作流
      const result = await nodeFlow.executeWorkflow(graph);
      
      assertExists(result);
      assertEquals(result.success, true);
      assertEquals(result.executedNodes?.length, 2);
      assertEquals(result.totalNodes, 2);
    });

    it('应该支持图对比功能', () => {
      const nodeFlow = createNodeFlow();
      const factory = nodeFlow.createNodeFactory();
      
      const graphA = nodeFlow.createGraph();
      const graphB = nodeFlow.createGraph();
      
      // 添加不同的节点
      const nodeA = factory.createNode('test', 'Node A', NodeType.PURE);
      const nodeB = factory.createNode('test', 'Node B', NodeType.PURE);
      
      graphA.addNode(nodeA);
      graphB.addNode(nodeB);
      
      // 对比图
      const diff = nodeFlow.compareGraphs(graphA, graphB);
      
      assertExists(diff);
      assertEquals(diff.isEmpty(), false);
      assertEquals(diff.nodeChanges.length, 1);
    });
  });
}); 