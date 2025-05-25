import { v4 as uuidv4 } from 'uuid';
import { ICharacter, IConversation, IConversationService, IMessage, ILLM } from '../../core/interfaces';
import { LangGraphAgent } from '../../adapters/llm/LangGraphAgent';

/**
 * 会话服务实现 - 提供会话管理功能
 */
export class ConversationService implements IConversationService {
  private conversations: Map<string, IConversation> = new Map();
  private llm: ILLM;
  private agent: LangGraphAgent;
  
  constructor(llm: ILLM) {
    this.llm = llm;
    this.agent = new LangGraphAgent(llm);
  }
  
  async initialize(apiKey: string): Promise<void> {
    await this.llm.initialize();
    await this.agent.initialize(apiKey);
  }
  
  /**
   * 获取所有会话
   */
  async getAllConversations(): Promise<IConversation[]> {
    return Array.from(this.conversations.values());
  }
  
  /**
   * 根据ID获取会话
   */
  async getConversationById(id: string): Promise<IConversation | null> {
    return this.conversations.get(id) || null;
  }
  
  /**
   * 创建会话
   */
  async createConversation(character: ICharacter): Promise<IConversation> {
    const id = uuidv4();
    const now = Date.now();
    
    const newConversation: IConversation = {
      id,
      name: `与${character.name}的对话`,
      character,
      messages: [],
      createdAt: now,
      updatedAt: now
    };
    
    // 如果角色有首条消息，则添加到会话中
    if (character.firstMessage) {
      const firstMessage: IMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: character.firstMessage,
        timestamp: now
      };
      
      newConversation.messages.push(firstMessage);
    }
    
    this.conversations.set(id, newConversation);
    return newConversation;
  }
  
  /**
   * 向会话添加消息
   */
  async addMessage(conversationId: string, message: Omit<IMessage, 'id' | 'timestamp'>): Promise<IMessage> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`会话不存在: ${conversationId}`);
    }
    
    const newMessage: IMessage = {
      id: uuidv4(),
      ...message,
      timestamp: Date.now()
    };
    
    conversation.messages.push(newMessage);
    conversation.updatedAt = newMessage.timestamp;
    
    return newMessage;
  }
  
  /**
   * 获取AI回复
   */
  async getAIResponse(conversationId: string): Promise<IMessage> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`会话不存在: ${conversationId}`);
    }
    
    const { character, messages } = conversation;
    
    // 使用LangGraph代理获取回复
    const responseContent = await this.agent.getResponse(
      messages,
      character.systemPrompt
    );
    
    // 创建并添加AI回复消息
    const responseMessage: IMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: responseContent,
      timestamp: Date.now()
    };
    
    conversation.messages.push(responseMessage);
    conversation.updatedAt = responseMessage.timestamp;
    
    return responseMessage;
  }
  
  /**
   * 删除会话
   */
  async deleteConversation(id: string): Promise<boolean> {
    return this.conversations.delete(id);
  }
} 