<template>
  <div class="chat-interface">
    <!-- 角色信息头部 -->
    <div class="chat-header">
      <div class="character-info" v-if="currentCharacter">
        <img :src="currentCharacter.avatar" :alt="currentCharacter.name" class="character-avatar" />
        <div class="character-details">
          <h2 class="character-name">{{ currentCharacter.name }}</h2>
          <p class="character-description">{{ currentCharacter.description }}</p>
        </div>
      </div>
      <div class="character-placeholder" v-else>
        <i class="fa-solid fa-user-plus"></i>
        <span>选择一个角色开始对话</span>
      </div>
    </div>

    <!-- 消息列表 -->
    <div class="chat-messages custom-scrollbar" ref="messagesContainer">
      <div 
        v-for="message in messages" 
        :key="message.id"
        class="message"
        :class="{
          'user-message': message.role === 'user',
          'assistant-message': message.role === 'assistant',
          'system-message': message.role === 'system'
        }"
      >
        <div class="message-avatar">
          <img 
            v-if="message.role === 'user'" 
            :src="userAvatar" 
            alt="用户"
            class="avatar"
          />
          <img 
            v-else-if="message.role === 'assistant' && currentCharacter" 
            :src="currentCharacter.avatar" 
            :alt="currentCharacter.name"
            class="avatar"
          />
          <i v-else class="fa-solid fa-cog avatar-icon"></i>
        </div>
        
        <div class="message-content">
          <div class="message-header">
            <span class="message-sender">
              {{ message.role === 'user' ? '你' : (message.role === 'assistant' && currentCharacter ? currentCharacter.name : '系统') }}
            </span>
            <span class="message-time">{{ formatTime(message.timestamp) }}</span>
          </div>
          <div class="message-text" v-html="formatMessage(message.content)"></div>
        </div>
      </div>
      
      <!-- 等待回复指示器 -->
      <div v-if="isWaiting" class="message assistant-message waiting">
        <div class="message-avatar">
          <img 
            v-if="currentCharacter" 
            :src="currentCharacter.avatar" 
            :alt="currentCharacter.name"
            class="avatar"
          />
          <i v-else class="fa-solid fa-robot avatar-icon"></i>
        </div>
        
        <div class="message-content">
          <div class="message-header">
            <span class="message-sender">{{ currentCharacter?.name || 'AI' }}</span>
          </div>
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>

    <!-- 消息输入区域 -->
    <div class="chat-input">
      <div class="input-container">
        <button 
          class="ls-btn ls-btn--secondary ls-btn--icon" 
          title="附件"
          @click="showAttachmentMenu = !showAttachmentMenu"
        >
          <i class="fa-solid fa-paperclip"></i>
        </button>
        
        <textarea
          ref="messageInput"
          v-model="newMessage"
          placeholder="输入消息..."
          class="ls-input ls-textarea"
          @keydown="handleKeyDown"
          @input="adjustTextareaHeight"
          rows="1"
        ></textarea>
        
        <button 
          class="ls-btn ls-btn--primary ls-btn--icon"
          :disabled="!newMessage.trim() || isWaiting"
          @click="sendMessage"
          title="发送"
        >
          <i class="fa-solid fa-paper-plane"></i>
        </button>
      </div>
      
      <!-- 附件菜单 -->
      <div v-if="showAttachmentMenu" class="attachment-menu">
        <button class="attachment-option" @click="uploadImage">
          <i class="fa-solid fa-image"></i>
          <span>图片</span>
        </button>
        <button class="attachment-option" @click="uploadFile">
          <i class="fa-solid fa-file"></i>
          <span>文件</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import type { Character } from '@/types/character'

// Props
interface Props {
  currentCharacter?: Character
  userAvatar?: string
}

const props = withDefaults(defineProps<Props>(), {
  userAvatar: 'https://api.dicebear.com/7.x/personas/svg?seed=user'
})

// Emits
interface Emits {
  (e: 'send-message', message: string): void
  (e: 'upload-image', file: File): void
  (e: 'upload-file', file: File): void
}

const emit = defineEmits<Emits>()

// 响应式数据
const messagesContainer = ref<HTMLElement>()
const messageInput = ref<HTMLTextAreaElement>()
const newMessage = ref('')
const isWaiting = ref(false)
const showAttachmentMenu = ref(false)

// 模拟消息数据
const messages = ref([
  {
    id: '1',
    role: 'system',
    content: '对话开始。请保持角色设定进行对话。',
    timestamp: new Date(Date.now() - 3600000)
  },
  {
    id: '2',
    role: 'assistant',
    content: '你好！我是Luna，很高兴见到你。今天想聊什么呢？',
    timestamp: new Date(Date.now() - 1800000)
  },
  {
    id: '3',
    role: 'user',
    content: '嗨Luna！能跟我聊聊你的兴趣爱好吗？',
    timestamp: new Date(Date.now() - 900000)
  },
  {
    id: '4',
    role: 'assistant',
    content: '当然可以！我特别喜欢探索宇宙和星空。每当夜晚来临，我总是喜欢仰望星空，想象着遥远星系中可能存在的生命。你有什么特别的爱好吗？',
    timestamp: new Date(Date.now() - 300000)
  }
])

// 计算属性
const computedMessages = computed(() => {
  return messages.value.map(msg => ({
    ...msg,
    timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)
  }))
})

// 方法
const sendMessage = async () => {
  if (!newMessage.value.trim() || isWaiting.value) return

  const userMessage = {
    id: Date.now().toString(),
    role: 'user' as const,
    content: newMessage.value.trim(),
    timestamp: new Date()
  }

  messages.value.push(userMessage)
  emit('send-message', newMessage.value.trim())
  
  newMessage.value = ''
  adjustTextareaHeight()
  isWaiting.value = true
  
  await nextTick()
  scrollToBottom()

  // 模拟AI回复
  setTimeout(() => {
    const responses = [
      "这是一个很有趣的问题！让我想想...",
      "我理解你的想法。关于这个话题，我认为...",
      "这让我想起了一个有趣的故事...",
      "你说得很对！我也有类似的感受..."
    ]
    
    const aiMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant' as const,
      content: responses[Math.floor(Math.random() * responses.length)],
      timestamp: new Date()
    }
    
    messages.value.push(aiMessage)
    isWaiting.value = false
    nextTick(() => scrollToBottom())
  }, 1500)
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

const adjustTextareaHeight = () => {
  if (!messageInput.value) return
  
  messageInput.value.style.height = 'auto'
  const scrollHeight = messageInput.value.scrollHeight
  const maxHeight = 120 // 最大高度限制
  
  messageInput.value.style.height = Math.min(scrollHeight, maxHeight) + 'px'
}

const scrollToBottom = () => {
  if (!messagesContainer.value) return
  
  messagesContainer.value.scrollTo({
    top: messagesContainer.value.scrollHeight,
    behavior: 'smooth'
  })
}

const formatTime = (timestamp: Date) => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  
  return timestamp.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatMessage = (content: string) => {
  // 简单的Markdown处理
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
}

const uploadImage = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      emit('upload-image', file)
    }
  }
  input.click()
  showAttachmentMenu.value = false
}

const uploadFile = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      emit('upload-file', file)
    }
  }
  input.click()
  showAttachmentMenu.value = false
}

// 监听点击外部关闭附件菜单
const handleClickOutside = (event: Event) => {
  if (showAttachmentMenu.value && !(event.target as Element).closest('.chat-input')) {
    showAttachmentMenu.value = false
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  scrollToBottom()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// 监听当前角色变化，重置对话
watch(() => props.currentCharacter, (newCharacter) => {
  if (newCharacter) {
    messages.value = [
      {
        id: '1',
        role: 'system',
        content: '对话开始。请保持角色设定进行对话。',
        timestamp: new Date()
      },
      {
        id: '2',
        role: 'assistant',
        content: newCharacter.greeting || `你好！我是${newCharacter.name}，很高兴见到你。`,
        timestamp: new Date()
      }
    ]
    nextTick(() => scrollToBottom())
  }
})
</script>

<style scoped>
.chat-interface {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--glass-bg);
  backdrop-filter: blur(var(--blur-lg));
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--glass-border);
}

.chat-header {
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--glass-border);
  background: var(--glass-bg-dark);
}

.character-info {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.character-avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  object-fit: cover;
  border: 2px solid var(--accent-color);
}

.character-details {
  flex: 1;
}

.character-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--space-1) 0;
}

.character-description {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
  opacity: 0.8;
}

.character-placeholder {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--text-secondary);
  opacity: 0.6;
}

.character-placeholder i {
  font-size: 1.5rem;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.message {
  display: flex;
  gap: var(--space-3);
  animation: fadeIn var(--transition-normal);
}

.message-avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: var(--radius-full);
  object-fit: cover;
}

.avatar-icon {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--glass-bg-medium);
  color: var(--text-secondary);
  border-radius: var(--radius-full);
  font-size: 1rem;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-1);
}

.message-sender {
  font-weight: 600;
  font-size: 0.9rem;
}

.user-message .message-sender {
  color: var(--accent-color);
}

.assistant-message .message-sender {
  color: var(--primary-color);
}

.system-message .message-sender {
  color: var(--text-secondary);
}

.message-time {
  font-size: 0.8rem;
  color: var(--text-secondary);
  opacity: 0.6;
}

.message-text {
  color: var(--text-primary);
  line-height: 1.5;
  word-wrap: break-word;
}

.user-message .message-text {
  background: rgba(var(--accent-rgb), 0.1);
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  border-top-left-radius: var(--radius-sm);
}

.assistant-message .message-text {
  background: var(--glass-bg-light);
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  border-top-left-radius: var(--radius-sm);
}

.system-message .message-text {
  font-style: italic;
  opacity: 0.7;
  font-size: 0.9rem;
}

.waiting {
  opacity: 0.8;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: var(--space-3);
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--text-secondary);
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

.chat-input {
  padding: var(--space-4);
  border-top: 1px solid var(--glass-border);
  background: var(--glass-bg-dark);
  position: relative;
}

.input-container {
  display: flex;
  gap: var(--space-2);
  align-items: flex-end;
}

.input-container .ls-input {
  flex: 1;
  min-height: 44px;
  max-height: 120px;
  resize: vertical;
}

.attachment-menu {
  position: absolute;
  bottom: 100%;
  left: var(--space-4);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  padding: var(--space-2);
  margin-bottom: var(--space-2);
  backdrop-filter: blur(var(--blur-lg));
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 120px;
  box-shadow: var(--shadow-lg);
}

.attachment-option {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  cursor: pointer;
  transition: background var(--transition-normal);
  font-size: 0.9rem;
}

.attachment-option:hover {
  background: var(--glass-bg-medium);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chat-header {
    padding: var(--space-4);
  }
  
  .character-avatar {
    width: 40px;
    height: 40px;
  }
  
  .character-name {
    font-size: 1.1rem;
  }
  
  .chat-messages {
    padding: var(--space-3);
  }
  
  .message {
    gap: var(--space-2);
  }
  
  .message-avatar {
    width: 32px;
    height: 32px;
  }
  
  .input-container {
    flex-direction: column;
    gap: var(--space-3);
  }
}
</style> 