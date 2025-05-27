import { Character } from '../entities/Character';

/**
 * 角色存储库接口
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
   * 根据名称获取角色
   */
  findByName(name: string): Promise<Character | null>;

  /**
   * 保存角色
   */
  save(character: Character): Promise<Character>;

  /**
   * 删除角色
   */
  delete(id: string): Promise<boolean>;

  /**
   * 检查角色是否存在
   */
  exists(id: string): Promise<boolean>;

  /**
   * 初始化存储库
   */
  initialize(): Promise<void>;

  /**
   * 关闭存储库连接
   */
  close(): Promise<void>;
}