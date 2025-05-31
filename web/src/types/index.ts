// API相关类型
export type {
  ApiError,
  ApiResponse,
  HttpMethod,
  PaginatedResponse,
  RequestStatus,
} from "@/types/api";

// 角色相关类型
export type {
  Character,
  CharacterState,
  CreateCharacterData,
  UpdateCharacterData,
} from "@/types/character";

// 对话相关类型
export type {
  Conversation,
  ConversationState,
  CreateConversationData,
  Message,
  MessageRole,
  MessageType,
  SendMessageData,
  StreamingData,
} from "@/types/conversation";

// UI相关类型
export interface UIState {
  theme: "light" | "dark";
  sidebarCollapsed: boolean;
  loading: boolean;
}
