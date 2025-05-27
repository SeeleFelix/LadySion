// 基础ID类型
export type ChatId = string
export type ConversationId = string  
export type MessageId = string
export type CharacterId = string
export type PresetId = string
export type UserId = string

// 分页相关
export interface Pagination {
  limit: number
  offset: number
}

// 排序选项
export interface SortOption {
  field: string
  direction: 'asc' | 'desc'
}

// API响应格式
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

// 结果类型
export interface Result<T> {
  success: boolean
  data?: T
  error?: string
}

// 消息角色类型
export type MessageRole = 'user' | 'assistant' | 'system'

// LLM模型信息
export interface ModelInfo {
  id: string
  name: string
  provider: string
  maxTokens?: number
  pricePerToken?: number
} 