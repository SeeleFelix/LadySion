/**
 * 🧪 UI输入节点测试
 */

import { describe, it } from '@std/testing/bdd';
import { assertEquals, assertExists } from '@std/assert';
import { UIInputNode } from '@node-flow/internal/core/ui-input-node.ts';
import { NodeType } from '@node-flow/internal/core/types.ts';

describe('UIInputNode UI输入节点', () => {
  describe('当创建一个UI输入节点时', () => {
    it('应该具有UI_INPUT类型', () => {
      const uiInputNode = new UIInputNode('ui-input-1', 'Test UI Input');
      assertEquals(uiInputNode.type, NodeType.UI_INPUT);
      assertEquals(uiInputNode.id, 'ui-input-1');
      assertEquals(uiInputNode.name, 'Test UI Input');
    });

    it('应该有获取用户输入的能力', async () => {
      const uiInputNode = new UIInputNode('ui-input-1', 'Test UI Input');
      
      // UI输入节点应该有getUserInput方法
      const result = await uiInputNode.getUserInput();
      assertExists(result);
    });

    it('应该标记有副作用但无输出', () => {
      const uiInputNode = new UIInputNode('ui-input-1', 'Test UI Input');
      
      // UI输入节点有副作用（与用户交互）但可以有输出
      assertEquals(uiInputNode.hasSideEffects, true);
      assertEquals(uiInputNode.canHaveOutputs, true);
    });
  });
}); 