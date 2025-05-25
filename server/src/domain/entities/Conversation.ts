import { Character } from './Character';
import { Message } from './Message';

/**
 * 会话实体 - 定义会话的领域模型
 */
export class Conversation {
  private _id: string;
  private _name: string;
  private _character: Character;
  private _messages: Message[];
  private _createdAt: number;
  private _updatedAt: number;

  constructor(
    id: string,
    name: string,
    character: Character,
    messages: Message[] = [],
    createdAt: number = Date.now(),
    updatedAt: number = Date.now()
  ) {
    this._id = id;
    this._name = name;
    this._character = character;
    this._messages = messages;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  // 属性访问器
  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
  }

  get character(): Character {
    return this._character;
  }

  get messages(): Message[] {
    return [...this._messages]; // 返回副本以防止直接修改
  }

  get createdAt(): number {
    return this._createdAt;
  }

  get updatedAt(): number {
    return this._updatedAt;
  }

  // 添加消息
  addMessage(message: Message): void {
    this._messages.push(message);
    this._updatedAt = Date.now();
  }

  // 转换为简单对象
  toObject() {
    return {
      id: this._id,
      name: this._name,
      character: this._character.toObject(),
      messages: this._messages.map(msg => msg.toObject()),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }

  // 从对象创建实体
  static fromObject(obj: any): Conversation {
    const character = Character.fromObject(obj.character);
    const messages = obj.messages.map((msgObj: any) => Message.fromObject(msgObj));
    
    return new Conversation(
      obj.id,
      obj.name,
      character,
      messages,
      obj.createdAt,
      obj.updatedAt
    );
  }
} 