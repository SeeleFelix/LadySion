<template>
  <div class="chat-panel">
    <div v-if="!conversation" class="empty-state">
      <h2>欢迎使用LadySion</h2>
      <p>选择一个角色或会话开始聊天</p>
    </div>
    
    <template v-else>
      <div class="chat-header">
        <div class="character-info">
          <div class="avatar" v-if="conversation.character && conversation.character.avatar">
            <img :src="conversation.character.avatar" :alt="conversation.character.name">
          </div>
          <div class="avatar placeholder" v-else-if="conversation.character">
            {{ conversation.character.name.charAt(0) }}
          </div>
          <div class="avatar placeholder" v-else>
            ?
          </div>
          <h2 class="name">{{ conversation.character ? conversation.character.name : '未知角色' }}</h2>
        </div>
      </div>
      
      <div class="chat-messages" ref="messagesContainer">
        <div 
          v-for="message in conversation.messages || []" 
          :key="message.id"
          class="message"
          :class="message.role"
        >
          <div class="content">{{ message.content }}</div>
          <div class="timestamp">{{ formatTime(message.timestamp) }}</div>
        </div>
      </div>
      
      <div class="chat-input">
        <textarea 
          v-model="messageInput" 
          placeholder="输入消息..." 
          @keypress.enter.exact.prevent="sendMessage"
          :disabled="sendingMessage"
        ></textarea>
        <button 
          @click="sendMessage" 
          :disabled="!messageInput.trim() || sendingMessage"
        >
          {{ sendingMessage ? '发送中...' : '发送' }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue';
import { useConversationStore } from '@/store';
import type { Conversation } from '@/types/api';

const conversationStore = useConversationStore();
const { currentConversation, sendingMessage, sendMessage: storeSendMessage } = conversationStore;

const messageInput = ref('');
const messagesContainer = ref<HTMLElement | null>(null);

const conversation = computed(() => currentConversation.value);

// 格式化时间戳为时间
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

// 发送消息
const sendMessage = async () => {
  const content = messageInput.value.trim();
  if (!content || sendingMessage.value || !conversation.value) return;
  
  messageInput.value = '';
  await storeSendMessage(content);
  
  // 滚动到底部
  await nextTick();
  scrollToBottom();
};

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

// 监听会话变化，滚动到底部
watch(conversation, (newVal) => {
  if (newVal) { // 只有当conversation存在时才滚动
    nextTick(() => scrollToBottom());
  }
}, { deep: true });

// 组件挂载后滚动到底部
watch(messagesContainer, (newValue) => {
  if (newValue && conversation.value) { // 只有当会话存在时才滚动
    scrollToBottom();
  }
});
</script>

<style scoped>
.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #888;
  text-align: center;
}

.chat-header {
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.character-info {
  display: flex;
  align-items: center;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
  overflow: hidden;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1890ff;
  color: white;
  font-size: 1.2rem;
  font-weight: bold;
}

.name {
  margin: 0;
  font-size: 1.2rem;
}

.chat-messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.message {
  max-width: 70%;
  margin-bottom: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  position: relative;
}

.message .content {
  white-space: pre-wrap;
  word-break: break-word;
}

.message .timestamp {
  font-size: 0.75rem;
  color: #999;
  margin-top: 4px;
  text-align: right;
}

.message.user {
  align-self: flex-end;
  background-color: #1890ff;
  color: white;
}

.message.assistant {
  align-self: flex-start;
  background-color: #f5f5f5;
  color: #333;
}

.message.system {
  align-self: center;
  background-color: #f0f0f0;
  color: #666;
  max-width: 90%;
  font-style: italic;
}

.chat-input {
  padding: 16px;
  border-top: 1px solid #e8e8e8;
  display: flex;
  align-items: flex-end;
}

.chat-input textarea {
  flex: 1;
  min-height: 60px;
  max-height: 120px;
  padding: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  resize: none;
  outline: none;
  font-family: inherit;
  font-size: inherit;
}

.chat-input textarea:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.chat-input button {
  margin-left: 8px;
  padding: 8px 16px;
  height: 40px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
}

.chat-input button:hover:not(:disabled) {
  background-color: #40a9ff;
}

.chat-input button:disabled {
  background-color: #d9d9d9;
  cursor: not-allowed;
}
</style> 