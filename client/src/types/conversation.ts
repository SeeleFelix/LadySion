// 消息类型
export type MessageRole = 'user' | 'assistant' | 'system'

// 消息内容
export interface Message {
  id: string
  role: MessageRole
  content: string
  timestamp: string
  conversationId: string
}

// 对话
export interface Conversation {
  id: string
  title: string
  characterId: string
  messages: Message[]
  createdAt: string
  updatedAt: string
  lastMessage?: string
}

// 创建对话的数据类型
export interface CreateConversationData {
  title: string
  characterId: string
}

// 发送消息的数据类型
export interface SendMessageData {
  content: string
  conversationId: string
}

// 对话状态
export interface ConversationState {
  conversations: Conversation[]
  currentConversation: Conversation | null
  messages: Message[]
  loading: boolean
  error: string | null
  isStreaming: boolean
} 