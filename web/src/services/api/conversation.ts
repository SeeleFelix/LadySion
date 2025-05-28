import { BaseApiService } from '@/services/api'
import type { 
  Conversation, 
  Message, 
  CreateConversationData, 
  SendMessageData,
  StreamingData 
} from '@/types'

class ConversationService extends BaseApiService {
  /**
   * 获取所有对话
   */
  async getAll(): Promise<Conversation[]> {
    return this.get<Conversation[]>('/conversations')
  }

  /**
   * 根据ID获取对话
   */
  async getById(id: string): Promise<Conversation> {
    return this.get<Conversation>(`/conversations/${id}`)
  }

  /**
   * 创建对话
   */
  async create(data: CreateConversationData): Promise<Conversation> {
    return this.post<Conversation>('/conversations', data)
  }

  /**
   * 删除对话
   */
  async remove(id: string): Promise<void> {
    return this.delete(`/conversations/${id}`)
  }

  /**
   * 获取对话消息
   */
  async getMessages(conversationId: string): Promise<Message[]> {
    return this.get<Message[]>(`/conversations/${conversationId}/messages`)
  }

  /**
   * 发送消息
   */
  async sendMessage(data: SendMessageData): Promise<Message> {
    return this.post<Message>('/messages', data)
  }

  /**
   * 发送流式消息
   */
  async sendStreamingMessage(
    data: SendMessageData, 
    onChunk?: (chunk: string) => void
  ): Promise<Message> {
    // 这里需要实现SSE流式处理
    const response = await fetch('/api/messages/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.body) {
      throw new Error('Response body is null')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let result = ''

    while (true) {
      const { done, value } = await reader.read()
      
      if (done) break
      
      const chunk = decoder.decode(value)
      result += chunk
      
      if (onChunk) {
        onChunk(chunk)
      }
    }

    // 返回完整的消息对象
    return JSON.parse(result)
  }
}

export const conversationApi = new ConversationService() 