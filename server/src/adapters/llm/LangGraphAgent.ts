import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ILLM, IMessage } from '../../core/interfaces';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';

/**
 * LangGraph聊天代理 - 使用LangGraph创建ReAct代理
 */
export class LangGraphAgent {
  private agent: any;
  private llm: ILLM;
  
  constructor(llm: ILLM) {
    this.llm = llm;
  }
  
  async initialize(openAIApiKey: string): Promise<void> {
    await this.llm.initialize();
    
    const model = new ChatOpenAI({
      openAIApiKey: openAIApiKey,
      modelName: 'gpt-3.5-turbo',
      temperature: 0.7,
    });
    
    this.agent = createReactAgent({
      llm: model,
      tools: [], // MVP中暂不添加工具
    });
  }
  
  async getResponse(messages: IMessage[], systemPrompt: string): Promise<string> {
    const langchainMessages = messages.map(msg => {
      if (msg.role === 'user') {
        return {
          role: 'user',
          content: msg.content,
        };
      } else if (msg.role === 'assistant') {
        return {
          role: 'assistant',
          content: msg.content,
        };
      } else {
        return {
          role: 'system',
          content: msg.content,
        };
      }
    });
    
    // 添加系统提示
    if (systemPrompt) {
      langchainMessages.unshift({
        role: 'system',
        content: systemPrompt,
      });
    }
    
    try {
      const result = await this.agent.invoke({
        messages: langchainMessages,
      });
      
      // 获取最后一条助手消息
      const lastMessage = result.messages.filter((m: any) => m.role === 'assistant').pop();
      return lastMessage ? lastMessage.content : '';
    } catch (error) {
      console.error('LangGraph Agent Error:', error);
      // 如果LangGraph失败，回退到基本的LLM调用
      return this.llm.generateResponse(messages, systemPrompt);
    }
  }
} 