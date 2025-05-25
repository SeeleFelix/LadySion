/**
 * 消息实体 - 定义消息的领域模型
 */
export class Message {
  private _id: string;
  private _role: 'user' | 'assistant' | 'system';
  private _content: string;
  private _timestamp: number;

  constructor(
    id: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    timestamp: number
  ) {
    this._id = id;
    this._role = role;
    this._content = content;
    this._timestamp = timestamp;
  }

  // 属性访问器
  get id(): string {
    return this._id;
  }

  get role(): 'user' | 'assistant' | 'system' {
    return this._role;
  }

  get content(): string {
    return this._content;
  }

  set content(value: string) {
    this._content = value;
  }

  get timestamp(): number {
    return this._timestamp;
  }

  // 转换为简单对象
  toObject() {
    return {
      id: this._id,
      role: this._role,
      content: this._content,
      timestamp: this._timestamp
    };
  }

  // 从对象创建实体
  static fromObject(obj: any): Message {
    return new Message(
      obj.id,
      obj.role,
      obj.content,
      obj.timestamp
    );
  }
} 