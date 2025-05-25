import { Character } from '../../entities/Character';
import { Conversation } from '../../entities/Conversation';
import { Message } from '../../entities/Message';

/**
 * 会话服务输入端口 - 定义会话相关的用例
 */
export interface ConversationService {
  /**
   * 获取所有会话
   */
  getAllConversations(): Promise<Conversation[]>;
  
  /**
   * 根据ID获取会话
   */
  getConversationById(id: string): Promise<Conversation | null>;
  
  /**
   * 创建会话
   */
  createConversation(character: Character): Promise<Conversation>;
  
  /**
   * 向会话添加消息
   */
  addMessage(conversationId: string, messageData: { role: 'user' | 'assistant' | 'system', content: string }): Promise<Message>;
  
  /**
   * 获取AI回复
   */
  getAIResponse(conversationId: string): Promise<Message>;
  
  /**
   * 删除会话
   */
  deleteConversation(id: string): Promise<boolean>;
} 