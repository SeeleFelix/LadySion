import { ICharacter, ICharacterService } from '../../core/interfaces';
import { v4 as uuidv4 } from 'uuid';

/**
 * 角色服务实现 - 提供角色管理功能
 */
export class CharacterService implements ICharacterService {
  private characters: Map<string, ICharacter> = new Map();
  
  /**
   * 获取所有角色
   */
  async getAllCharacters(): Promise<ICharacter[]> {
    return Array.from(this.characters.values());
  }
  
  /**
   * 根据ID获取角色
   */
  async getCharacterById(id: string): Promise<ICharacter | null> {
    return this.characters.get(id) || null;
  }
  
  /**
   * 创建角色
   */
  async createCharacter(character: Omit<ICharacter, 'id'>): Promise<ICharacter> {
    const id = uuidv4();
    const newCharacter: ICharacter = {
      id,
      ...character
    };
    
    this.characters.set(id, newCharacter);
    return newCharacter;
  }
  
  /**
   * 更新角色
   */
  async updateCharacter(id: string, characterUpdate: Partial<ICharacter>): Promise<ICharacter | null> {
    const character = this.characters.get(id);
    if (!character) {
      return null;
    }
    
    const updatedCharacter = {
      ...character,
      ...characterUpdate
    };
    
    this.characters.set(id, updatedCharacter);
    return updatedCharacter;
  }
  
  /**
   * 删除角色
   */
  async deleteCharacter(id: string): Promise<boolean> {
    return this.characters.delete(id);
  }
} 