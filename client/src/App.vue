<template>
  <div class="app-container">
    <chat-header :title="'Lady Sion'" />
    
    <div class="main-content">
      <chat-container
        :messages="messages"
        :loading="loading"
        :streaming="streaming"
        :stream-content="streamContent"
        @send="sendMessage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ChatHeader from './components/ChatHeader.vue';
import ChatContainer from './components/ChatContainer.vue';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const messages = ref<Message[]>([]);
const loading = ref(false);
const streaming = ref(false);
const streamContent = ref('');

// 发送消息
const sendMessage = async (content: string) => {
  if (!content || loading.value) return;
  
  // 添加用户消息
  messages.value.push({
    role: 'user',
    content,
    timestamp: Date.now()
  });
  
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
    }
    
    // 流结束后，将完整响应添加到消息列表
    messages.value.push({
      role: 'assistant',
      content: streamContent.value,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Error:', error);
    // 如果流失败，添加错误消息
    messages.value.push({
      role: 'assistant',
      content: '抱歉，发生了错误。请重试。',
      timestamp: Date.now()
    });
  } finally {
    loading.value = false;
    streaming.value = false;
    streamContent.value = '';
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
  background-color: #f5f5f5;
}

.main-content {
  flex: 1;
  display: flex;
  max-width: 800px;
  margin: 20px auto;
  width: 100%;
  padding: 0 20px;
}

@media (max-width: 768px) {
  .main-content {
    padding: 0 10px;
    margin: 10px auto;
  }
}
</style> 