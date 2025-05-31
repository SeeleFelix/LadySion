import { CharacterId } from "@/shared/types/index.ts";

// 创建角色命令
export interface CreateCharacterCommand {
  readonly name: string;
  readonly description: string;
  readonly systemPrompt: string;
  readonly personality: string;
  readonly avatar?: string;
  readonly firstMessage?: string;
}

// 更新角色命令
export interface UpdateCharacterCommand {
  readonly id: CharacterId;
  readonly name?: string;
  readonly description?: string;
  readonly systemPrompt?: string;
  readonly personality?: string;
  readonly avatar?: string;
  readonly firstMessage?: string;
}

// 角色DTO
export interface CharacterDto {
  readonly id: CharacterId;
  readonly name: string;
  readonly description: string;
  readonly systemPrompt: string;
  readonly personality: string;
  readonly avatar?: string;
  readonly firstMessage?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
