<template>
  <div class="chat-container">
    <div v-if="!messages.length && !streaming" class="empty-state">
      <div class="empty-icon">💬</div>
      <h3>开始新的对话</h3>
      <p>在下方输入框中发送消息来开始聊天</p>
    </div>
    
    <message-list 
      v-else
      :messages="messages" 
      :streaming="streaming" 
      :stream-content="streamContent" 
    />
    
    <chat-input 
      :disabled="loading"
      @send="onSendMessage"
    />
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import MessageList from './MessageList.vue';
import ChatInput from './ChatInput.vue';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

const props = defineProps<{
  messages: Message[];
  loading: boolean;
  streaming: boolean;
  streamContent: string;
}>();

const emit = defineEmits<{
  (e: 'send', message: string): void;
}>();

const onSendMessage = (message: string) => {
  emit('send', message);
};
</script>

<style scoped>
.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  color: #888;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin-bottom: 0.5rem;
  color: #555;
}

.empty-state p {
  color: #999;
}
</style> 