import { ICharacter } from './ICharacter';
import { IMessage } from './IMessage';

/**
 * 会话接口 - 定义聊天会话的基本属性
 */
export interface IConversation {
  id: string;
  name: string;
  character: ICharacter;
  messages: IMessage[];
  createdAt: number;
  updatedAt: number;
} 