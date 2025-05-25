import { Request, Response } from 'express';
import { CharacterService } from '../../../domain/ports/input/CharacterService';

/**
 * 角色控制器 - 处理角色相关的HTTP请求
 */
export class CharacterController {
  constructor(private characterService: CharacterService) {}
  
  /**
   * 获取所有角色
   */
  getAllCharacters = async (req: Request, res: Response): Promise<void> => {
    try {
      const characters = await this.characterService.getAllCharacters();
      res.status(200).json(characters.map(character => character.toObject()));
    } catch (error) {
      console.error('获取所有角色失败:', error);
      res.status(500).json({ message: '获取角色失败', error: (error as Error).message });
    }
  };
  
  /**
   * 根据ID获取角色
   */
  getCharacterById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const character = await this.characterService.getCharacterById(id);
      
      if (!character) {
        res.status(404).json({ message: '未找到角色' });
        return;
      }
      
      res.status(200).json(character.toObject());
    } catch (error) {
      console.error('获取角色失败:', error);
      res.status(500).json({ message: '获取角色失败', error: (error as Error).message });
    }
  };
  
  /**
   * 创建角色
   */
  createCharacter = async (req: Request, res: Response): Promise<void> => {
    try {
      const characterData = req.body;
      const newCharacter = await this.characterService.createCharacter(characterData);
      
      res.status(201).json(newCharacter.toObject());
    } catch (error) {
      console.error('创建角色失败:', error);
      res.status(500).json({ message: '创建角色失败', error: (error as Error).message });
    }
  };
  
  /**
   * 更新角色
   */
  updateCharacter = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const characterData = req.body;
      
      const updatedCharacter = await this.characterService.updateCharacter(id, characterData);
      
      if (!updatedCharacter) {
        res.status(404).json({ message: '未找到角色' });
        return;
      }
      
      res.status(200).json(updatedCharacter.toObject());
    } catch (error) {
      console.error('更新角色失败:', error);
      res.status(500).json({ message: '更新角色失败', error: (error as Error).message });
    }
  };
  
  /**
   * 删除角色
   */
  deleteCharacter = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const success = await this.characterService.deleteCharacter(id);
      
      if (!success) {
        res.status(404).json({ message: '未找到角色' });
        return;
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('删除角色失败:', error);
      res.status(500).json({ message: '删除角色失败', error: (error as Error).message });
    }
  };
} 