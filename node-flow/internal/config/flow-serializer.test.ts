/**
 * 🧪 图序列化器测试
 */

import { describe, it } from '@std/testing/bdd';
import { assertEquals, assertExists } from '@std/assert';
import { FlowSerializer } from '@node-flow/config/flow-serializer.ts';
import { PureNode } from '@node-flow/core/pure-node.ts';
import { UIInputNode } from '@node-flow/core/ui-input-node.ts';
import { UIOutputNode } from '@node-flow/core/ui-output-node.ts';
import { FlowGraph } from '@node-flow/config/flow-graph.ts';

describe('FlowSerializer 图序列化器', () => {
  describe('当序列化图为JSON时', () => {
    it('应该正确序列化简单的线性图', () => {
      const serializer = new FlowSerializer();
      
      const inputNode = new UIInputNode('input', 'User Input');
      const processNode = new PureNode('process', 'Process Data');
      const outputNode = new UIOutputNode('output', 'Display Output');
      
      const graph = new FlowGraph();
      graph.addNode(inputNode);
      graph.addNode(processNode);
      graph.addNode(outputNode);
      graph.addConnection('input', 'process');
      graph.addConnection('process', 'output');
      
      const json = serializer.serialize(graph);
      
      assertExists(json);
      assertEquals(typeof json, 'string');
      
      const parsed = JSON.parse(json);
      assertExists(parsed.nodes);
      assertExists(parsed.connections);
      assertEquals(parsed.nodes.length, 3);
      assertEquals(parsed.connections.length, 2);
    });

    it('应该保存节点的完整信息', () => {
      const serializer = new FlowSerializer();
      const graph = new FlowGraph();
      
      const node = new PureNode('test', 'Test Node');
      graph.addNode(node);
      
      const json = serializer.serialize(graph);
      const parsed = JSON.parse(json);
      
      const nodeJson = parsed.nodes[0];
      assertEquals(nodeJson.id, 'test');
      assertEquals(nodeJson.name, 'Test Node');
      assertEquals(nodeJson.type, 'pure');
      assertExists(nodeJson.position);
      assertExists(nodeJson.config);
    });

    it('应该序列化复杂的图结构', () => {
      const serializer = new FlowSerializer();
      const graph = new FlowGraph();
      
      // 创建钻石依赖结构
      const nodes = [
        new UIInputNode('A', 'Node A'),
        new PureNode('B', 'Node B'),
        new PureNode('C', 'Node C'),
        new UIOutputNode('D', 'Node D')
      ];
      
      nodes.forEach(node => graph.addNode(node));
      
      graph.addConnection('A', 'B');
      graph.addConnection('A', 'C');
      graph.addConnection('B', 'D');
      graph.addConnection('C', 'D');
      
      const json = serializer.serialize(graph);
      const parsed = JSON.parse(json);
      
      assertEquals(parsed.nodes.length, 4);
      assertEquals(parsed.connections.length, 4);
      
      // 验证连接信息
      const connections = parsed.connections;
      assertEquals(connections[0].from, 'A');
      assertEquals(connections[0].to, 'B');
    });

    it('应该包含元数据信息', () => {
      const serializer = new FlowSerializer();
      const graph = new FlowGraph();
      graph.metadata = {
        name: 'Test Workflow',
        description: 'A test workflow',
        version: '1.0.0',
        author: 'Test Author'
      };
      
      const json = serializer.serialize(graph);
      const parsed = JSON.parse(json);
      
      assertExists(parsed.metadata);
      assertEquals(parsed.metadata.name, 'Test Workflow');
      assertEquals(parsed.metadata.description, 'A test workflow');
      assertEquals(parsed.metadata.version, '1.0.0');
      assertEquals(parsed.metadata.author, 'Test Author');
    });
  });
}); 