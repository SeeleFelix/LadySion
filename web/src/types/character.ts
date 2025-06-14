/**
 * 角色接口定义
 */
export interface Character {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  systemPrompt?: string;
  exampleDialogue?: string;
  personality?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 示例对话接口
 */
export interface ExampleDialogue {
  user: string;
  assistant: string;
}

/**
 * 角色创建表单数据
 */
export interface CharacterFormData extends Omit<Character, "id" | "createdAt" | "updatedAt"> {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 角色过滤选项
 */
export interface CharacterFilter {
  search?: string;
  tags?: string[];
  sortBy?: "name" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

/**
 * 角色统计信息
 */
export interface CharacterStats {
  totalCharacters: number;
  totalConversations: number;
  averageMessageLength: number;
  mostUsedTags: string[];
}

// 创建角色的数据类型
export interface CreateCharacterData {
  name: string;
  description: string;
  avatar?: string;
  systemPrompt?: string;
  exampleDialogue?: string;
  personality?: string;
}

// 更新角色的数据类型
export interface UpdateCharacterData extends Partial<CreateCharacterData> {
  id: string;
}

// 角色状态
export interface CharacterState {
  characters: Character[];
  currentCharacter: Character | null;
  loading: boolean;
  error: string | null;
}
