import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface Character {
  id: string;
  name: string;
  description: string;
  personality: string;
  firstMessage?: string;
  avatar?: string;
  systemPrompt: string;
  exampleDialogs?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  name: string;
  characterId: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

class DataService {
  private dataDir: string;
  private charactersFile: string;
  private conversationsFile: string;

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
    this.charactersFile = path.join(this.dataDir, 'characters.json');
    this.conversationsFile = path.join(this.dataDir, 'conversations.json');
  }

  async initialize(): Promise<void> {
    // 确保数据目录存在
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
    }

    // 初始化角色文件
    try {
      await fs.access(this.charactersFile);
    } catch {
      const defaultCharacters: Character[] = [
        {
          id: '1',
          name: '小红',
          description: '活泼开朗的女孩，喜欢帮助他人。',
          personality: '热情、乐观、善良',
          firstMessage: '你好！我是小红，很高兴见到你！',
          avatar: 'https://placekitten.com/100/100',
          systemPrompt: '你是小红，一个活泼开朗的女孩，总是充满正能量，喜欢帮助他人。',
          exampleDialogs: '用户：你好\n小红：你好！很高兴见到你！',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2', 
          name: '小明',
          description: '聪明好学的男孩，对科学充满好奇心。',
          personality: '聪明、好奇、理性',
          firstMessage: '嗨！我是小明，有什么有趣的事情可以聊聊吗？',
          avatar: 'https://placekitten.com/101/101',
          systemPrompt: '你是小明，一个聪明好学的男孩，对科学和知识充满好奇心。',
          exampleDialogs: '用户：你好\n小明：嗨！有什么有趣的问题想要探讨吗？',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '3',
          name: '阿狸',
          description: '九尾狐，古灵精怪，喜欢恶作剧。',
          personality: '顽皮、机智、神秘',
          firstMessage: '呀~又有新朋友了呢！',
          avatar: 'https://placekitten.com/102/102',
          systemPrompt: '你是阿狸，一只九尾狐，古灵精怪，喜欢恶作剧，但内心善良。',
          exampleDialogs: '用户：你好\n阿狸：呀~新朋友！想不想看我变个戏法？',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      await fs.writeFile(this.charactersFile, JSON.stringify(defaultCharacters, null, 2));
    }

    // 初始化会话文件
    try {
      await fs.access(this.conversationsFile);
    } catch {
      await fs.writeFile(this.conversationsFile, JSON.stringify([], null, 2));
    }
  }

  // 角色相关方法
  async getAllCharacters(): Promise<Character[]> {
    const data = await fs.readFile(this.charactersFile, 'utf-8');
    return JSON.parse(data);
  }

  async getCharacterById(id: string): Promise<Character | null> {
    const characters = await this.getAllCharacters();
    return characters.find(c => c.id === id) || null;
  }

  async createCharacter(characterData: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>): Promise<Character> {
    const characters = await this.getAllCharacters();
    const newCharacter: Character = {
      ...characterData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    characters.push(newCharacter);
    await fs.writeFile(this.charactersFile, JSON.stringify(characters, null, 2));
    return newCharacter;
  }

  async updateCharacter(id: string, characterData: Partial<Character>): Promise<Character | null> {
    const characters = await this.getAllCharacters();
    const index = characters.findIndex(c => c.id === id);
    if (index === -1) return null;

    characters[index] = {
      ...characters[index],
      ...characterData,
      id, // 确保ID不被修改
      updatedAt: new Date().toISOString()
    };
    await fs.writeFile(this.charactersFile, JSON.stringify(characters, null, 2));
    return characters[index];
  }

  async deleteCharacter(id: string): Promise<boolean> {
    const characters = await this.getAllCharacters();
    const index = characters.findIndex(c => c.id === id);
    if (index === -1) return false;

    characters.splice(index, 1);
    await fs.writeFile(this.charactersFile, JSON.stringify(characters, null, 2));
    return true;
  }

  // 会话相关方法
  async getAllConversations(): Promise<Conversation[]> {
    const data = await fs.readFile(this.conversationsFile, 'utf-8');
    return JSON.parse(data);
  }

  async getConversationById(id: string): Promise<Conversation | null> {
    const conversations = await this.getAllConversations();
    return conversations.find(c => c.id === id) || null;
  }

  async createConversation(characterId: string): Promise<Conversation> {
    const character = await this.getCharacterById(characterId);
    if (!character) throw new Error('角色不存在');

    const conversations = await this.getAllConversations();
    const newConversation: Conversation = {
      id: uuidv4(),
      name: `与${character.name}的对话`,
      characterId,
      messages: character.firstMessage ? [{
        id: uuidv4(),
        role: 'assistant',
        content: character.firstMessage,
        timestamp: Date.now()
      }] : [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    conversations.push(newConversation);
    await fs.writeFile(this.conversationsFile, JSON.stringify(conversations, null, 2));
    return newConversation;
  }

  async addMessageToConversation(conversationId: string, message: Omit<Message, 'id'>): Promise<Message> {
    const conversations = await this.getAllConversations();
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) throw new Error('会话不存在');

    const newMessage: Message = {
      ...message,
      id: uuidv4()
    };

    conversation.messages.push(newMessage);
    conversation.updatedAt = Date.now();
    
    await fs.writeFile(this.conversationsFile, JSON.stringify(conversations, null, 2));
    return newMessage;
  }

  async deleteConversation(id: string): Promise<boolean> {
    const conversations = await this.getAllConversations();
    const index = conversations.findIndex(c => c.id === id);
    if (index === -1) return false;

    conversations.splice(index, 1);
    await fs.writeFile(this.conversationsFile, JSON.stringify(conversations, null, 2));
    return true;
  }
}

export const dataService = new DataService(); 