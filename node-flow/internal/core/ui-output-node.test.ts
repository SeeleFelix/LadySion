/**
 * 🧪 UI输出节点测试
 */

import { describe, it } from '@std/testing/bdd';
import { assertEquals } from '@std/assert';
import { UIOutputNode } from '@node-flow/internal/core/ui-output-node.ts';
import { NodeType } from '@node-flow/internal/core/types.ts';

describe('UIOutputNode UI输出节点', () => {
  describe('当创建一个UI输出节点时', () => {
    it('应该具有UI_OUTPUT类型', () => {
      const uiOutputNode = new UIOutputNode('ui-output-1', 'Test UI Output');
      assertEquals(uiOutputNode.type, NodeType.UI_OUTPUT);
      assertEquals(uiOutputNode.id, 'ui-output-1');
      assertEquals(uiOutputNode.name, 'Test UI Output');
    });

    it('应该有显示输出的能力', async () => {
      const uiOutputNode = new UIOutputNode('ui-output-1', 'Test UI Output');
      
      // UI输出节点应该有displayOutput方法
      await uiOutputNode.displayOutput({ message: 'test output' });
      // 这个测试主要验证方法存在且能执行
    });

    it('应该标记有副作用且不能有输出', () => {
      const uiOutputNode = new UIOutputNode('ui-output-1', 'Test UI Output');
      
      // UI输出节点有副作用（显示给用户）且不应该有数据输出
      assertEquals(uiOutputNode.hasSideEffects, true);
      assertEquals(uiOutputNode.canHaveOutputs, false);
    });
  });
}); 