import { Request, Response } from 'express';
import { CharacterService } from '../../../domain/ports/input/CharacterService';
import { ConversationService } from '../../../domain/ports/input/ConversationService';

/**
 * 会话控制器 - 处理会话相关的HTTP请求
 */
export class ConversationController {
  constructor(
    private conversationService: ConversationService,
    private characterService: CharacterService
  ) {}
  
  /**
   * 获取所有会话
   */
  getAllConversations = async (req: Request, res: Response): Promise<void> => {
    try {
      const conversations = await this.conversationService.getAllConversations();
      res.status(200).json(conversations.map(conversation => conversation.toObject()));
    } catch (error) {
      console.error('获取所有会话失败:', error);
      res.status(500).json({ message: '获取会话失败', error: (error as Error).message });
    }
  };
  
  /**
   * 根据ID获取会话
   */
  getConversationById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const conversation = await this.conversationService.getConversationById(id);
      
      if (!conversation) {
        res.status(404).json({ message: '未找到会话' });
        return;
      }
      
      res.status(200).json(conversation.toObject());
    } catch (error) {
      console.error('获取会话失败:', error);
      res.status(500).json({ message: '获取会话失败', error: (error as Error).message });
    }
  };
  
  /**
   * 创建会话
   */
  createConversation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { characterId } = req.body;
      
      if (!characterId) {
        res.status(400).json({ message: '缺少角色ID' });
        return;
      }
      
      const character = await this.characterService.getCharacterById(characterId);
      
      if (!character) {
        res.status(404).json({ message: '未找到角色' });
        return;
      }
      
      const newConversation = await this.conversationService.createConversation(character);
      res.status(201).json(newConversation.toObject());
    } catch (error) {
      console.error('创建会话失败:', error);
      res.status(500).json({ message: '创建会话失败', error: (error as Error).message });
    }
  };
  
  /**
   * 向会话添加消息并获取AI回复
   */
  sendMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { content } = req.body;
      
      if (!content) {
        res.status(400).json({ message: '消息内容不能为空' });
        return;
      }
      
      // 添加用户消息
      await this.conversationService.addMessage(id, {
        role: 'user',
        content
      });
      
      // 获取AI回复
      const aiResponse = await this.conversationService.getAIResponse(id);
      
      res.status(200).json(aiResponse.toObject());
    } catch (error) {
      console.error('发送消息失败:', error);
      res.status(500).json({ message: '发送消息失败', error: (error as Error).message });
    }
  };
  
  /**
   * 删除会话
   */
  deleteConversation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const success = await this.conversationService.deleteConversation(id);
      
      if (!success) {
        res.status(404).json({ message: '未找到会话' });
        return;
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('删除会话失败:', error);
      res.status(500).json({ message: '删除会话失败', error: (error as Error).message });
    }
  };
} 