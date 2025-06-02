/**
 * 🧪 图对比器测试
 */

import { describe, it } from '@std/testing/bdd';
import { assertEquals, assertExists } from '@std/assert';
import { FlowComparator, FlowDiff, ChangeType } from '@node-flow/internal/config/flow-comparator.ts';
import { FlowGraph } from '@node-flow/internal/config/flow-graph.ts';
import { PureNode } from '@node-flow/internal/core/pure-node.ts';
import { UIInputNode } from '@node-flow/internal/core/ui-input-node.ts';

describe('FlowComparator 图对比器', () => {
  describe('当对比两个图时', () => {
    it('应该检测到新增的节点', () => {
      const comparator = new FlowComparator();
      
      const graphA = new FlowGraph();
      const graphB = new FlowGraph();
      
      const node = new PureNode('new-node', 'New Node');
      graphB.addNode(node);
      
      const diff = comparator.compare(graphA, graphB);
      
      assertExists(diff);
      assertEquals(diff.nodeChanges.length, 1);
      assertEquals(diff.nodeChanges[0].type, ChangeType.ADDED);
      assertEquals(diff.nodeChanges[0].nodeId, 'new-node');
    });

    it('应该检测到删除的节点', () => {
      const comparator = new FlowComparator();
      
      const graphA = new FlowGraph();
      const graphB = new FlowGraph();
      
      const node = new PureNode('removed-node', 'Removed Node');
      graphA.addNode(node);
      
      const diff = comparator.compare(graphA, graphB);
      
      assertEquals(diff.nodeChanges.length, 1);
      assertEquals(diff.nodeChanges[0].type, ChangeType.REMOVED);
      assertEquals(diff.nodeChanges[0].nodeId, 'removed-node');
    });

    it('应该检测到修改的节点', () => {
      const comparator = new FlowComparator();
      
      const graphA = new FlowGraph();
      const graphB = new FlowGraph();
      
      const nodeA = new PureNode('node', 'Old Name');
      const nodeB = new PureNode('node', 'New Name');
      
      graphA.addNode(nodeA, { x: 0, y: 0 });
      graphB.addNode(nodeB, { x: 100, y: 200 });
      
      const diff = comparator.compare(graphA, graphB);
      
      assertEquals(diff.nodeChanges.length, 1);
      assertEquals(diff.nodeChanges[0].type, ChangeType.MODIFIED);
      assertEquals(diff.nodeChanges[0].nodeId, 'node');
      assertEquals(diff.nodeChanges[0].oldValue?.name, 'Old Name');
      assertEquals(diff.nodeChanges[0].newValue?.name, 'New Name');
    });

    it('应该检测到新增的连接', () => {
      const comparator = new FlowComparator();
      
      const graphA = new FlowGraph();
      const graphB = new FlowGraph();
      
      const node1 = new PureNode('node1', 'Node 1');
      const node2 = new PureNode('node2', 'Node 2');
      
      [graphA, graphB].forEach(graph => {
        graph.addNode(node1);
        graph.addNode(node2);
      });
      
      graphB.addConnection('node1', 'node2');
      
      const diff = comparator.compare(graphA, graphB);
      
      assertEquals(diff.connectionChanges.length, 1);
      assertEquals(diff.connectionChanges[0].type, ChangeType.ADDED);
      assertEquals(diff.connectionChanges[0].from, 'node1');
      assertEquals(diff.connectionChanges[0].to, 'node2');
    });

    it('应该检测到删除的连接', () => {
      const comparator = new FlowComparator();
      
      const graphA = new FlowGraph();
      const graphB = new FlowGraph();
      
      const node1 = new PureNode('node1', 'Node 1');
      const node2 = new PureNode('node2', 'Node 2');
      
      [graphA, graphB].forEach(graph => {
        graph.addNode(node1);
        graph.addNode(node2);
      });
      
      graphA.addConnection('node1', 'node2');
      
      const diff = comparator.compare(graphA, graphB);
      
      assertEquals(diff.connectionChanges.length, 1);
      assertEquals(diff.connectionChanges[0].type, ChangeType.REMOVED);
      assertEquals(diff.connectionChanges[0].from, 'node1');
      assertEquals(diff.connectionChanges[0].to, 'node2');
    });

    it('应该检测到元数据变化', () => {
      const comparator = new FlowComparator();
      
      const graphA = new FlowGraph();
      const graphB = new FlowGraph();
      
      graphA.metadata = { name: 'Old Workflow', version: '1.0.0' };
      graphB.metadata = { name: 'New Workflow', version: '2.0.0' };
      
      const diff = comparator.compare(graphA, graphB);
      
      assertEquals(diff.metadataChanges.length, 2);
      
      const nameChange = diff.metadataChanges.find(c => c.key === 'name');
      assertExists(nameChange);
      assertEquals(nameChange.type, ChangeType.MODIFIED);
      assertEquals(nameChange.oldValue, 'Old Workflow');
      assertEquals(nameChange.newValue, 'New Workflow');
    });

    it('应该识别相同的图', () => {
      const comparator = new FlowComparator();
      
      const graphA = new FlowGraph();
      const graphB = new FlowGraph();
      
      const node = new PureNode('node', 'Same Node');
      [graphA, graphB].forEach(graph => {
        graph.addNode(node, { x: 100, y: 100 });
        graph.metadata = { name: 'Same Workflow' };
      });
      
      const diff = comparator.compare(graphA, graphB);
      
      assertEquals(diff.nodeChanges.length, 0);
      assertEquals(diff.connectionChanges.length, 0);
      assertEquals(diff.metadataChanges.length, 0);
      assertEquals(diff.isEmpty(), true);
    });

    it('应该支持复杂图结构对比', () => {
      const comparator = new FlowComparator();
      
      const graphA = new FlowGraph();
      const graphB = new FlowGraph();
      
      // 图A: A -> B -> C
      const nodeA = new PureNode('A', 'Node A');
      const nodeB = new PureNode('B', 'Node B');
      const nodeC = new PureNode('C', 'Node C');
      
      graphA.addNode(nodeA);
      graphA.addNode(nodeB);
      graphA.addNode(nodeC);
      graphA.addConnection('A', 'B');
      graphA.addConnection('B', 'C');
      
      // 图B: A -> D -> C (B被D替换)
      const nodeD = new UIInputNode('D', 'Node D');
      
      graphB.addNode(nodeA);
      graphB.addNode(nodeD);
      graphB.addNode(nodeC);
      graphB.addConnection('A', 'D');
      graphB.addConnection('D', 'C');
      
      const diff = comparator.compare(graphA, graphB);
      
      // 检查变化：删除B，新增D，连接变化
      assertEquals(diff.nodeChanges.filter(c => c.type === ChangeType.REMOVED).length, 1);
      assertEquals(diff.nodeChanges.filter(c => c.type === ChangeType.ADDED).length, 1);
      assertEquals(diff.connectionChanges.filter(c => c.type === ChangeType.REMOVED).length, 2);
      assertEquals(diff.connectionChanges.filter(c => c.type === ChangeType.ADDED).length, 2);
    });
  });

  describe('差异报告功能', () => {
    it('应该生成人类可读的差异报告', () => {
      const comparator = new FlowComparator();
      
      const graphA = new FlowGraph();
      const graphB = new FlowGraph();
      
      const nodeA = new PureNode('node1', 'Old Node');
      const nodeB = new PureNode('node1', 'New Node');
      
      graphA.addNode(nodeA);
      graphB.addNode(nodeB);
      graphB.addNode(new PureNode('node2', 'Added Node'));
      
      const diff = comparator.compare(graphA, graphB);
      const report = diff.generateReport();
      
      assertExists(report);
      assertEquals(typeof report, 'string');
      assertEquals(report.includes('Modified'), true);
      assertEquals(report.includes('Added'), true);
    });
  });
}); 