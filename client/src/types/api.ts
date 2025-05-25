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