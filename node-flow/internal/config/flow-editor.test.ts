/**
 * 🧪 图编辑器测试
 */

import { describe, it } from '@std/testing/bdd';
import { assertEquals, assertExists, assertThrows } from '@std/assert';
import { FlowEditor } from '@node-flow/internal/config/flow-editor.ts';
import { FlowGraph } from '@node-flow/internal/config/flow-graph.ts';
import { NodeFactory } from '@node-flow/internal/config/node-factory.ts';
import { PureNode } from '@node-flow/internal/core/pure-node.ts';
import { NodeType } from '@node-flow/internal/core/types.ts';

describe('FlowEditor 图编辑器', () => {
  describe('节点编辑功能', () => {
    it('应该能添加新节点', () => {
      const factory = new NodeFactory();
      const graph = new FlowGraph();
      const editor = new FlowEditor(graph, factory);
      
      const command = editor.addNode('new-node', 'New Node', NodeType.PURE, { x: 100, y: 200 });
      
      assertExists(command);
      assertEquals(command.canExecute(), true);
      
      command.execute();
      
      const node = graph.getNode('new-node');
      assertExists(node);
      assertEquals(node.name, 'New Node');
      assertEquals(node.type, NodeType.PURE);
      
      const position = graph.getNodePosition('new-node');
      assertExists(position);
      assertEquals(position.x, 100);
      assertEquals(position.y, 200);
    });

    it('应该能删除节点', () => {
      const factory = new NodeFactory();
      const graph = new FlowGraph();
      const editor = new FlowEditor(graph, factory);
      
      // 先添加节点
      const node = new PureNode('test-node', 'Test Node');
      graph.addNode(node);
      graph.addConnection('test-node', 'test-node'); // 自连接
      
      const command = editor.removeNode('test-node');
      command.execute();
      
      assertEquals(graph.getNode('test-node'), undefined);
      assertEquals(graph.getAllConnections().length, 0);
    });

    it('应该能修改节点名称', () => {
      const factory = new NodeFactory();
      const graph = new FlowGraph();
      const editor = new FlowEditor(graph, factory);
      
      const node = new PureNode('test-node', 'Old Name');
      graph.addNode(node);
      
      const command = editor.updateNodeName('test-node', 'New Name');
      command.execute();
      
      const updatedNode = graph.getNode('test-node');
      assertExists(updatedNode);
      assertEquals(updatedNode.name, 'New Name');
    });

    it('应该能移动节点位置', () => {
      const factory = new NodeFactory();
      const graph = new FlowGraph();
      const editor = new FlowEditor(graph, factory);
      
      const node = new PureNode('test-node', 'Test Node');
      graph.addNode(node, { x: 0, y: 0 });
      
      const command = editor.moveNode('test-node', { x: 150, y: 250 });
      command.execute();
      
      const position = graph.getNodePosition('test-node');
      assertExists(position);
      assertEquals(position.x, 150);
      assertEquals(position.y, 250);
    });
  });

  describe('连接编辑功能', () => {
    it('应该能添加连接', () => {
      const factory = new NodeFactory();
      const graph = new FlowGraph();
      const editor = new FlowEditor(graph, factory);
      
      const node1 = new PureNode('node1', 'Node 1');
      const node2 = new PureNode('node2', 'Node 2');
      graph.addNode(node1);
      graph.addNode(node2);
      
      const command = editor.addConnection('node1', 'node2');
      command.execute();
      
      const connections = graph.getAllConnections();
      assertEquals(connections.length, 1);
      assertEquals(connections[0].from, 'node1');
      assertEquals(connections[0].to, 'node2');
    });

    it('应该能删除连接', () => {
      const factory = new NodeFactory();
      const graph = new FlowGraph();
      const editor = new FlowEditor(graph, factory);
      
      const node1 = new PureNode('node1', 'Node 1');
      const node2 = new PureNode('node2', 'Node 2');
      graph.addNode(node1);
      graph.addNode(node2);
      graph.addConnection('node1', 'node2');
      
      const command = editor.removeConnection('node1', 'node2');
      command.execute();
      
      const connections = graph.getAllConnections();
      assertEquals(connections.length, 0);
    });

    it('应该检测并阻止循环连接', () => {
      const factory = new NodeFactory();
      const graph = new FlowGraph();
      const editor = new FlowEditor(graph, factory);
      
      const node1 = new PureNode('node1', 'Node 1');
      const node2 = new PureNode('node2', 'Node 2');
      graph.addNode(node1);
      graph.addNode(node2);
      graph.addConnection('node1', 'node2');
      
      const command = editor.addConnection('node2', 'node1');
      assertEquals(command.canExecute(), false);
      
      assertThrows(() => {
        command.execute();
      }, Error, '会产生循环依赖');
    });
  });

  describe('命令模式支持', () => {
    it('应该支持撤销操作', () => {
      const factory = new NodeFactory();
      const graph = new FlowGraph();
      const editor = new FlowEditor(graph, factory);
      
      const addCommand = editor.addNode('test-node', 'Test Node', NodeType.PURE);
      addCommand.execute();
      
      assertExists(graph.getNode('test-node'));
      
      addCommand.undo();
      
      assertEquals(graph.getNode('test-node'), undefined);
    });

    it('应该支持重做操作', () => {
      const factory = new NodeFactory();
      const graph = new FlowGraph();
      const editor = new FlowEditor(graph, factory);
      
      const addCommand = editor.addNode('test-node', 'Test Node', NodeType.PURE);
      addCommand.execute();
      addCommand.undo();
      addCommand.redo();
      
      assertExists(graph.getNode('test-node'));
    });

    it('应该支持批量操作', () => {
      const factory = new NodeFactory();
      const graph = new FlowGraph();
      const editor = new FlowEditor(graph, factory);
      
      const commands = [
        editor.addNode('node1', 'Node 1', NodeType.PURE),
        editor.addNode('node2', 'Node 2', NodeType.PURE),
        editor.addConnection('node1', 'node2')
      ];
      
      const batchCommand = editor.createBatchCommand(commands);
      batchCommand.execute();
      
      assertEquals(graph.getAllNodes().length, 2);
      assertEquals(graph.getAllConnections().length, 1);
      
      batchCommand.undo();
      
      assertEquals(graph.getAllNodes().length, 0);
      assertEquals(graph.getAllConnections().length, 0);
    });
  });

  describe('验证功能', () => {
    it('应该验证节点ID唯一性', () => {
      const factory = new NodeFactory();
      const graph = new FlowGraph();
      const editor = new FlowEditor(graph, factory);
      
      const node = new PureNode('existing', 'Existing Node');
      graph.addNode(node);
      
      const command = editor.addNode('existing', 'Duplicate Node', NodeType.PURE);
      assertEquals(command.canExecute(), false);
      
      assertThrows(() => {
        command.execute();
      }, Error, '节点ID已存在');
    });

    it('应该验证连接的节点存在', () => {
      const factory = new NodeFactory();
      const graph = new FlowGraph();
      const editor = new FlowEditor(graph, factory);
      
      const command = editor.addConnection('non-existent1', 'non-existent2');
      assertEquals(command.canExecute(), false);
      
      assertThrows(() => {
        command.execute();
      }, Error, '节点不存在');
    });
  });
}); 