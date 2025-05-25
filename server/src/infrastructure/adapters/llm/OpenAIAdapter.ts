import { ChatOpenAI } from '@langchain/openai';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { LLMService } from '../../../domain/ports/output/LLMService';
import { Message } from '../../../domain/entities/Message';

/**
 * OpenAI适配器 - 实现LLMService接口，连接OpenAI API
 */
export class OpenAIAdapter implements LLMService {
  private model!: ChatOpenAI;
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async initialize(): Promise<void> {
    this.model = new ChatOpenAI({
      openAIApiKey: this.apiKey,
      modelName: 'gpt-3.5-turbo',
      temperature: 0.7,
    });
  }
  
  async generateResponse(messages: Message[], systemPrompt: string): Promise<string> {
    const langchainMessages = messages.map(msg => {
      if (msg.role === 'user') {
        return new HumanMessage(msg.content);
      } else if (msg.role === 'assistant') {
        return new AIMessage(msg.content);
      } else {
        return new SystemMessage(msg.content);
      }
    });
    
    // 添加系统提示
    if (systemPrompt) {
      langchainMessages.unshift(new SystemMessage(systemPrompt));
    }
    
    const response = await this.model.invoke(langchainMessages);
    return response.content.toString();
  }
} 