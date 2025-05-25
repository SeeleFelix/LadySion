import { Character } from '../../domain/entities/Character';
import { CharacterRepository } from '../../domain/ports/output/CharacterRepository';

/**
 * 内存角色仓储 - 实现CharacterRepository接口，使用内存存储角色数据
 */
export class InMemoryCharacterRepository implements CharacterRepository {
  private characters: Map<string, Character> = new Map();
  
  /**
   * 获取所有角色
   */
  async findAll(): Promise<Character[]> {
    return Array.from(this.characters.values());
  }
  
  /**
   * 根据ID获取角色
   */
  async findById(id: string): Promise<Character | null> {
    return this.characters.get(id) || null;
  }
  
  /**
   * 保存角色
   */
  async save(character: Character): Promise<Character> {
    this.characters.set(character.id, character);
    return character;
  }
  
  /**
   * 删除角色
   */
  async delete(id: string): Promise<boolean> {
    return this.characters.delete(id);
  }
} 