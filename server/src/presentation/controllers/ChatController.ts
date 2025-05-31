import { Context, RouterContext } from "oak/mod.ts";
import { ChatApplicationService } from "@/application/services/ChatApplicationService.ts";
import {
  CreateChatCommand,
  GetChatHistoryQuery,
  SendMessageCommand,
} from "@/application/dto/ChatDto.ts";
import { BaseController } from "@/presentation/controllers/BaseController.ts";

/**
 * 聊天控制器
 */
export class ChatController extends BaseController {
  constructor(
    private readonly chatApplicationService: ChatApplicationService,
  ) {
    super();
  }

  /**
   * 创建对话
   */
  async createChat(ctx: any): Promise<void> {
    await this.handleRequest(async () => {
      const requestBody = await ctx.request.body.json();
      const command: CreateChatCommand = {
        title: requestBody.title,
        characterId: requestBody.characterId,
      };

      const result = await this.chatApplicationService.createChat(command);

      if (result.success) {
        ctx.response.status = 201;
        ctx.response.body = JSON.stringify({
          success: true,
          data: result.data,
        });
      } else {
        ctx.response.status = 400;
        ctx.response.body = JSON.stringify({
          success: false,
          error: {
            code: "CREATE_CHAT_FAILED",
            message: result.error || "创建对话失败",
          },
        });
      }
    }, ctx);
  }

  /**
   * 发送消息
   */
  async sendMessage(ctx: any): Promise<void> {
    await this.handleRequest(async () => {
      const chatId = ctx.params.id!;
      const requestBody = await ctx.request.body.json();
      const command: SendMessageCommand = {
        chatId,
        content: requestBody.content,
        characterId: requestBody.characterId,
        systemPrompt: requestBody.systemPrompt,
      };

      const result = await this.chatApplicationService.sendMessage(command);

      if (result.success) {
        ctx.response.body = JSON.stringify({
          success: true,
          data: result.data,
        });
      } else {
        ctx.response.status = 400;
        ctx.response.body = JSON.stringify({
          success: false,
          error: {
            code: "SEND_MESSAGE_FAILED",
            message: result.error || "发送消息失败",
          },
        });
      }
    }, ctx);
  }

  /**
   * 获取对话历史
   */
  async getChatHistory(ctx: any): Promise<void> {
    await this.handleRequest(async () => {
      const chatId = ctx.params.id!;
      const url = ctx.request.url;
      const limitParam = url.searchParams.get("limit");
      const offsetParam = url.searchParams.get("offset");
      const query: GetChatHistoryQuery = {
        chatId,
        limit: limitParam ? parseInt(limitParam) : undefined,
        offset: offsetParam ? parseInt(offsetParam) : undefined,
      };

      const result = await this.chatApplicationService.getChatHistory(query);

      if (result.success) {
        ctx.response.body = JSON.stringify({
          success: true,
          data: result.data,
        });
      } else {
        ctx.response.status = 404;
        ctx.response.body = JSON.stringify({
          success: false,
          error: {
            code: "GET_HISTORY_FAILED",
            message: result.error || "获取历史失败",
          },
        });
      }
    }, ctx);
  }

  /**
   * 获取对话列表
   */
  async getChats(ctx: any): Promise<void> {
    await this.handleRequest(async () => {
      const result = await this.chatApplicationService.getChats();

      if (result.success) {
        ctx.response.body = JSON.stringify({
          success: true,
          data: result.data,
        });
      } else {
        ctx.response.status = 500;
        ctx.response.body = JSON.stringify({
          success: false,
          error: {
            code: "GET_CHATS_FAILED",
            message: result.error || "获取对话列表失败",
          },
        });
      }
    }, ctx);
  }

  /**
   * 删除对话
   */
  async deleteChat(ctx: any): Promise<void> {
    await this.handleRequest(async () => {
      const chatId = ctx.params.id!;

      const result = await this.chatApplicationService.deleteChat(chatId);

      if (result.success) {
        ctx.response.body = JSON.stringify({
          success: true,
          data: { deleted: result.data },
        });
      } else {
        ctx.response.status = 500;
        ctx.response.body = JSON.stringify({
          success: false,
          error: {
            code: "DELETE_CHAT_FAILED",
            message: result.error || "删除对话失败",
          },
        });
      }
    }, ctx);
  }
}
