import { ICharacter } from './ICharacter';
import { IConversation } from './IConversation';
import { IMessage } from './IMessage';

/**
 * 会话服务接口 - 定义会话管理的基本操作
 */
export interface IConversationService {
  /**
   * 获取所有会话
   */
  getAllConversations(): Promise<IConversation[]>;
  
  /**
   * 根据ID获取会话
   */
  getConversationById(id: string): Promise<IConversation | null>;
  
  /**
   * 创建会话
   */
  createConversation(character: ICharacter): Promise<IConversation>;
  
  /**
   * 向会话添加消息
   */
  addMessage(conversationId: string, message: Omit<IMessage, 'id' | 'timestamp'>): Promise<IMessage>;
  
  /**
   * 获取AI回复
   */
  getAIResponse(conversationId: string): Promise<IMessage>;
  
  /**
   * 删除会话
   */
  deleteConversation(id: string): Promise<boolean>;
} 