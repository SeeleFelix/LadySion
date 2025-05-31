import { MessageId, MessageRole } from "@/shared/types";
import { ValidationError } from "@/shared/errors/DomainErrors.ts";

/**
 * Message实体 - 表示对话中的一条消息
 */
export class Message {
  private constructor(
    private readonly _id: MessageId,
    private readonly _role: MessageRole,
    private _content: string,
    private readonly _timestamp: Date = new Date(),
    private readonly _metadata?: Record<string, any>,
  ) {
    this.validate();
  }

  // 工厂方法 - 创建新消息
  static create(
    id: MessageId,
    role: MessageRole,
    content: string,
    metadata?: Record<string, any>,
  ): Message {
    return new Message(id, role, content, new Date(), metadata);
  }

  // 工厂方法 - 从数据重构
  static fromData(data: {
    id: MessageId;
    role: MessageRole;
    content: string;
    timestamp?: Date;
    metadata?: Record<string, any>;
  }): Message {
    return new Message(
      data.id,
      data.role,
      data.content,
      data.timestamp || new Date(),
      data.metadata,
    );
  }

  // 属性访问器
  get id(): MessageId {
    return this._id;
  }

  get role(): MessageRole {
    return this._role;
  }

  get content(): string {
    return this._content;
  }

  get timestamp(): Date {
    return this._timestamp;
  }

  get metadata(): Record<string, any> | undefined {
    return this._metadata ? { ...this._metadata } : undefined;
  }

  // 业务方法
  updateContent(newContent: string): void {
    if (!newContent || newContent.trim().length === 0) {
      throw new ValidationError("消息内容不能为空");
    }
    this._content = newContent.trim();
  }

  isFromUser(): boolean {
    return this._role === "user";
  }

  isFromAssistant(): boolean {
    return this._role === "assistant";
  }

  isSystemMessage(): boolean {
    return this._role === "system";
  }

  getMetadataValue<T>(key: string): T | undefined {
    return this._metadata?.[key] as T;
  }

  private validate(): void {
    if (!this._id || this._id.trim().length === 0) {
      throw new ValidationError("消息ID不能为空");
    }
    if (!this._content || this._content.trim().length === 0) {
      throw new ValidationError("消息内容不能为空");
    }
    if (!["user", "assistant", "system"].includes(this._role)) {
      throw new ValidationError("无效的消息角色");
    }
  }

  // 转换为数据对象
  toData() {
    return {
      id: this._id,
      role: this._role,
      content: this._content,
      timestamp: this._timestamp,
      metadata: this._metadata,
    };
  }
}
