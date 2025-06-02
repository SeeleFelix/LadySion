/**
 * 🧪 纯函数节点测试
 */

import { describe, it } from '@std/testing/bdd';
import { assertEquals, assertExists } from '@std/assert';
import { PureNode } from '@node-flow/internal/core/pure-node.ts';
import { NodeType } from '@node-flow/internal/core/types.ts';

describe('PureNode纯函数节点', () => {
  describe('当创建一个纯函数节点时', () => {
    it('应该继承自Node并具有PURE类型', () => {
      // 这个测试会失败，因为PureNode还不存在
      const pureNode = new PureNode('pure-1', 'Test Pure Node');
      assertEquals(pureNode.type, NodeType.PURE);
      assertEquals(pureNode.id, 'pure-1');
      assertEquals(pureNode.name, 'Test Pure Node');
    });

    it('应该能够执行process方法', async () => {
      const pureNode = new PureNode('pure-1', 'Test Pure Node');
      
      // PureNode应该有process方法用于处理数据
      const result = await pureNode.process({ input: 'test' });
      assertExists(result);
    });

    it('应该不产生副作用', () => {
      const pureNode = new PureNode('pure-1', 'Test Pure Node');
      
      // 纯函数节点应该标记为无副作用
      assertEquals(pureNode.hasSideEffects, false);
    });
  });
}); 