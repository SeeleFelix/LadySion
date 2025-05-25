import { ICharacter } from './ICharacter';

/**
 * 角色服务接口 - 定义角色管理的基本操作
 */
export interface ICharacterService {
  /**
   * 获取所有角色
   */
  getAllCharacters(): Promise<ICharacter[]>;
  
  /**
   * 根据ID获取角色
   */
  getCharacterById(id: string): Promise<ICharacter | null>;
  
  /**
   * 创建角色
   */
  createCharacter(character: Omit<ICharacter, 'id'>): Promise<ICharacter>;
  
  /**
   * 更新角色
   */
  updateCharacter(id: string, character: Partial<ICharacter>): Promise<ICharacter | null>;
  
  /**
   * 删除角色
   */
  deleteCharacter(id: string): Promise<boolean>;
} 