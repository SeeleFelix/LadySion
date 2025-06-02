/**
 * 🧪 Node Flow 整体集成测试
 */

import { describe, it } from '@std/testing/bdd';
import { assertEquals, assertExists } from '@std/assert';
import { GraphExecutor } from '@node-flow/engine/graph-executor.ts';
import { PureNode } from '@node-flow/core/pure-node.ts';
import { UIInputNode } from '@node-flow/core/ui-input-node.ts';
import { UIOutputNode } from '@node-flow/core/ui-output-node.ts';
import { NodeData } from '@node-flow/core/types.ts';

describe('Node Flow 整体集成测试', () => {
  describe('RAG聊天工作流测试', () => {
    it('应该成功执行完整的RAG聊天流程', async () => {
      const executor = new GraphExecutor();
      
      // 创建RAG聊天工作流节点
      class UserInputNode extends UIInputNode {
        override async getUserInput(): Promise<NodeData> {
          return { userMessage: '什么是JavaScript？' };
        }
      }
      
      class FormatNode extends PureNode {
        override async process(data: NodeData): Promise<NodeData> {
          return {
            ...data,
            formattedQuery: `用户问题：${data.userMessage}`
          };
        }
      }
      
      class RAGRetrievalNode extends PureNode {
        override async process(data: NodeData): Promise<NodeData> {
          return {
            ...data,
            ragContext: 'JavaScript是一种编程语言，用于Web开发...'
          };
        }
      }
      
      class PromptMergeNode extends PureNode {
        override async process(data: NodeData): Promise<NodeData> {
          return {
            ...data,
            finalPrompt: `${data.formattedQuery}\n上下文：${data.ragContext}`
          };
        }
      }
      
      class APICallNode extends PureNode {
        override async process(data: NodeData): Promise<NodeData> {
          return {
            ...data,
            aiResponse: '基于上下文，JavaScript是一种强大的编程语言...'
          };
        }
      }
      
      class ResponseFormatNode extends PureNode {
        override async process(data: NodeData): Promise<NodeData> {
          return {
            ...data,
            formattedResponse: `答案：${data.aiResponse}`
          };
        }
      }
      
      class ChatDisplayNode extends UIOutputNode {
        override async displayOutput(data: NodeData): Promise<void> {
          console.log(`[聊天界面] ${data.formattedResponse}`);
        }
      }
      
      // 创建节点实例
      const userInput = new UserInputNode('user-input', '用户输入');
      const format = new FormatNode('format', '格式化');
      const ragRetrieval = new RAGRetrievalNode('rag-retrieval', 'RAG检索');
      const promptMerge = new PromptMergeNode('prompt-merge', '提示词合并');
      const apiCall = new APICallNode('api-call', 'API调用');
      const responseFormat = new ResponseFormatNode('response-format', '响应格式化');
      const chatDisplay = new ChatDisplayNode('chat-display', '聊天显示');
      
      const nodes = [userInput, format, ragRetrieval, promptMerge, apiCall, responseFormat, chatDisplay];
      const connections = [
        { from: 'user-input', to: 'format' },
        { from: 'format', to: 'rag-retrieval' },
        { from: 'rag-retrieval', to: 'prompt-merge' },
        { from: 'prompt-merge', to: 'api-call' },
        { from: 'api-call', to: 'response-format' },
        { from: 'response-format', to: 'chat-display' }
      ];
      
      // 执行工作流
      const result = await executor.execute(nodes, connections);
      
      // 验证结果
      assertEquals(result.success, true);
      assertExists(result.nodeResults);
      assertExists(result.executionTime);
      
      // 验证数据流
      const userInputResult = result.nodeResults.get('user-input');
      assertEquals(userInputResult?.userMessage, '什么是JavaScript？');
      
      const formatResult = result.nodeResults.get('format');
      assertEquals(formatResult?.formattedQuery, '用户问题：什么是JavaScript？');
      
      const ragResult = result.nodeResults.get('rag-retrieval');
      assertExists(ragResult?.ragContext);
      
      const finalResult = result.nodeResults.get('response-format');
      assertExists(finalResult?.formattedResponse);
    });

    it('应该支持可选输入和输出丢弃配置', async () => {
      const executor = new GraphExecutor();
      
      // 带有可选输入的节点
      class OptionalInputNode extends PureNode {
        override async process(data: NodeData): Promise<NodeData> {
          const required = data.required || '默认值';
          const optional = data.optional || '可选默认值';
          return { 
            result: `${required} + ${optional}` 
          };
        }
      }
      
      // 丢弃输出的节点
      class DiscardOutputNode extends PureNode {
        override async process(data: NodeData): Promise<NodeData> {
          // 处理数据但不产生输出
          console.log(`处理中: ${data.result}`);
          return {}; // 空输出
        }
      }
      
      const inputNode = new UIInputNode('input', '输入');
      const optionalNode = new OptionalInputNode('optional', '可选输入');
      const discardNode = new DiscardOutputNode('discard', '丢弃输出');
      
      const nodes = [inputNode, optionalNode, discardNode];
      const connections = [
        { from: 'input', to: 'optional' },
        { from: 'optional', to: 'discard' }
      ];
      
      const result = await executor.execute(nodes, connections);
      assertEquals(result.success, true);
    });
  });

  describe('性能和边界测试', () => {
    it('应该在合理时间内执行大型图', async () => {
      const executor = new GraphExecutor();
      
      // 创建100个节点的大型图
      const nodes = [];
      const connections = [];
      
      for (let i = 0; i < 100; i++) {
        nodes.push(new PureNode(`node-${i}`, `Node ${i}`));
        if (i > 0) {
          connections.push({ from: `node-${i-1}`, to: `node-${i}` });
        }
      }
      
      const startTime = Date.now();
      const result = await executor.execute(nodes, connections);
      const endTime = Date.now();
      
      assertEquals(result.success, true);
      // 应该在1秒内完成
      assertEquals(endTime - startTime < 1000, true);
      
      // 验证所有节点都被执行
      assertEquals(result.nodeResults?.size, 100);
    });

    it('应该正确报告执行统计信息', async () => {
      const executor = new GraphExecutor();
      
      const nodes = [
        new UIInputNode('input', 'Input'),
        new PureNode('process', 'Process'),
        new UIOutputNode('output', 'Output')
      ];
      
      const connections = [
        { from: 'input', to: 'process' },
        { from: 'process', to: 'output' }
      ];
      
      const result = await executor.execute(nodes, connections);
      
      assertEquals(result.success, true);
      assertExists(result.executionTime);
      assertExists(result.nodeResults);
      assertEquals(result.nodeResults.size, 2); // UI输出节点不产生结果
    });
  });
}); 