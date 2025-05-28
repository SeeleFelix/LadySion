// API相关类型
export type {
  ApiResponse,
  ApiError,
  PaginatedResponse,
  RequestStatus,
  HttpMethod
} from '@/types/api'

// 角色相关类型
export type {
  Character,
  CreateCharacterData,
  UpdateCharacterData,
  CharacterState
} from '@/types/character'

// 对话相关类型
export type {
  Conversation,
  Message,
  MessageType,
  MessageRole,
  CreateConversationData,
  SendMessageData,
  StreamingData,
  ConversationState
} from '@/types/conversation'

// UI相关类型
export interface UIState {
  theme: 'light' | 'dark'
  sidebarCollapsed: boolean
  loading: boolean
} 