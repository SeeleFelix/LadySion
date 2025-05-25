/**
 * 消息接口 - 定义聊天消息的基本结构
 */
export interface IMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
} 