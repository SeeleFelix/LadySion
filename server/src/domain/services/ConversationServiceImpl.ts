import { v4 as uuidv4 } from 'uuid';
import { Character } from '../entities/Character';
import { Conversation } from '../entities/Conversation';
import { Message } from '../entities/Message';
import { ConversationService } from '../ports/input/ConversationService';
import { ConversationRepository } from '../ports/output/ConversationRepository';
import { LLMService } from '../ports/output/LLMService';

/**
 * 会话服务实现 - 实现会话相关的用例
 */
export class ConversationServiceImpl implements ConversationService {
  constructor(
    private conversationRepository: ConversationRepository,
    private llmService: LLMService
  ) {}
  
  /**
   * 获取所有会话
   */
  async getAllConversations(): Promise<Conversation[]> {
    return this.conversationRepository.findAll();
  }
  
  /**
   * 根据ID获取会话
   */
  async getConversationById(id: string): Promise<Conversation | null> {
    return this.conversationRepository.findById(id);
  }
  
  /**
   * 创建会话
   */
  async createConversation(character: Character): Promise<Conversation> {
    const id = uuidv4();
    const name = `与${character.name}的对话`;
    const now = Date.now();
    
    const conversation = new Conversation(
      id,
      name,
      character,
      [],
      now,
      now
    );
    
    // 如果角色有首条消息，则添加到会话中
    if (character.firstMessage) {
      const firstMessage = new Message(
        uuidv4(),
        'assistant',
        character.firstMessage,
        now
      );
      
      conversation.addMessage(firstMessage);
    }
    
    return this.conversationRepository.save(conversation);
  }
  
  /**
   * 向会话添加消息
   */
  async addMessage(conversationId: string, messageData: { role: 'user' | 'assistant' | 'system', content: string }): Promise<Message> {
    const message = new Message(
      uuidv4(),
      messageData.role,
      messageData.content,
      Date.now()
    );
    
    return this.conversationRepository.addMessage(conversationId, message);
  }
  
  /**
   * 获取AI回复
   */
  async getAIResponse(conversationId: string): Promise<Message> {
    const conversation = await this.conversationRepository.findById(conversationId);
    
    if (!conversation) {
      throw new Error(`会话不存在: ${conversationId}`);
    }
    
    const systemPrompt = conversation.character.systemPrompt;
    const messages = conversation.messages;
    
    // 使用LLM服务生成回复
    const responseContent = await this.llmService.generateResponse(messages, systemPrompt);
    
    // 创建AI回复消息
    const responseMessage = new Message(
      uuidv4(),
      'assistant',
      responseContent,
      Date.now()
    );
    
    // 添加到会话并返回
    return this.conversationRepository.addMessage(conversationId, responseMessage);
  }
  
  /**
   * 删除会话
   */
  async deleteConversation(id: string): Promise<boolean> {
    return this.conversationRepository.delete(id);
  }
} 