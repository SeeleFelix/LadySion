import { ChatRepository } from "../../domain/repositories/ChatRepository.ts";
import { CharacterRepository } from "../../domain/repositories/CharacterRepository.ts";
import { ChatOrchestrationService } from "../../domain/services/ChatOrchestrationService.ts";
import { LLMAdapter } from "../../infrastructure/adapters/LLMAdapter.ts";
import {
  MessageDto,
  SendMessageCommand,
  SendMessageResult,
} from "../dto/ChatDto.ts";
import { Message } from "../../domain/entities/Message.ts";
import {
  NotFoundError,
  ValidationError,
} from "../../shared/errors/DomainErrors.ts";
import { Character } from "../../domain/entities/Character.ts";
import type { Result } from "@/shared/types/index.ts";

/**
 * 发送消息用例
 */
export class SendMessageUseCase {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly characterRepository: CharacterRepository,
    private readonly chatOrchestrationService: ChatOrchestrationService,
    private readonly llmAdapter: LLMAdapter,
  ) {}

  async execute(
    command: SendMessageCommand,
  ): Promise<Result<SendMessageResult>> {
    try {
      // 1. 验证输入
      if (!command.content.trim()) {
        throw new ValidationError("消息内容不能为空");
      }

      // 2. 获取对话
      const chat = await this.chatRepository.findById(command.chatId);
      if (!chat) {
        throw new NotFoundError(`对话不存在: ${command.chatId}`);
      }

      // 3. 获取角色信息（如果指定）
      let character: Character | null = null;
      if (command.characterId) {
        character = await this.characterRepository.findById(
          command.characterId,
        );
        if (!character) {
          throw new NotFoundError(`角色不存在: ${command.characterId}`);
        }
      }

      // 4. 创建用户消息
      const userMessage = Message.create(
        crypto.randomUUID(),
        "user",
        command.content.trim(),
      );

      // 5. 验证消息序列
      this.chatOrchestrationService.validateMessageSequence(chat, userMessage);

      // 6. 添加用户消息到对话
      chat.addMessage(userMessage);

      // 7. 构建对话上下文
      const context = this.chatOrchestrationService.buildConversationContext(
        chat,
        character,
      );

      // 8. 调用LLM生成回复
      const llmMessages = context.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const llmResponse = await this.llmAdapter.generateCompletion({
        messages: llmMessages,
        model: "default", // 可以根据需要选择模型
        maxTokens: 1000,
        temperature: 0.7,
      });

      // 9. 创建助手消息
      const assistantMessage = Message.create(
        crypto.randomUUID(),
        "assistant",
        llmResponse.content,
        {
          model: llmResponse.model,
          tokens: llmResponse.tokens,
          finishReason: llmResponse.finishReason,
        },
      );

      // 10. 添加助手消息到对话
      chat.addMessage(assistantMessage);

      // 11. 保存对话
      await this.chatRepository.save(chat);

      // 12. 返回结果
      const result: SendMessageResult = {
        userMessage: this.messageToDto(userMessage),
        assistantMessage: this.messageToDto(assistantMessage),
        chatId: chat.id,
      };

      return { success: true, data: result };
    } catch (error) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: "发送消息失败" };
    }
  }

  private messageToDto(message: Message): MessageDto {
    return {
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp,
      metadata: message.metadata,
    };
  }
}
