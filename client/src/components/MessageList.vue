<template>
  <div class="chat-messages" ref="messagesContainer">
    <message-item
      v-for="message in messages" 
      :key="message.id || message.timestamp"
      :role="message.role"
      :content="message.content"
      :timestamp="message.timestamp"
    />
    <message-item
      v-if="streaming"
      role="assistant"
      :content="streamContent"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, defineProps, onMounted } from 'vue';
import MessageItem from './MessageItem.vue';

interface Message {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

const props = defineProps<{
  messages: Message[];
  streaming?: boolean;
  streamContent?: string;
}>();

const messagesContainer = ref<HTMLElement | null>(null);

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

// 监听消息变化，滚动到底部
watch(() => props.messages.length, () => {
  nextTick(() => scrollToBottom());
});

// 监听流式内容变化，滚动到底部
watch(() => props.streamContent, () => {
  nextTick(() => scrollToBottom());
});

// 组件挂载后滚动到底部
onMounted(() => {
  nextTick(() => scrollToBottom());
});
</script>

<style scoped>
.chat-messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
</style> 