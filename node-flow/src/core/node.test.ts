/**
 * 🧪 节点基础功能测试
 */

import { describe, it } from '@std/testing/bdd';
import { assertEquals, assertExists } from '@std/assert';
import { Node } from '@node-flow/core/node.ts';

describe('Node基础功能', () => {
  describe('当创建一个基础节点时', () => {
    it('应该能够创建节点实例', () => {
      // 这个测试会失败，因为Node还不存在
      const node = new Node('test-id', 'Test Node');
      assertEquals(node.id, 'test-id');
      assertEquals(node.name, 'Test Node');
    });

    it('应该有正确的类型标识', () => {
      const node = new Node('test-id', 'Test Node');
      assertExists(node.type);
    });
  });
}); 