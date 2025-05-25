import { Message } from '../../entities/Message';

/**
 * LLM服务端口 - 定义与语言模型交互的接口
 */
export interface LLMService {
  /**
   * 初始化LLM服务
   */
  initialize(): Promise<void>;
  
  /**
   * 生成回复
   * @param messages 上下文消息列表
   * @param systemPrompt 系统提示词
   * @returns 生成的回复文本
   */
  generateResponse(messages: Message[], systemPrompt: string): Promise<string>;
} 