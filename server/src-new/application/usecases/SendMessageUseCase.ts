import { v4 as uuidv4 } from 'uuid'
import { ChatRepository } from '../../domain/repositories/ChatRepository'
import { CharacterRepository } from '../../domain/repositories/CharacterRepository'
import { ChatOrchestrationService } from '../../domain/services/ChatOrchestrationService'
import { LLMAdapter } from '../../infrastructure/adapters/LLMAdapter'
import { SendMessageCommand, SendMessageResult, MessageDto } from '../dto/ChatDto'
import { Message } from '../../domain/entities/Message'
import { NotFoundError, ValidationError } from '../../shared/errors/DomainErrors'
import { Result } from '../../shared/types'

/**
 * 发送消息用例
 */
export class SendMessageUseCase {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly characterRepository: CharacterRepository,
    private readonly chatOrchestrationService: ChatOrchestrationService,
    private readonly llmAdapter: LLMAdapter
  ) {}

  async execute(command: SendMessageCommand): Promise<Result<SendMessageResult>> {
    try {
      // 1. 验证输入
      if (!command.content.trim()) {
        throw new ValidationError('消息内容不能为空')
      }

      // 2. 获取对话
      const chat = await this.chatRepository.findById(command.chatId)
      if (!chat) {
        throw new NotFoundError(`对话不存在: ${command.chatId}`)
      }

      // 3. 获取角色信息（如果指定）
      let character = null
      if (command.characterId) {
        character = await this.characterRepository.findById(command.characterId)
        if (!character) {
          throw new NotFoundError(`角色不存在: ${command.characterId}`)
        }
      }

      // 4. 创建用户消息
      const userMessage = Message.create(
        uuidv4(),
        'user',
        command.content.trim()
      )

      // 5. 验证消息序列
      this.chatOrchestrationService.validateMessageSequence(chat, userMessage)

      // 6. 添加用户消息到对话
      chat.addMessage(userMessage)

      // 7. 构建对话上下文
      const context = this.chatOrchestrationService.buildConversationContext(
        chat,
        character
      )

      // 8. 调用LLM生成回复
      const llmMessages = context.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      const llmResponse = await this.llmAdapter.generateCompletion({
        messages: llmMessages,
        model: 'default', // 可以根据需要选择模型
        maxTokens: 1000,
        temperature: 0.7
      })

      // 9. 创建助手消息
      const assistantMessage = Message.create(
        uuidv4(),
        'assistant',
        llmResponse.content,
        {
          model: llmResponse.model,
          tokens: llmResponse.tokens,
          finishReason: llmResponse.finishReason
        }
      )

      // 10. 添加助手消息到对话
      chat.addMessage(assistantMessage)

      // 11. 保存对话
      await this.chatRepository.save(chat)

      // 12. 返回结果
      const result: SendMessageResult = {
        userMessage: this.messageToDto(userMessage),
        assistantMessage: this.messageToDto(assistantMessage),
        chatId: chat.id
      }

      return { success: true, data: result }

    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: error.message }
      }
      return { success: false, error: '发送消息失败' }
    }
  }

  private messageToDto(message: Message): MessageDto {
    return {
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp,
      metadata: message.metadata
    }
  }
} 