import { computed } from 'vue'
import { useConversationStore } from '@/stores/modules/conversation'
import type { CreateConversationData, SendMessageData } from '@/types'

/**
 * 聊天相关的组合式API
 */
export function useChat() {
  const store = useConversationStore()

  // 响应式状态
  const conversations = computed(() => store.conversations)
  const currentConversation = computed(() => store.currentConversation)
  const messages = computed(() => store.messages)
  const loading = computed(() => store.loading)
  const error = computed(() => store.error)
  const isStreaming = computed(() => store.isStreaming)

  // 操作方法
  const loadConversations = async () => {
    await store.loadConversations()
  }

  const loadConversationById = async (id: string) => {
    return await store.loadConversationById(id)
  }

  const createConversation = async (data: CreateConversationData) => {
    return await store.createConversation(data)
  }

  const deleteConversation = async (id: string) => {
    await store.deleteConversation(id)
  }

  const sendMessage = async (data: SendMessageData) => {
    return await store.sendMessage(data)
  }

  const sendStreamingMessage = async (data: SendMessageData, onChunk?: (chunk: string) => void) => {
    return await store.sendStreamingMessage(data, onChunk)
  }

  const setCurrentConversation = (conversation: any) => {
    store.setCurrentConversation(conversation)
  }

  const clearMessages = () => {
    store.clearMessages()
  }

  const clearError = () => {
    store.clearError()
  }

  // 工具方法
  const findConversationById = (id: string) => {
    return conversations.value.find(c => c.id === id)
  }

  const getConversationsByCharacter = (characterId: string) => {
    return conversations.value.filter(c => c.characterId === characterId)
  }

  const getMessageCount = () => {
    return messages.value.length
  }

  const getLastMessage = () => {
    return messages.value[messages.value.length - 1]
  }

  const hasMessages = computed(() => messages.value.length > 0)

  return {
    // 状态
    conversations,
    currentConversation,
    messages,
    loading,
    error,
    isStreaming,
    hasMessages,
    
    // 方法
    loadConversations,
    loadConversationById,
    createConversation,
    deleteConversation,
    sendMessage,
    sendStreamingMessage,
    setCurrentConversation,
    clearMessages,
    clearError,
    
    // 工具方法
    findConversationById,
    getConversationsByCharacter,
    getMessageCount,
    getLastMessage
  }
} 