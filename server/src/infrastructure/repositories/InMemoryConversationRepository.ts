import { Conversation } from '../../domain/entities/Conversation';
import { Message } from '../../domain/entities/Message';
import { ConversationRepository } from '../../domain/ports/output/ConversationRepository';

/**
 * 内存会话仓储 - 实现ConversationRepository接口，使用内存存储会话数据
 */
export class InMemoryConversationRepository implements ConversationRepository {
  private conversations: Map<string, Conversation> = new Map();
  
  /**
   * 获取所有会话
   */
  async findAll(): Promise<Conversation[]> {
    return Array.from(this.conversations.values());
  }
  
  /**
   * 根据ID获取会话
   */
  async findById(id: string): Promise<Conversation | null> {
    return this.conversations.get(id) || null;
  }
  
  /**
   * 保存会话
   */
  async save(conversation: Conversation): Promise<Conversation> {
    this.conversations.set(conversation.id, conversation);
    return conversation;
  }
  
  /**
   * 添加消息到会话
   */
  async addMessage(conversationId: string, message: Message): Promise<Message> {
    const conversation = this.conversations.get(conversationId);
    
    if (!conversation) {
      throw new Error(`会话不存在: ${conversationId}`);
    }
    
    conversation.addMessage(message);
    this.conversations.set(conversationId, conversation);
    
    return message;
  }
  
  /**
   * 删除会话
   */
  async delete(id: string): Promise<boolean> {
    return this.conversations.delete(id);
  }
} 