<template>
  <div class="chat-input">
    <textarea 
      v-model="inputValue" 
      placeholder="输入消息..." 
      @keypress.enter.exact.prevent="submit"
      :disabled="disabled"
    ></textarea>
    <button 
      @click="submit" 
      :disabled="!inputValue.trim() || disabled"
    >
      {{ disabled ? '发送中...' : '发送' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue';

const props = defineProps<{
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'send', message: string): void;
}>();

const inputValue = ref('');

const submit = () => {
  const message = inputValue.value.trim();
  if (!message || props.disabled) return;
  
  emit('send', message);
  inputValue.value = '';
};
</script>

<style scoped>
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