import { v4 as uuidv4 } from 'uuid';
import { Character } from '../entities/Character';
import { CharacterService } from '../ports/input/CharacterService';
import { CharacterRepository } from '../ports/output/CharacterRepository';

/**
 * 角色服务实现 - 实现角色相关的用例
 */
export class CharacterServiceImpl implements CharacterService {
  constructor(private characterRepository: CharacterRepository) {}
  
  /**
   * 获取所有角色
   */
  async getAllCharacters(): Promise<Character[]> {
    return this.characterRepository.findAll();
  }
  
  /**
   * 根据ID获取角色
   */
  async getCharacterById(id: string): Promise<Character | null> {
    return this.characterRepository.findById(id);
  }
  
  /**
   * 创建角色
   */
  async createCharacter(characterData: any): Promise<Character> {
    const id = uuidv4();
    
    const character = new Character(
      id,
      characterData.name,
      characterData.description,
      characterData.personality,
      characterData.systemPrompt,
      characterData.firstMessage,
      characterData.avatar,
      characterData.exampleDialogs
    );
    
    return this.characterRepository.save(character);
  }
  
  /**
   * 更新角色
   */
  async updateCharacter(id: string, characterData: Partial<Character>): Promise<Character | null> {
    const existingCharacter = await this.characterRepository.findById(id);
    
    if (!existingCharacter) {
      return null;
    }
    
    // 更新属性
    if (characterData.name !== undefined) {
      existingCharacter.name = characterData.name;
    }
    
    if (characterData.description !== undefined) {
      existingCharacter.description = characterData.description;
    }
    
    if (characterData.personality !== undefined) {
      existingCharacter.personality = characterData.personality;
    }
    
    if (characterData.firstMessage !== undefined) {
      existingCharacter.firstMessage = characterData.firstMessage;
    }
    
    if (characterData.avatar !== undefined) {
      existingCharacter.avatar = characterData.avatar;
    }
    
    if (characterData.systemPrompt !== undefined) {
      existingCharacter.systemPrompt = characterData.systemPrompt;
    }
    
    if (characterData.exampleDialogs !== undefined) {
      existingCharacter.exampleDialogs = characterData.exampleDialogs;
    }
    
    return this.characterRepository.save(existingCharacter);
  }
  
  /**
   * 删除角色
   */
  async deleteCharacter(id: string): Promise<boolean> {
    return this.characterRepository.delete(id);
  }
} 