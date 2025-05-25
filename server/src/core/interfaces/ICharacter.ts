/**
 * 角色接口 - 定义角色卡的基本属性
 */
export interface ICharacter {
  id: string;
  name: string;
  description: string;
  personality: string;
  firstMessage?: string;
  avatar?: string;
  systemPrompt: string;
  exampleDialogs?: string;
} 