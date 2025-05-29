import { ChatId, MessageId, CharacterId, MessageRole } from '../../shared/types'

// 发送消息命令
export interface SendMessageCommand {
  readonly chatId: ChatId
  readonly content: string
  readonly characterId?: CharacterId
  readonly systemPrompt?: string
}

// 创建对话命令
export interface CreateChatCommand {
  readonly title?: string
  readonly characterId?: CharacterId
}

// 获取历史查询
export interface GetChatHistoryQuery {
  readonly chatId: ChatId
  readonly limit?: number
  readonly offset?: number
}

// 消息DTO
export interface MessageDto {
  readonly id: MessageId
  readonly role: MessageRole
  readonly content: string
  readonly timestamp: Date
  readonly metadata?: Record<string, any>
}

// 对话DTO
export interface ChatDto {
  readonly id: ChatId
  readonly title: string
  readonly characterId?: CharacterId
  readonly messageCount: number
  readonly lastMessage?: MessageDto
  readonly createdAt: Date
  readonly updatedAt: Date
}

// 发送消息结果
export interface SendMessageResult {
  readonly userMessage: MessageDto
  readonly assistantMessage: MessageDto
  readonly chatId: ChatId
} 