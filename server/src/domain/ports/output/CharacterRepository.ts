import { Character } from '../../entities/Character';

/**
 * 角色仓储端口 - 定义与角色存储相关的接口
 */
export interface CharacterRepository {
  /**
   * 获取所有角色
   */
  findAll(): Promise<Character[]>;
  
  /**
   * 根据ID获取角色
   */
  findById(id: string): Promise<Character | null>;
  
  /**
   * 保存角色
   */
  save(character: Character): Promise<Character>;
  
  /**
   * 删除角色
   */
  delete(id: string): Promise<boolean>;
} 