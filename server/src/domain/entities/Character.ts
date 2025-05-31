/**
 * 角色实体
 */
export interface Character {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  systemPrompt: string;
  greeting?: string;
  firstMessage?: string;
  personality?: string;
  scenario?: string;
  exampleDialogue?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  isActive?: boolean;
}

/**
 * 角色创建数据
 */
export interface CreateCharacterData {
  name: string;
  description?: string;
  avatar?: string;
  systemPrompt: string;
  greeting?: string;
  firstMessage?: string;
  personality?: string;
  scenario?: string;
  exampleDialogue?: string;
  tags?: string[];
}

/**
 * 角色更新数据
 */
export interface UpdateCharacterData {
  name?: string;
  description?: string;
  avatar?: string;
  systemPrompt?: string;
  greeting?: string;
  firstMessage?: string;
  personality?: string;
  scenario?: string;
  exampleDialogue?: string;
  tags?: string[];
  isActive?: boolean;
}
