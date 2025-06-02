/**
 * 🧪 DAG验证器测试
 */

import { describe, it } from '@std/testing/bdd';
import { assertEquals, assertThrows } from '@std/assert';
import { DAGValidator } from '@node-flow/engine/dag-validator.ts';
import { PureNode } from '@node-flow/core/pure-node.ts';

describe('DAGValidator DAG验证器', () => {
  describe('当验证一个有效的DAG时', () => {
    it('应该通过循环检测', () => {
      const validator = new DAGValidator();
      const node1 = new PureNode('node-1', 'Node 1');
      const node2 = new PureNode('node-2', 'Node 2');
      const node3 = new PureNode('node-3', 'Node 3');
      
      // 创建有效的DAG: node1 -> node2 -> node3
      const nodes = [node1, node2, node3];
      const connections = [
        { from: 'node-1', to: 'node-2' },
        { from: 'node-2', to: 'node-3' }
      ];
      
      const isValid = validator.validateDAG(nodes, connections);
      assertEquals(isValid, true);
    });

    it('应该检测出循环依赖', () => {
      const validator = new DAGValidator();
      const node1 = new PureNode('node-1', 'Node 1');
      const node2 = new PureNode('node-2', 'Node 2');
      
      // 创建循环：node1 -> node2 -> node1
      const nodes = [node1, node2];
      const connections = [
        { from: 'node-1', to: 'node-2' },
        { from: 'node-2', to: 'node-1' }
      ];
      
      assertThrows(() => {
        validator.validateDAG(nodes, connections);
      }, Error, '检测到循环依赖');
    });

    it('应该提供拓扑排序', () => {
      const validator = new DAGValidator();
      const node1 = new PureNode('node-1', 'Node 1');
      const node2 = new PureNode('node-2', 'Node 2');
      const node3 = new PureNode('node-3', 'Node 3');
      
      const nodes = [node3, node1, node2]; // 故意乱序
      const connections = [
        { from: 'node-1', to: 'node-2' },
        { from: 'node-2', to: 'node-3' }
      ];
      
      const sorted = validator.topologicalSort(nodes, connections);
      assertEquals(sorted.map(n => n.id), ['node-1', 'node-2', 'node-3']);
    });
  });

  describe('当处理复杂DAG结构时', () => {
    it('应该处理多个根节点', () => {
      const validator = new DAGValidator();
      const nodes = [
        new PureNode('root1', 'Root 1'),
        new PureNode('root2', 'Root 2'),
        new PureNode('child1', 'Child 1'),
        new PureNode('child2', 'Child 2'),
        new PureNode('leaf', 'Leaf')
      ];
      
      const connections = [
        { from: 'root1', to: 'child1' },
        { from: 'root2', to: 'child2' },
        { from: 'child1', to: 'leaf' },
        { from: 'child2', to: 'leaf' }
      ];
      
      const isValid = validator.validateDAG(nodes, connections);
      assertEquals(isValid, true);
      
      const sorted = validator.topologicalSort(nodes, connections);
      // 根节点应该在前面，leaf应该在最后
      const sortedIds = sorted.map(n => n.id);
      const leafIndex = sortedIds.indexOf('leaf');
      const child1Index = sortedIds.indexOf('child1');
      const child2Index = sortedIds.indexOf('child2');
      
      assertEquals(child1Index < leafIndex, true);
      assertEquals(child2Index < leafIndex, true);
    });

    it('应该处理钻石依赖结构', () => {
      const validator = new DAGValidator();
      const nodes = [
        new PureNode('A', 'Node A'),
        new PureNode('B', 'Node B'),
        new PureNode('C', 'Node C'),
        new PureNode('D', 'Node D')
      ];
      
      // 钻石结构: A -> B -> D, A -> C -> D
      const connections = [
        { from: 'A', to: 'B' },
        { from: 'A', to: 'C' },
        { from: 'B', to: 'D' },
        { from: 'C', to: 'D' }
      ];
      
      const isValid = validator.validateDAG(nodes, connections);
      assertEquals(isValid, true);
      
      const sorted = validator.topologicalSort(nodes, connections);
      const sortedIds = sorted.map(n => n.id);
      
      // A应该在最前面，D应该在最后面
      assertEquals(sortedIds[0], 'A');
      assertEquals(sortedIds[sortedIds.length - 1], 'D');
    });

    it('应该检测出自环', () => {
      const validator = new DAGValidator();
      const node = new PureNode('self', 'Self Loop');
      const nodes = [node];
      const connections = [
        { from: 'self', to: 'self' }
      ];
      
      assertThrows(() => {
        validator.validateDAG(nodes, connections);
      }, Error, '检测到循环依赖');
    });

    it('应该处理空图', () => {
      const validator = new DAGValidator();
      const nodes: PureNode[] = [];
      const connections: { from: string; to: string }[] = [];
      
      const isValid = validator.validateDAG(nodes, connections);
      assertEquals(isValid, true);
      
      const sorted = validator.topologicalSort(nodes, connections);
      assertEquals(sorted.length, 0);
    });

    it('应该处理只有节点没有边的图', () => {
      const validator = new DAGValidator();
      const nodes = [
        new PureNode('isolated1', 'Isolated 1'),
        new PureNode('isolated2', 'Isolated 2'),
        new PureNode('isolated3', 'Isolated 3')
      ];
      const connections: { from: string; to: string }[] = [];
      
      const isValid = validator.validateDAG(nodes, connections);
      assertEquals(isValid, true);
      
      const sorted = validator.topologicalSort(nodes, connections);
      assertEquals(sorted.length, 3);
      // 所有节点都应该被包含在排序结果中
      const sortedIds = sorted.map(n => n.id);
      assertEquals(sortedIds.includes('isolated1'), true);
      assertEquals(sortedIds.includes('isolated2'), true);
      assertEquals(sortedIds.includes('isolated3'), true);
    });
  });
}); 