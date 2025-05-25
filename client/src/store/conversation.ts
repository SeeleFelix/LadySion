import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Conversation, Message } from '@/types/api';
import { conversationApi } from '@/api';

export const useConversationStore = defineStore('conversation', () => {
  // 状态
  const conversations = ref<Conversation[]>([]);
  const currentConversation = ref<Conversation | null>(null);
  const loading = ref(false);
  const sendingMessage = ref(false);
  const error = ref<string | null>(null);
  
  // 计算属性
  const sortedConversations = computed(() => {
    return [...conversations.value].sort((a, b) => b.updatedAt - a.updatedAt);
  });
  
  // 获取所有会话
  async function fetchConversations() {
    loading.value = true;
    error.value = null;
    
    try {
      conversations.value = await conversationApi.getAllConversations();
    } catch (err) {
      console.error('获取会话失败:', err);
      error.value = '获取会话失败';
    } finally {
      loading.value = false;
    }
  }
  
  // 根据ID获取会话
  async function fetchConversationById(id: string) {
    loading.value = true;
    error.value = null;
    
    try {
      currentConversation.value = await conversationApi.getConversationById(id);
      
      // 更新本地会话列表
      const index = conversations.value.findIndex(c => c.id === id);
      if (index !== -1) {
        conversations.value[index] = currentConversation.value;
      } else {
        conversations.value.push(currentConversation.value);
      }
    } catch (err) {
      console.error('获取会话失败:', err);
      error.value = '获取会话失败';
    } finally {
      loading.value = false;
    }
  }
  
  // 创建会话
  async function createConversation(characterId: string) {
    loading.value = true;
    error.value = null;
    
    try {
      const newConversation = await conversationApi.createConversation(characterId);
      conversations.value.push(newConversation);
      currentConversation.value = newConversation;
      return newConversation;
    } catch (err) {
      console.error('创建会话失败:', err);
      error.value = '创建会话失败';
      return null;
    } finally {
      loading.value = false;
    }
  }
  
  // 发送消息
  async function sendMessage(content: string) {
    if (!currentConversation.value) {
      error.value = '没有选择会话';
      return null;
    }
    
    sendingMessage.value = true;
    error.value = null;
    
    try {
      // 假设API会返回AI的回复
      const aiMessage = await conversationApi.sendMessage(currentConversation.value.id, content);
      
      // 刷新当前会话以获取最新消息
      await fetchConversationById(currentConversation.value.id);
      
      return aiMessage;
    } catch (err) {
      console.error('发送消息失败:', err);
      error.value = '发送消息失败';
      return null;
    } finally {
      sendingMessage.value = false;
    }
  }
  
  // 删除会话
  async function deleteConversation(id: string) {
    loading.value = true;
    error.value = null;
    
    try {
      await conversationApi.deleteConversation(id);
      
      // 从本地列表中删除
      conversations.value = conversations.value.filter(c => c.id !== id);
      
      // 如果当前选中的会话被删除，清除它
      if (currentConversation.value && currentConversation.value.id === id) {
        currentConversation.value = null;
      }
      
      return true;
    } catch (err) {
      console.error('删除会话失败:', err);
      error.value = '删除会话失败';
      return false;
    } finally {
      loading.value = false;
    }
  }
  
  // 选择会话
  function selectConversation(conversation: Conversation) {
    currentConversation.value = conversation;
  }
  
  // 清除当前会话
  function clearCurrentConversation() {
    currentConversation.value = null;
  }
  
  return {
    // 状态
    conversations,
    currentConversation,
    loading,
    sendingMessage,
    error,
    
    // 计算属性
    sortedConversations,
    
    // 动作
    fetchConversations,
    fetchConversationById,
    createConversation,
    sendMessage,
    deleteConversation,
    selectConversation,
    clearCurrentConversation
  };
}); 