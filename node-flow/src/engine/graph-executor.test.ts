/**
 * 🧪 图执行引擎测试
 */

import { describe, it } from '@std/testing/bdd';
import { assertEquals, assertExists } from '@std/assert';
import { GraphExecutor } from '@node-flow/engine/graph-executor.ts';
import { PureNode } from '@node-flow/core/pure-node.ts';
import { UIInputNode } from '@node-flow/core/ui-input-node.ts';
import { UIOutputNode } from '@node-flow/core/ui-output-node.ts';

describe('GraphExecutor 图执行引擎', () => {
  describe('当执行简单的线性图时', () => {
    it('应该按正确顺序执行节点', async () => {
      const executor = new GraphExecutor();
      
      const inputNode = new UIInputNode('input', 'Input Node');
      const processNode = new PureNode('process', 'Process Node');
      const outputNode = new UIOutputNode('output', 'Output Node');
      
      const nodes = [inputNode, processNode, outputNode];
      const connections = [
        { from: 'input', to: 'process' },
        { from: 'process', to: 'output' }
      ];
      
      const result = await executor.execute(nodes, connections);
      assertExists(result);
      assertEquals(result.success, true);
    });

    it('应该支持并发执行独立节点', async () => {
      const executor = new GraphExecutor();
      
      const node1 = new PureNode('parallel-1', 'Parallel Node 1');
      const node2 = new PureNode('parallel-2', 'Parallel Node 2');
      const mergeNode = new PureNode('merge', 'Merge Node');
      
      const nodes = [node1, node2, mergeNode];
      const connections = [
        { from: 'parallel-1', to: 'merge' },
        { from: 'parallel-2', to: 'merge' }
      ];
      
      const startTime = Date.now();
      const result = await executor.execute(nodes, connections);
      const endTime = Date.now();
      
      assertEquals(result.success, true);
      // 并发执行应该比串行快
      assertEquals(endTime - startTime < 1000, true);
    });

    it('应该正确处理数据流', async () => {
      const executor = new GraphExecutor();
      
      const inputNode = new UIInputNode('input', 'Input');
      const processNode = new PureNode('process', 'Process');
      
      const nodes = [inputNode, processNode];
      const connections = [
        { from: 'input', to: 'process' }
      ];
      
      const result = await executor.execute(nodes, connections);
      assertEquals(result.success, true);
      assertExists(result.nodeResults);
      assertExists(result.nodeResults.get('input'));
      assertExists(result.nodeResults.get('process'));
    });
  });

  describe('当处理错误情况时', () => {
    it('应该拒绝执行有循环的图', async () => {
      const executor = new GraphExecutor();
      
      const node1 = new PureNode('node-1', 'Node 1');
      const node2 = new PureNode('node-2', 'Node 2');
      
      const nodes = [node1, node2];
      const connections = [
        { from: 'node-1', to: 'node-2' },
        { from: 'node-2', to: 'node-1' }
      ];
      
      const result = await executor.execute(nodes, connections);
      assertEquals(result.success, false);
      assertExists(result.error);
      assertEquals(result.error.includes('循环依赖'), true);
    });

    it('应该处理节点执行失败', async () => {
      const executor = new GraphExecutor();
      
      // 创建一个会失败的节点
      const failingNode = new PureNode('failing', 'Failing Node');
      const normalNode = new PureNode('normal', 'Normal Node');
      
      const nodes = [failingNode, normalNode];
      const connections = [
        { from: 'failing', to: 'normal' }
      ];
      
      const result = await executor.execute(nodes, connections);
      assertEquals(result.success, false);
      assertExists(result.error);
    });
  });
}); 