import { Conversation } from '../../entities/Conversation';
import { Message } from '../../entities/Message';

/**
 * 会话仓储端口 - 定义与会话存储相关的接口
 */
export interface ConversationRepository {
  /**
   * 获取所有会话
   */
  findAll(): Promise<Conversation[]>;
  
  /**
   * 根据ID获取会话
   */
  findById(id: string): Promise<Conversation | null>;
  
  /**
   * 保存会话
   */
  save(conversation: Conversation): Promise<Conversation>;
  
  /**
   * 添加消息到会话
   */
  addMessage(conversationId: string, message: Message): Promise<Message>;
  
  /**
   * 删除会话
   */
  delete(id: string): Promise<boolean>;
} 