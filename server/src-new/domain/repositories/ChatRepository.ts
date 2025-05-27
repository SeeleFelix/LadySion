import { Chat } from '../entities/Chat'
import { ChatId, CharacterId } from '../../shared/types'

/**
 * Chat存储库接口 - 定义Chat聚合的持久化操作
 */
export interface ChatRepository {
  /**
   * 保存对话
   */
  save(chat: Chat): Promise<void>

  /**
   * 根据ID查找对话
   */
  findById(id: ChatId): Promise<Chat | null>

  /**
   * 根据角色ID查找对话列表
   */
  findByCharacterId(characterId: CharacterId): Promise<Chat[]>

  /**
   * 查找所有对话
   */
  findAll(): Promise<Chat[]>

  /**
   * 删除对话
   */
  delete(id: ChatId): Promise<boolean>

  /**
   * 检查对话是否存在
   */
  exists(id: ChatId): Promise<boolean>
} 