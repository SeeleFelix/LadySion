import { v4 as uuidv4 } from 'uuid'
import { SendMessageUseCase } from '../usecases/SendMessageUseCase'
import { ChatRepository } from '../../domain/repositories/ChatRepository'
import { CharacterRepository } from '../../domain/repositories/CharacterRepository'
import { ChatOrchestrationService } from '../../domain/services/ChatOrchestrationService'
import { Chat } from '../../domain/entities/Chat'
import { 
  SendMessageCommand, 
  CreateChatCommand, 
  GetChatHistoryQuery,
  SendMessageResult,
  ChatDto,
  MessageDto 
} from '../dto/ChatDto'
import { Result } from '../../shared/types'
import { NotFoundError } from '../../shared/errors/DomainErrors'

/**
 * 聊天应用服务 - 协调聊天相关的业务流程
 */
export class ChatApplicationService {
  constructor(
    private readonly sendMessageUseCase: SendMessageUseCase,
    private readonly chatRepository: ChatRepository,
    private readonly characterRepository: CharacterRepository,
    private readonly chatOrchestrationService: ChatOrchestrationService
  ) {}

  /**
   * 发送消息
   */
  async sendMessage(command: SendMessageCommand): Promise<Result<SendMessageResult>> {
    return await this.sendMessageUseCase.execute(command)
  }

  /**
   * 创建对话
   */
  async createChat(command: CreateChatCommand): Promise<Result<ChatDto>> {
    try {
      // 验证角色是否存在
      let character = null
      if (command.characterId) {
        character = await this.characterRepository.findById(command.characterId)
        if (!character) {
          throw new NotFoundError(`角色不存在: ${command.characterId}`)
        }
      }

      // 创建对话
      const chatId = uuidv4()
      const title = command.title || (character ? `与${character.name}的对话` : '新对话')
      
      const chat = Chat.create(chatId, title, command.characterId)

      // 如果角色有首条消息，添加它
      if (character?.firstMessage) {
        const welcomeMessage = {
          id: uuidv4(),
          role: 'assistant' as const,
          content: character.firstMessage,
          timestamp: new Date(),
          metadata: { type: 'welcome' }
        }
        
        const message = require('../../domain/entities/Message').Message.fromData(welcomeMessage)
        chat.addMessage(message)
      }

      // 保存对话
      await this.chatRepository.save(chat)

      const result = this.chatToDto(chat)
      return { success: true, data: result }

    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: error.message }
      }
      return { success: false, error: '创建对话失败' }
    }
  }

  /**
   * 获取对话历史
   */
  async getChatHistory(query: GetChatHistoryQuery): Promise<Result<MessageDto[]>> {
    try {
      const chat = await this.chatRepository.findById(query.chatId)
      if (!chat) {
        throw new NotFoundError(`对话不存在: ${query.chatId}`)
      }

      let messages = chat.messages
      
      // 应用分页
      if (query.offset !== undefined) {
        messages = messages.slice(query.offset)
      }
      if (query.limit !== undefined) {
        messages = messages.slice(0, query.limit)
      }

      const result = messages.map(msg => this.messageToDto(msg))
      return { success: true, data: result }

    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: error.message }
      }
      return { success: false, error: '获取历史失败' }
    }
  }

  /**
   * 获取对话列表
   */
  async getChats(): Promise<Result<ChatDto[]>> {
    try {
      const chats = await this.chatRepository.findAll()
      const result = chats.map(chat => this.chatToDto(chat))
      return { success: true, data: result }

    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: error.message }
      }
      return { success: false, error: '获取对话列表失败' }
    }
  }

  /**
   * 删除对话
   */
  async deleteChat(chatId: string): Promise<Result<boolean>> {
    try {
      const success = await this.chatRepository.delete(chatId)
      return { success: true, data: success }

    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: error.message }
      }
      return { success: false, error: '删除对话失败' }
    }
  }

  private chatToDto(chat: Chat): ChatDto {
    return {
      id: chat.id,
      title: chat.title,
      characterId: chat.characterId || undefined,
      messageCount: chat.messageCount,
      lastMessage: chat.lastMessage ? this.messageToDto(chat.lastMessage) : undefined,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt
    }
  }

  private messageToDto(message: any): MessageDto {
    return {
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp,
      metadata: message.metadata
    }
  }
} 