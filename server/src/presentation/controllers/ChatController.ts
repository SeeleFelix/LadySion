import { Request, Response } from 'express'
import { ChatApplicationService } from '../../application/services/ChatApplicationService'
import { SendMessageCommand, CreateChatCommand, GetChatHistoryQuery } from '../../application/dto/ChatDto'
import { BaseController } from './BaseController'

/**
 * 聊天控制器
 */
export class ChatController extends BaseController {
  constructor(
    private readonly chatApplicationService: ChatApplicationService
  ) {
    super()
  }

  /**
   * 创建对话
   */
  async createChat(req: Request, res: Response): Promise<void> {
    await this.handleRequest(async () => {
      const command: CreateChatCommand = {
        title: req.body.title,
        characterId: req.body.characterId
      }

      const result = await this.chatApplicationService.createChat(command)
      
      if (result.success) {
        res.status(201).json({
          success: true,
          data: result.data
        })
      } else {
        res.status(400).json({
          success: false,
          error: {
            code: 'CREATE_CHAT_FAILED',
            message: result.error || '创建对话失败'
          }
        })
      }
    }, res)
  }

  /**
   * 发送消息
   */
  async sendMessage(req: Request, res: Response): Promise<void> {
    await this.handleRequest(async () => {
      const chatId = req.params.id
      
      const command: SendMessageCommand = {
        chatId,
        content: req.body.content,
        characterId: req.body.characterId,
        systemPrompt: req.body.systemPrompt
      }

      const result = await this.chatApplicationService.sendMessage(command)
      
      if (result.success) {
        res.json({
          success: true,
          data: result.data
        })
      } else {
        res.status(400).json({
          success: false,
          error: {
            code: 'SEND_MESSAGE_FAILED',
            message: result.error || '发送消息失败'
          }
        })
      }
    }, res)
  }

  /**
   * 获取对话历史
   */
  async getChatHistory(req: Request, res: Response): Promise<void> {
    await this.handleRequest(async () => {
      const chatId = req.params.id
      
      const query: GetChatHistoryQuery = {
        chatId,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      }

      const result = await this.chatApplicationService.getChatHistory(query)
      
      if (result.success) {
        res.json({
          success: true,
          data: result.data
        })
      } else {
        res.status(404).json({
          success: false,
          error: {
            code: 'GET_HISTORY_FAILED',
            message: result.error || '获取历史失败'
          }
        })
      }
    }, res)
  }

  /**
   * 获取对话列表
   */
  async getChats(req: Request, res: Response): Promise<void> {
    await this.handleRequest(async () => {
      const result = await this.chatApplicationService.getChats()
      
      if (result.success) {
        res.json({
          success: true,
          data: result.data
        })
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'GET_CHATS_FAILED',
            message: result.error || '获取对话列表失败'
          }
        })
      }
    }, res)
  }

  /**
   * 删除对话
   */
  async deleteChat(req: Request, res: Response): Promise<void> {
    await this.handleRequest(async () => {
      const chatId = req.params.id
      
      const result = await this.chatApplicationService.deleteChat(chatId)
      
      if (result.success) {
        res.json({
          success: true,
          data: { deleted: result.data }
        })
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'DELETE_CHAT_FAILED',
            message: result.error || '删除对话失败'
          }
        })
      }
    }, res)
  }
} 