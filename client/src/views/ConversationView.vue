<template>
  <div class="conversation-view">
    <div class="conversation-header">
      <el-page-header @back="goBack" :title="character ? character.name : '对话'">
        <template #content>
          <span class="conversation-title">{{ character ? `与 ${character.name} 的对话` : '对话' }}</span>
        </template>
        <template #extra>
          <div class="conversation-actions">
            <el-button-group>
              <el-button size="small" @click="exportConversation">
                <el-icon><Download /></el-icon> 导出
              </el-button>
              <el-button size="small" type="danger" @click="clearConversation">
                <el-icon><Delete /></el-icon> 清空
              </el-button>
            </el-button-group>
          </div>
        </template>
      </el-page-header>
    </div>

    <div class="conversation-container">
      <div ref="messagesContainer" class="messages-container">
        <div v-if="!messages.length" class="empty-chat">
          <el-empty description="开始和角色对话吧！"></el-empty>
        </div>
        
        <template v-else>
          <div 
            v-for="(message, index) in messages" 
            :key="index"
            :class="['message', message.role === 'user' ? 'message-user' : 'message-assistant']"
          >
            <div class="message-avatar">
              <el-avatar 
                :src="message.role === 'user' ? userAvatar : character?.avatar" 
                :size="40"
              ></el-avatar>
            </div>
            <div class="message-content">
              <div class="message-name">
                {{ message.role === 'user' ? '用户' : character?.name }}
              </div>
              <div class="message-text">
                {{ message.content }}
              </div>
              <div class="message-time">
                {{ formatTime(message.timestamp) }}
              </div>
            </div>
          </div>
        </template>
      </div>
      
      <div class="input-container">
        <el-input
          v-model="userInput"
          type="textarea"
          :rows="3"
          :placeholder="`发送消息给 ${character?.name || '角色'}`"
          resize="none"
          @keydown.enter.ctrl="sendMessage"
        >
          <template #append>
            <el-button 
              type="primary"
              :disabled="!userInput.trim()"
              @click="sendMessage"
            >
              <el-icon><Position /></el-icon> 发送
            </el-button>
          </template>
        </el-input>
        <div class="input-tips">
          按 Ctrl + Enter 发送消息
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Download, Delete, Position } from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const conversationId = computed(() => route.params.id as string);
const messagesContainer = ref<HTMLElement | null>(null);
const userInput = ref('');
const userAvatar = 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png';

// 临时数据
interface Character {
  id: string;
  name: string;
  avatar: string;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

const character = ref<Character>({
  id: '1',
  name: '小红',
  avatar: 'https://placekitten.com/100/100'
});

const messages = ref<Message[]>([
  {
    role: 'assistant',
    content: '你好！很高兴见到你！',
    timestamp: Date.now() - 60000
  },
  {
    role: 'user',
    content: '你好啊，今天天气真不错！',
    timestamp: Date.now() - 30000
  },
  {
    role: 'assistant',
    content: '是的，天气很好！你今天有什么计划吗？',
    timestamp: Date.now()
  }
]);

// 返回上一页
function goBack() {
  router.push('/conversations');
}

// 导出对话
function exportConversation() {
  const content = messages.value.map(msg => {
    const name = msg.role === 'user' ? '用户' : character.value.name;
    return `${name}: ${msg.content}`;
  }).join('\n\n');
  
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `对话-${character.value.name}-${new Date().toLocaleDateString()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// 清空对话
function clearConversation() {
  ElMessageBox.confirm('确定要清空当前对话吗？此操作无法恢复。', '清空对话', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    messages.value = [];
    ElMessage.success('已清空对话');
  }).catch(() => {
    // 用户取消操作
  });
}

// 发送消息
async function sendMessage() {
  const trimmedInput = userInput.value.trim();
  if (!trimmedInput) return;
  
  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: trimmedInput,
    timestamp: Date.now()
  });
  
  userInput.value = '';
  
  // 滚动到底部
  await scrollToBottom();
  
  // 模拟AI回复
  setTimeout(() => {
    messages.value.push({
      role: 'assistant',
      content: `这是一个模拟的回复：${trimmedInput}`,
      timestamp: Date.now()
    });
    scrollToBottom();
  }, 1000);
}

// 格式化时间
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 滚动到底部
async function scrollToBottom() {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

onMounted(() => {
  // 加载对话数据
  console.log('加载对话ID:', conversationId.value);
  scrollToBottom();
});
</script>

<style scoped>
.conversation-view {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  max-width: 1200px;
  margin: 0 auto;
}

.conversation-header {
  padding: 10px 20px;
  border-bottom: 1px solid #eaeaea;
  background-color: #fff;
}

.conversation-title {
  font-size: 18px;
  font-weight: bold;
}

.conversation-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
  padding: 20px;
  overflow: hidden;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.message {
  display: flex;
  margin-bottom: 20px;
}

.message-user {
  flex-direction: row-reverse;
}

.message-avatar {
  margin: 0 10px;
}

.message-content {
  max-width: 70%;
  padding: 10px;
  border-radius: 8px;
  position: relative;
}

.message-user .message-content {
  background-color: #95ec69;
  text-align: right;
}

.message-assistant .message-content {
  background-color: #fff;
}

.message-name {
  font-size: 12px;
  color: #606266;
  margin-bottom: 5px;
}

.message-text {
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-time {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
  text-align: right;
}

.empty-chat {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.input-container {
  margin-top: 20px;
  padding: 10px;
  border-radius: 8px;
  background-color: #fff;
}

.input-tips {
  text-align: right;
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}
</style> 