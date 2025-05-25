<template>
  <div class="app-container">
    <header class="app-header">
      <h1 class="app-title">简易聊天</h1>
    </header>
    
    <main class="chat-container">
      <div class="chat-messages" ref="messagesContainer">
        <div 
          v-for="(message, index) in messages" 
          :key="index"
          class="message"
          :class="message.role"
        >
          <div class="content">{{ message.content }}</div>
        </div>
        <div v-if="streaming" class="message assistant streaming">
          <div class="content">{{ streamContent }}</div>
        </div>
      </div>
      
      <div class="chat-input">
        <textarea 
          v-model="messageInput" 
          placeholder="输入消息..." 
          @keypress.enter.exact.prevent="sendMessage"
          :disabled="loading"
        ></textarea>
        <button 
          @click="sendMessage" 
          :disabled="!messageInput.trim() || loading"
        >
          {{ loading ? '发送中...' : '发送' }}
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const messageInput = ref('');
const messages = ref<Message[]>([]);
const messagesContainer = ref<HTMLElement | null>(null);
const loading = ref(false);
const streaming = ref(false);
const streamContent = ref('');

// 发送消息
const sendMessage = async () => {
  const content = messageInput.value.trim();
  if (!content || loading.value) return;
  
  // 添加用户消息
  messages.value.push({
    role: 'user',
    content
  });
  
  // 清空输入框
  messageInput.value = '';
  
  // 滚动到底部
  await nextTick();
  scrollToBottom();
  
  loading.value = true;
  streaming.value = true;
  streamContent.value = '';
  
  try {
    // 创建一个新的AbortController实例
    const controller = new AbortController();
    const { signal } = controller;
    
    // 发送请求到后端API
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        message: content
      }),
      signal
    });
    
    if (!response.body) {
      throw new Error('ReadableStream not supported');
    }
    
    // 获取reader来读取流式响应
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }
      
      // 将Uint8Array转换为文本
      const chunk = decoder.decode(value, { stream: true });
      streamContent.value += chunk;
      
      // 滚动到底部
      scrollToBottom();
    }
    
    // 流结束后，将完整响应添加到消息列表
    messages.value.push({
      role: 'assistant',
      content: streamContent.value
    });
    
  } catch (error) {
    console.error('Error:', error);
    // 如果流失败，添加错误消息
    messages.value.push({
      role: 'assistant',
      content: '抱歉，发生了错误。请重试。'
    });
  } finally {
    loading.value = false;
    streaming.value = false;
    streamContent.value = '';
    scrollToBottom();
  }
};

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: #333;
  background-color: #f5f5f5;
}

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.app-header {
  padding: 16px;
  background-color: #1890ff;
  color: white;
  text-align: center;
}

.app-title {
  margin: 0;
  font-size: 1.5rem;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  background-color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
  white-space: pre-wrap;
  word-break: break-word;
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

.message.streaming {
  border: 1px solid #e8e8e8;
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