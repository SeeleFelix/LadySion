import axios from 'axios';
import type { Character, Conversation, Message } from '@/types/api';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// 角色相关API
export const characterApi = {
  // 获取所有角色
  getAllCharacters: async (): Promise<Character[]> => {
    const response = await api.get('/characters');
    return response.data;
  },
  
  // 根据ID获取角色
  getCharacterById: async (id: string): Promise<Character> => {
    const response = await api.get(`/characters/${id}`);
    return response.data;
  },
  
  // 创建角色
  createCharacter: async (character: Omit<Character, 'id'>): Promise<Character> => {
    const response = await api.post('/characters', character);
    return response.data;
  },
  
  // 更新角色
  updateCharacter: async (id: string, character: Partial<Character>): Promise<Character> => {
    const response = await api.put(`/characters/${id}`, character);
    return response.data;
  },
  
  // 删除角色
  deleteCharacter: async (id: string): Promise<void> => {
    await api.delete(`/characters/${id}`);
  }
};

// 会话相关API
export const conversationApi = {
  // 获取所有会话
  getAllConversations: async (): Promise<Conversation[]> => {
    const response = await api.get('/conversations');
    return response.data;
  },
  
  // 根据ID获取会话
  getConversationById: async (id: string): Promise<Conversation> => {
    const response = await api.get(`/conversations/${id}`);
    return response.data;
  },
  
  // 创建会话
  createConversation: async (characterId: string): Promise<Conversation> => {
    const response = await api.post('/conversations', { characterId });
    return response.data;
  },
  
  // 发送消息
  sendMessage: async (conversationId: string, content: string): Promise<Message> => {
    const response = await api.post(`/conversations/${conversationId}/messages`, { content });
    return response.data;
  },
  
  // 删除会话
  deleteConversation: async (id: string): Promise<void> => {
    await api.delete(`/conversations/${id}`);
  }
};