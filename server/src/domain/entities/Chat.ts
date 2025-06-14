import type { CharacterId, ChatId, MessageId } from "@/shared/types";
import { Message } from "@/domain/entities/Message.ts";
import { ValidationError } from "@/shared/errors/DomainErrors.ts";

/**
 * Chat聚合根 - 管理对话的完整生命周期
 */
export class Chat {
  private constructor(
    private readonly _id: ChatId,
    private _title: string,
    private readonly _characterId: CharacterId | null,
    private readonly _messages: Message[] = [],
    private readonly _createdAt: Date = new Date(),
    private _updatedAt: Date = new Date(),
  ) {
    this.validate();
  }

  // 工厂方法 - 创建新对话
  static create(
    id: ChatId,
    title: string,
    characterId?: CharacterId,
  ): Chat {
    return new Chat(id, title, characterId || null);
  }

  // 工厂方法 - 从数据重构
  static fromData(data: {
    id: ChatId;
    title: string;
    characterId?: CharacterId;
    messages?: Message[];
    createdAt?: Date;
    updatedAt?: Date;
  }): Chat {
    return new Chat(
      data.id,
      data.title,
      data.characterId || null,
      data.messages || [],
      data.createdAt,
      data.updatedAt,
    );
  }

  // 属性访问器
  get id(): ChatId {
    return this._id;
  }

  get title(): string {
    return this._title;
  }

  get characterId(): CharacterId | null {
    return this._characterId;
  }

  get messages(): readonly Message[] {
    return [...this._messages];
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get messageCount(): number {
    return this._messages.length;
  }

  get lastMessage(): Message | null {
    return this._messages.length > 0 ? this._messages[this._messages.length - 1] : null;
  }

  // 业务方法
  updateTitle(newTitle: string): void {
    if (!newTitle || newTitle.trim().length === 0) {
      throw new ValidationError("对话标题不能为空");
    }
    this._title = newTitle.trim();
    this._updatedAt = new Date();
  }

  addMessage(message: Message): void {
    // 验证消息时间顺序
    if (this._messages.length > 0) {
      const lastMessage = this._messages[this._messages.length - 1];
      if (message.timestamp <= lastMessage.timestamp) {
        throw new ValidationError("消息时间顺序不正确");
      }
    }

    this._messages.push(message);
    this._updatedAt = new Date();
  }

  removeMessage(messageId: MessageId): boolean {
    const index = this._messages.findIndex((msg) => msg.id === messageId);
    if (index !== -1) {
      this._messages.splice(index, 1);
      this._updatedAt = new Date();
      return true;
    }
    return false;
  }

  getMessageById(messageId: MessageId): Message | null {
    return this._messages.find((msg) => msg.id === messageId) || null;
  }

  getMessagesAfter(timestamp: Date): Message[] {
    return this._messages.filter((msg) => msg.timestamp > timestamp);
  }

  private validate(): void {
    if (!this._id || this._id.trim().length === 0) {
      throw new ValidationError("对话ID不能为空");
    }
    if (!this._title || this._title.trim().length === 0) {
      throw new ValidationError("对话标题不能为空");
    }
  }

  // 转换为数据对象
  toData() {
    return {
      id: this._id,
      title: this._title,
      characterId: this._characterId,
      messages: this._messages.map((msg) => msg.toData()),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
