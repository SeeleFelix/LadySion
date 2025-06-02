/**
 * 🧪 图反序列化器测试
 */

import { describe, it } from '@std/testing/bdd';
import { assertEquals, assertExists, assertThrows } from '@std/assert';
import { FlowDeserializer } from '@node-flow/internal/config/flow-deserializer.ts';
import { NodeFactory } from '@node-flow/internal/config/node-factory.ts';
import { PureNode } from '@node-flow/internal/core/pure-node.ts';
import { UIInputNode } from '@node-flow/internal/core/ui-input-node.ts';
import { UIOutputNode } from '@node-flow/internal/core/ui-output-node.ts';
import { NodeType } from '@node-flow/internal/core/types.ts';

describe('FlowDeserializer 图反序列化器', () => {
  describe('当从JSON反序列化图时', () => {
    it('应该正确重建简单的线性图', () => {
      const factory = new NodeFactory();
      const deserializer = new FlowDeserializer(factory);
      
      const json = JSON.stringify({
        metadata: {
          name: 'Test Flow',
          version: '1.0.0'
        },
        nodes: [
          {
            id: 'input',
            name: 'User Input',
            type: 'ui-input',
            position: { x: 0, y: 0 },
            config: {}
          },
          {
            id: 'process',
            name: 'Process Data',
            type: 'pure',
            position: { x: 200, y: 0 },
            config: {}
          },
          {
            id: 'output',
            name: 'Display Output',
            type: 'ui-output',
            position: { x: 400, y: 0 },
            config: {}
          }
        ],
        connections: [
          { from: 'input', to: 'process' },
          { from: 'process', to: 'output' }
        ],
        version: '1.0.0',
        createdAt: '2024-01-01T00:00:00.000Z'
      });
      
      const graph = deserializer.deserialize(json);
      
      assertExists(graph);
      assertEquals(graph.getAllNodes().length, 3);
      assertEquals(graph.getAllConnections().length, 2);
      assertEquals(graph.metadata.name, 'Test Flow');
    });

    it('应该正确重建不同类型的节点', () => {
      const factory = new NodeFactory();
      const deserializer = new FlowDeserializer(factory);
      
      const json = JSON.stringify({
        metadata: {},
        nodes: [
          {
            id: 'ui-input-1',
            name: 'Input Node',
            type: 'ui-input',
            position: { x: 0, y: 0 },
            config: {}
          },
          {
            id: 'pure-1',
            name: 'Pure Node',
            type: 'pure',
            position: { x: 100, y: 0 },
            config: {}
          },
          {
            id: 'ui-output-1',
            name: 'Output Node',
            type: 'ui-output',
            position: { x: 200, y: 0 },
            config: {}
          }
        ],
        connections: [],
        version: '1.0.0',
        createdAt: '2024-01-01T00:00:00.000Z'
      });
      
      const graph = deserializer.deserialize(json);
      
      const inputNode = graph.getNode('ui-input-1');
      const pureNode = graph.getNode('pure-1');
      const outputNode = graph.getNode('ui-output-1');
      
      assertExists(inputNode);
      assertExists(pureNode);
      assertExists(outputNode);
      
      assertEquals(inputNode.type, NodeType.UI_INPUT);
      assertEquals(pureNode.type, NodeType.PURE);
      assertEquals(outputNode.type, NodeType.UI_OUTPUT);
    });

    it('应该保持节点位置信息', () => {
      const factory = new NodeFactory();
      const deserializer = new FlowDeserializer(factory);
      
      const json = JSON.stringify({
        metadata: {},
        nodes: [
          {
            id: 'test',
            name: 'Test Node',
            type: 'pure',
            position: { x: 150, y: 250 },
            config: {}
          }
        ],
        connections: [],
        version: '1.0.0',
        createdAt: '2024-01-01T00:00:00.000Z'
      });
      
      const graph = deserializer.deserialize(json);
      const position = graph.getNodePosition('test');
      
      assertExists(position);
      assertEquals(position.x, 150);
      assertEquals(position.y, 250);
    });

    it('应该处理无效的JSON格式', () => {
      const factory = new NodeFactory();
      const deserializer = new FlowDeserializer(factory);
      
      const invalidJson = 'invalid json';
      
      assertThrows(() => {
        deserializer.deserialize(invalidJson);
      }, Error, 'JSON格式错误');
    });

    it('应该处理未知的节点类型', () => {
      const factory = new NodeFactory();
      const deserializer = new FlowDeserializer(factory);
      
      const json = JSON.stringify({
        metadata: {},
        nodes: [
          {
            id: 'unknown',
            name: 'Unknown Node',
            type: 'unknown-type',
            position: { x: 0, y: 0 },
            config: {}
          }
        ],
        connections: [],
        version: '1.0.0',
        createdAt: '2024-01-01T00:00:00.000Z'
      });
      
      assertThrows(() => {
        deserializer.deserialize(json);
      }, Error, '未知节点类型');
    });
  });

  describe('NodeFactory 节点工厂', () => {
    it('应该能创建不同类型的节点', () => {
      const factory = new NodeFactory();
      
      const inputNode = factory.createNode('test-input', 'Test Input', NodeType.UI_INPUT);
      const pureNode = factory.createNode('test-pure', 'Test Pure', NodeType.PURE);
      const outputNode = factory.createNode('test-output', 'Test Output', NodeType.UI_OUTPUT);
      
      assertExists(inputNode);
      assertExists(pureNode);
      assertExists(outputNode);
      
      assertEquals(inputNode.type, NodeType.UI_INPUT);
      assertEquals(pureNode.type, NodeType.PURE);
      assertEquals(outputNode.type, NodeType.UI_OUTPUT);
    });

    it('应该拒绝创建未知类型的节点', () => {
      const factory = new NodeFactory();
      
      assertThrows(() => {
        factory.createNode('test', 'Test', 'unknown' as NodeType);
      }, Error, '不支持的节点类型');
    });
  });
}); 