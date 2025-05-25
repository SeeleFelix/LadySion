/**
 * 角色实体 - 定义角色的领域模型
 */
export class Character {
  private _id: string;
  private _name: string;
  private _description: string;
  private _personality: string;
  private _firstMessage?: string;
  private _avatar?: string;
  private _systemPrompt: string;
  private _exampleDialogs?: string;

  constructor(
    id: string,
    name: string,
    description: string,
    personality: string,
    systemPrompt: string,
    firstMessage?: string,
    avatar?: string,
    exampleDialogs?: string
  ) {
    this._id = id;
    this._name = name;
    this._description = description;
    this._personality = personality;
    this._systemPrompt = systemPrompt;
    this._firstMessage = firstMessage;
    this._avatar = avatar;
    this._exampleDialogs = exampleDialogs;
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

  get description(): string {
    return this._description;
  }

  set description(value: string) {
    this._description = value;
  }

  get personality(): string {
    return this._personality;
  }

  set personality(value: string) {
    this._personality = value;
  }

  get firstMessage(): string | undefined {
    return this._firstMessage;
  }

  set firstMessage(value: string | undefined) {
    this._firstMessage = value;
  }

  get avatar(): string | undefined {
    return this._avatar;
  }

  set avatar(value: string | undefined) {
    this._avatar = value;
  }

  get systemPrompt(): string {
    return this._systemPrompt;
  }

  set systemPrompt(value: string) {
    this._systemPrompt = value;
  }

  get exampleDialogs(): string | undefined {
    return this._exampleDialogs;
  }

  set exampleDialogs(value: string | undefined) {
    this._exampleDialogs = value;
  }

  // 转换为简单对象
  toObject() {
    return {
      id: this._id,
      name: this._name,
      description: this._description,
      personality: this._personality,
      firstMessage: this._firstMessage,
      avatar: this._avatar,
      systemPrompt: this._systemPrompt,
      exampleDialogs: this._exampleDialogs
    };
  }

  // 从对象创建实体
  static fromObject(obj: any): Character {
    return new Character(
      obj.id,
      obj.name,
      obj.description,
      obj.personality,
      obj.systemPrompt,
      obj.firstMessage,
      obj.avatar,
      obj.exampleDialogs
    );
  }
} 