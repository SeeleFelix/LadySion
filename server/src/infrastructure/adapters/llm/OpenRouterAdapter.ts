import { ChatOpenAI } from '@langchain/openai';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { LLMService } from '../../../domain/ports/output/LLMService';
import { Message } from '../../../domain/entities/Message';

/**
 * OpenRouter适配器 - 实现LLMService接口，连接OpenRouter API
 */
export class OpenRouterAdapter implements LLMService {
  private model!: ChatOpenAI;
  private apiKey: string;
  private modelName: string;
  
  constructor(apiKey: string, modelName: string = 'anthropic/claude-3.5-sonnet') {
    this.apiKey = apiKey;
    this.modelName = modelName;
  }
  
  async initialize(): Promise<void> {
    // OpenRouter与OpenAI API兼容，因此可以使用ChatOpenAI，只需修改baseURL
    this.model = new ChatOpenAI({
      openAIApiKey: this.apiKey,
      modelName: this.modelName,
      temperature: 0.7,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'https://localhost:3000', // 替换为您的网站URL
          'X-Title': 'LadySion'                    // 替换为您的应用名称
        }
      }
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