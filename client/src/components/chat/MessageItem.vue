<template>
  <div 
    class="message"
    :class="role"
  >
    <div class="content">{{ content }}</div>
    <div v-if="timestamp" class="timestamp">{{ formatTime(timestamp) }}</div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

const props = defineProps<{
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}>();

// 格式化时间戳为时间
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};
</script>

<style scoped>
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
</style> 