import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { ElMessage } from "element-plus";
import { conversationApi } from "@/services";
import type {
  Conversation,
  CreateConversationData,
  Message,
  SendMessageData,
} from "@/types";

export const useConversationStore = defineStore("conversation", () => {
  // 状态
  const conversations = ref<Conversation[]>([]);
  const currentConversation = ref<Conversation | null>(null);
  const messages = ref<Message[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const isStreaming = ref(false);

  // 计算属性
  const conversationCount = computed(() => conversations.value.length);
  const hasConversations = computed(() => conversations.value.length > 0);
  const currentMessages = computed(() =>
    currentConversation.value
      ? messages.value.filter((m) =>
        m.conversationId === currentConversation.value!.id
      )
      : []
  );

  // 操作方法
  /**
   * 加载所有对话
   */
  const loadConversations = async () => {
    loading.value = true;
    error.value = null;
    try {
      conversations.value = await conversationApi.getAll();
    } catch (err: any) {
      error.value = err.message || "加载对话失败";
      ElMessage.error(error.value!);
    } finally {
      loading.value = false;
    }
  };

  /**
   * 根据ID获取对话
   */
  const loadConversationById = async (id: string) => {
    loading.value = true;
    error.value = null;
    try {
      const conversation = await conversationApi.getById(id);
      currentConversation.value = conversation;
      return conversation;
    } catch (err: any) {
      error.value = err.message || "加载对话失败";
      ElMessage.error(error.value!);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 创建新对话
   */
  const createConversation = async (data: CreateConversationData) => {
    loading.value = true;
    error.value = null;
    try {
      const newConversation = await conversationApi.create(data);
      conversations.value.push(newConversation);
      ElMessage.success("对话创建成功");
      return newConversation;
    } catch (err: any) {
      error.value = err.message || "创建对话失败";
      ElMessage.error(error.value!);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 删除对话
   */
  const deleteConversation = async (id: string) => {
    loading.value = true;
    error.value = null;
    try {
      await conversationApi.remove(id);
      conversations.value = conversations.value.filter((c) => c.id !== id);
      if (currentConversation.value?.id === id) {
        currentConversation.value = null;
        messages.value = messages.value.filter((m) => m.conversationId !== id);
      }
      ElMessage.success("对话删除成功");
    } catch (err: any) {
      error.value = err.message || "删除对话失败";
      ElMessage.error(error.value!);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 加载对话的消息
   */
  const loadMessages = async (conversationId: string) => {
    loading.value = true;
    error.value = null;
    try {
      const conversationMessages = await conversationApi.getMessages(
        conversationId,
      );
      // 更新messages数组，替换该对话的消息
      messages.value = messages.value.filter((m) =>
        m.conversationId !== conversationId
      );
      messages.value.push(...conversationMessages);
    } catch (err: any) {
      error.value = err.message || "加载消息失败";
      ElMessage.error(error.value!);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 发送消息
   */
  const sendMessage = async (data: SendMessageData) => {
    loading.value = true;
    error.value = null;
    try {
      const newMessage = await conversationApi.sendMessage(data);
      messages.value.push(newMessage);
      return newMessage;
    } catch (err: any) {
      error.value = err.message || "发送消息失败";
      ElMessage.error(error.value!);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 流式发送消息
   */
  const sendStreamingMessage = async (
    data: SendMessageData,
    onChunk?: (chunk: string) => void,
  ) => {
    isStreaming.value = true;
    error.value = null;
    try {
      const message = await conversationApi.sendStreamingMessage(data, onChunk);
      messages.value.push(message);
      return message;
    } catch (err: any) {
      error.value = err.message || "发送消息失败";
      ElMessage.error(error.value!);
      throw err;
    } finally {
      isStreaming.value = false;
    }
  };

  /**
   * 设置当前对话
   */
  const setCurrentConversation = (conversation: Conversation | null) => {
    currentConversation.value = conversation;
  };

  /**
   * 添加消息到本地状态
   */
  const addMessage = (message: Message) => {
    messages.value.push(message);
  };

  /**
   * 清除消息
   */
  const clearMessages = () => {
    messages.value = [];
  };

  /**
   * 清除错误状态
   */
  const clearError = () => {
    error.value = null;
  };

  return {
    // 状态
    conversations,
    currentConversation,
    messages,
    loading,
    error,
    isStreaming,
    // 计算属性
    conversationCount,
    hasConversations,
    currentMessages,
    // 方法
    loadConversations,
    loadConversationById,
    createConversation,
    deleteConversation,
    loadMessages,
    sendMessage,
    sendStreamingMessage,
    setCurrentConversation,
    addMessage,
    clearMessages,
    clearError,
  };
});
