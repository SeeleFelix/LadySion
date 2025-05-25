import { IMessage } from './IMessage';

/**
 * LLM接口 - 定义语言模型的基本操作
 */
export interface ILLM {
  /**
   * 初始化LLM
   */
  initialize(): Promise<void>;
  
  /**
   * 生成回复
   * @param messages 上下文消息列表
   * @param systemPrompt 系统提示词
   * @returns 生成的回复
   */
  generateResponse(messages: IMessage[], systemPrompt: string): Promise<string>;
} 