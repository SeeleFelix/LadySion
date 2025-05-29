import { Message } from '../entities/Message'
import { Chat } from '../entities/Chat'
import { Character } from '../entities/Character'
import { ValidationError } from '../../shared/errors/DomainErrors'

/**
 * 聊天编排领域服务 - 处理聊天相关的复杂业务逻辑
 */
export class ChatOrchestrationService {
  /**
   * 构建系统消息
   */
  buildSystemMessage(
    messageId: string,
    character: Character | null,
    customSystemPrompt?: string
  ): Message {
    let systemPrompt: string

    if (customSystemPrompt) {
      systemPrompt = customSystemPrompt
    } else if (character) {
      systemPrompt = character.systemPrompt
    } else {
      systemPrompt = '你是一个有帮助的AI助手。'
    }

    return Message.create(
      messageId,
      'system',
      systemPrompt,
      { source: character ? 'character' : 'default' }
    )
  }

  /**
   * 验证消息顺序和内容
   */
  validateMessageSequence(chat: Chat, newMessage: Message): void {
    const messages = chat.messages

    // 检查连续的用户消息
    if (newMessage.isFromUser() && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.isFromUser()) {
        throw new ValidationError('不能连续发送用户消息')
      }
    }

    // 检查消息内容长度
    if (newMessage.content.length > 10000) {
      throw new ValidationError('消息内容过长')
    }
  }

  /**
   * 构建对话上下文
   */
  buildConversationContext(
    chat: Chat,
    character: Character | null,
    maxMessages: number = 20
  ): Message[] {
    const context: Message[] = []

    // 添加系统消息
    if (character) {
      const systemMessage = this.buildSystemMessage(
        `system-${Date.now()}`,
        character
      )
      context.push(systemMessage)
    }

    // 添加历史消息（最近的 maxMessages 条）
    const recentMessages = chat.messages.slice(-maxMessages)
    context.push(...recentMessages)

    return context
  }

  /**
   * 生成对话标题
   */
  generateChatTitle(firstUserMessage: string): string {
    // 从第一条用户消息生成标题
    let title = firstUserMessage.trim()

    // 限制长度
    if (title.length > 30) {
      title = title.substring(0, 27) + '...'
    }

    // 移除换行符
    title = title.replace(/\n/g, ' ')

    return title || '新对话'
  }

  /**
   * 检查对话是否需要归档
   */
  shouldArchiveChat(chat: Chat): boolean {
    const now = new Date()
    const daysSinceUpdate = (now.getTime() - chat.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
    
    // 超过30天未更新且消息数量较少
    return daysSinceUpdate > 30 && chat.messageCount < 5
  }
} 