import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { LLMService } from '../../../domain/ports/output/LLMService';
import { Message } from '../../../domain/entities/Message';
import { tools } from './tools';

/**
 * LangGraph适配器 - 实现LLMService接口，使用LangGraph创建ReAct代理
 */
export class LangGraphAdapter implements LLMService {
  private agent!: any;
  private apiKey: string;
  private fallbackLLM: LLMService;
  private isOpenRouter: boolean;
  private modelName: string;
  
  constructor(
    apiKey: string, 
    fallbackLLM: LLMService, 
    isOpenRouter: boolean = false,
    modelName: string = 'gpt-3.5-turbo'
  ) {
    this.apiKey = apiKey;
    this.fallbackLLM = fallbackLLM;
    this.isOpenRouter = isOpenRouter;
    this.modelName = modelName;
  }
  
  async initialize(): Promise<void> {
    // 确保备用LLM也初始化
    await this.fallbackLLM.initialize();
    
    const modelOptions: any = {
      openAIApiKey: this.apiKey,
      modelName: this.isOpenRouter ? this.modelName : 'gpt-3.5-turbo',
      temperature: 0.7,
    };
    
    // 如果使用OpenRouter，需要添加baseURL
    if (this.isOpenRouter) {
      modelOptions.configuration = {
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'https://localhost:3000',
          'X-Title': 'LadySion'
        }
      };
    }
    
    const model = new ChatOpenAI(modelOptions);
    
    this.agent = createReactAgent({
      llm: model,
      tools: tools, // 使用我们定义的工具
    });
  }
  
  async generateResponse(messages: Message[], systemPrompt: string): Promise<string> {
    const langchainMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
    
    // 添加系统提示，增强系统提示以支持工具使用
    let enhancedSystemPrompt = systemPrompt || '';
    if (tools.length > 0) {
      enhancedSystemPrompt += `\n\n你可以使用以下工具来帮助回答用户问题：
${tools.map(tool => `- ${tool.name}: ${tool.description}`).join('\n')}

当用户询问可能需要使用这些工具的问题时，可以主动使用工具获取信息。`;
    }
    
    if (enhancedSystemPrompt) {
      langchainMessages.unshift({
        role: 'system',
        content: enhancedSystemPrompt,
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
      return this.fallbackLLM.generateResponse(messages, systemPrompt);
    }
  }
} 