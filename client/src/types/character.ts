/**
 * 角色接口定义
 */
export interface Character {
  id: string
  name: string
  description: string
  personality: string
  scenario: string
  avatar: string
  greeting: string
  exampleDialogues: ExampleDialogue[]
  tags: string[]
  createdAt: string
  updatedAt: string
}

/**
 * 示例对话接口
 */
export interface ExampleDialogue {
  user: string
  assistant: string
}

/**
 * 角色创建表单数据
 */
export interface CharacterFormData extends Omit<Character, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string
  createdAt?: string
  updatedAt?: string
}

/**
 * 角色过滤选项
 */
export interface CharacterFilter {
  search?: string
  tags?: string[]
  sortBy?: 'name' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}

/**
 * 角色统计信息
 */
export interface CharacterStats {
  totalCharacters: number
  totalConversations: number
  averageMessageLength: number
  mostUsedTags: string[]
} 