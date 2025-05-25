import { Character } from '../../entities/Character';

/**
 * 角色服务输入端口 - 定义角色相关的用例
 */
export interface CharacterService {
  /**
   * 获取所有角色
   */
  getAllCharacters(): Promise<Character[]>;
  
  /**
   * 根据ID获取角色
   */
  getCharacterById(id: string): Promise<Character | null>;
  
  /**
   * 创建角色
   */
  createCharacter(characterData: Omit<Character, 'id' | 'toObject'>): Promise<Character>;
  
  /**
   * 更新角色
   */
  updateCharacter(id: string, characterData: Partial<Character>): Promise<Character | null>;
  
  /**
   * 删除角色
   */
  deleteCharacter(id: string): Promise<boolean>;
} 