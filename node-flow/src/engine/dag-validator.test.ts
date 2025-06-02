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
}); 