// 角色接口
export interface Character {
  id: string;
  name: string;
  description: string;
  personality: string;
  firstMessage?: string;
  avatar?: string;
  systemPrompt: string;
  exampleDialogs?: string;
}

// 消息接口
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

// 会话接口
export interface Conversation {
  id: string;
  name: string;
  character: Character;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

// API响应通用类型
export interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
}

// 分页响应类型
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

// 请求状态类型
export type RequestStatus = 'idle' | 'loading' | 'success' | 'error'

// HTTP请求方法
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

// API错误类型
export interface ApiError {
  code: string
  message: string
  details?: any
} 