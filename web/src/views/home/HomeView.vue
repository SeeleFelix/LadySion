<template>
  <div class="silly-tavern-home">
    <!-- 背景模糊层 -->
    <div class="background-blur"></div>
    
    <!-- 主容器 -->
    <div class="main-container">
      <!-- 左侧配置面板 -->
      <div class="left-panel" :class="{ collapsed: leftPanelCollapsed }">
        <div class="panel-header">
          <div class="panel-title">
            <font-awesome-icon icon="sliders-h" />
            <span v-show="!leftPanelCollapsed">AI 配置</span>
          </div>
          <button class="collapse-btn ls-btn ls-btn--ghost" @click="toggleLeftPanel">
            <font-awesome-icon :icon="leftPanelCollapsed ? 'chevron-right' : 'chevron-left'" />
          </button>
        </div>
        
        <div class="panel-content" v-show="!leftPanelCollapsed">
          <!-- 预设选择器 -->
          <div class="config-section">
            <h4>对话补全预设</h4>
            <el-select v-model="selectedPreset" placeholder="选择预设" class="st-select">
              <el-option
                v-for="preset in presets"
                :key="preset.id"
                :label="preset.name"
                :value="preset.id"
              />
            </el-select>
            <div class="preset-actions">
              <el-button size="small" @click="$router.push('/presets')" class="ls-btn ls-btn--primary">
                <font-awesome-icon icon="cog" /> 管理预设
              </el-button>
            </div>
          </div>

          <!-- 生成参数 -->
          <div class="config-section">
            <h4>生成参数</h4>
            <div class="parameter-group">
              <div class="parameter-item">
                <label>Temperature: {{ temperature }}</label>
                <el-slider
                  v-model="temperature"
                  :min="0"
                  :max="2"
                  :step="0.1"
                  show-stops
                  class="st-slider"
                />
              </div>
              
              <div class="parameter-item">
                <label>Max Tokens: {{ maxTokens }}</label>
                <el-slider
                  v-model="maxTokens"
                  :min="1"
                  :max="4096"
                  :step="1"
                  class="st-slider"
                />
              </div>
              
              <div class="parameter-item">
                <label>Top P: {{ topP }}</label>
                <el-slider
                  v-model="topP"
                  :min="0"
                  :max="1"
                  :step="0.01"
                  class="st-slider"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 聊天区域 -->
      <div class="chat-area">
        <div class="chat-header">
          <div class="character-info">
            <div class="ls-avatar ls-avatar--md">
              <img :src="currentCharacter.avatar" :alt="currentCharacter.name" />
            </div>
            <div class="character-details">
              <h3>{{ currentCharacter.name }}</h3>
              <span class="character-status">{{ currentCharacter.description }}</span>
            </div>
          </div>
          
          <div class="chat-actions">
            <ThemeSwitcher />
            <el-button class="ls-btn ls-btn--secondary" @click="exportChat">
              <font-awesome-icon icon="download" />
              <span class="btn-text">导出</span>
            </el-button>
            <el-button class="ls-btn ls-btn--danger" @click="clearChat">
              <font-awesome-icon icon="trash" />
              <span class="btn-text">清空</span>
            </el-button>
            <button class="collapse-btn ls-btn ls-btn--ghost" @click="toggleRightPanel">
              <font-awesome-icon :icon="rightPanelCollapsed ? 'chevron-left' : 'chevron-right'" />
            </button>
          </div>
        </div>

        <!-- 消息列表 -->
        <div class="messages-container" ref="messagesContainer">
          <div v-if="messages.length === 0" class="empty-chat">
            <div class="empty-icon">
              <font-awesome-icon icon="comments" />
            </div>
            <h3>开始新的对话</h3>
            <p>选择一个角色预设，然后开始聊天吧！</p>
          </div>
          
          <div v-else class="messages-list">
            <div 
              v-for="message in messages" 
              :key="message.id"
              class="ls-message"
              :class="`ls-message--${message.type}`"
            >
              <div class="ls-message__avatar">
                <div class="ls-avatar ls-avatar--sm">
                  <img 
                    :src="message.type === 'user' ? userAvatar : currentCharacter.avatar" 
                    :alt="message.type === 'user' ? 'User' : currentCharacter.name"
                  />
                </div>
              </div>
              
              <div class="ls-message__content">
                <div class="ls-message__bubble" v-html="formatMessage(message.content)"></div>
                <div class="ls-message__meta">
                  <span class="ls-message__time">{{ formatTime(message.timestamp) }}</span>
                  <div class="ls-message__actions">
                    <button class="ls-btn ls-btn--sm" @click="editMessage(message)">
                      <font-awesome-icon icon="edit" />
                    </button>
                    <button class="ls-btn ls-btn--sm" @click="deleteMessage(message.id)">
                      <font-awesome-icon icon="trash" />
                    </button>
                    <button class="ls-btn ls-btn--sm" @click="regenerateMessage(message)">
                      <font-awesome-icon icon="redo" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="input-area">
          <div class="input-container">
            <el-input
              v-model="newMessage"
              type="textarea"
              :rows="3"
              placeholder="输入消息..."
              class="message-input ls-textarea"
              @keydown.ctrl.enter="sendMessage"
              @keydown.meta.enter="sendMessage"
            />
            <div class="input-actions">
              <div class="input-info">
                <span class="token-count">{{ messageTokens }} tokens</span>
                <span class="shortcuts">Ctrl+Enter 发送</span>
              </div>
              <div class="send-actions">
                <el-button 
                  class="ls-btn ls-btn--secondary"
                  @click="regenerateLastMessage"
                  :disabled="messages.length === 0"
                >
                  <font-awesome-icon icon="redo" />
                </el-button>
                <el-button 
                  class="ls-btn ls-btn--primary send-btn"
                  @click="sendMessage"
                  :disabled="!newMessage.trim() || isGenerating"
                  :loading="isGenerating"
                >
                  <font-awesome-icon icon="paper-plane" />
                  发送
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧面板 -->
      <div class="right-panel" :class="{ collapsed: rightPanelCollapsed }">
        <div class="panel-header">
          <div class="panel-title">
            <font-awesome-icon icon="user" />
            <span v-show="!rightPanelCollapsed">角色信息</span>
          </div>
          <button class="collapse-btn ls-btn ls-btn--ghost" @click="toggleRightPanel">
            <font-awesome-icon :icon="rightPanelCollapsed ? 'chevron-left' : 'chevron-right'" />
          </button>
        </div>
        
        <div class="panel-content" v-show="!rightPanelCollapsed">
          <!-- 角色卡片 -->
          <div class="character-card ls-card">
            <div class="character-avatar">
              <div class="ls-avatar ls-avatar--xl">
                <img :src="currentCharacter.avatar" :alt="currentCharacter.name" />
              </div>
            </div>
            <div class="character-info-detail">
              <h3>{{ currentCharacter.name }}</h3>
              <p class="character-description">{{ currentCharacter.description }}</p>
              <div class="character-tags">
                <span 
                  v-for="tag in currentCharacter.tags" 
                  :key="tag"
                  class="ls-tag ls-tag--accent"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>

          <!-- 聊天统计 -->
          <div class="chat-stats ls-card">
            <h4>聊天统计</h4>
            <div class="stat-item">
              <span class="stat-label">消息数量</span>
              <span class="stat-value">{{ messages.length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">总字符数</span>
              <span class="stat-value">{{ totalCharacters }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">聊天时长</span>
              <span class="stat-value">{{ chatDuration }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import ThemeSwitcher from '@/components/common/ThemeSwitcher.vue'

// 接口定义
interface Message {
  id: string
  type: 'user' | 'bot' | 'system'
  content: string
  timestamp: Date
}

interface Character {
  id: string
  name: string
  description: string
  avatar: string
  tags: string[]
}

interface Preset {
  id: string
  name: string
  description: string
}

// 响应式数据
const leftPanelCollapsed = ref(false)
const rightPanelCollapsed = ref(false)
const messages = ref<Message[]>([])
const newMessage = ref('')
const isGenerating = ref(false)
const messagesContainer = ref<HTMLElement>()

// 配置参数
const selectedPreset = ref('')
const temperature = ref(0.7)
const maxTokens = ref(2048)
const topP = ref(0.9)

// 预设数据
const presets = ref<Preset[]>([
  { id: '1', name: 'Alpaca', description: '指令跟随模型' },
  { id: '2', name: 'ChatML', description: '对话标记语言' },
  { id: '3', name: 'Vicuna', description: '基于Llama的聊天模型' }
])

// 当前角色
const currentCharacter = ref<Character>({
  id: '1',
  name: 'Lady Sion',
  description: '智能AI助手，友善且乐于助人',
  avatar: '/api/placeholder/64/64',
  tags: ['AI助手', '友善', '智能']
})

const userAvatar = '/api/placeholder/64/64'

// 计算属性
const messageTokens = computed(() => {
  // 简单的token计算，实际应该使用tokenizer
  return Math.ceil(newMessage.value.length / 3.5)
})

const totalCharacters = computed(() => {
  return messages.value.reduce((total, msg) => total + msg.content.length, 0)
})

const chatDuration = computed(() => {
  if (messages.value.length === 0) return '0分钟'
  const first = messages.value[0].timestamp
  const last = messages.value[messages.value.length - 1].timestamp
  const duration = Math.floor((last.getTime() - first.getTime()) / 60000)
  return `${duration}分钟`
})

// 方法
const toggleLeftPanel = () => {
  leftPanelCollapsed.value = !leftPanelCollapsed.value
}

const toggleRightPanel = () => {
  rightPanelCollapsed.value = !rightPanelCollapsed.value
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || isGenerating.value) return

  // 添加用户消息
  const userMsg: Message = {
    id: Date.now().toString(),
    type: 'user',
    content: newMessage.value.trim(),
    timestamp: new Date()
  }
  
  messages.value.push(userMsg)
  const userInput = newMessage.value
  newMessage.value = ''
  
  // 滚动到底部
  await nextTick()
  scrollToBottom()

  // 模拟AI回复
  isGenerating.value = true
  try {
    // 这里应该调用实际的AI API
    setTimeout(() => {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: `感谢您的消息："${userInput}"。我是Lady Sion，很高兴与您交流！`,
        timestamp: new Date()
      }
      
      messages.value.push(botMsg)
      isGenerating.value = false
      
      nextTick(() => {
        scrollToBottom()
      })
    }, 1500)
  } catch (error) {
    isGenerating.value = false
    ElMessage.error('消息发送失败')
  }
}

const clearChat = () => {
  messages.value = []
  ElMessage.success('聊天记录已清空')
}

const exportChat = () => {
  // 实现聊天记录导出
  ElMessage.info('导出功能开发中...')
}

const regenerateLastMessage = () => {
  if (messages.value.length === 0) return
  
  const lastMessage = messages.value[messages.value.length - 1]
  if (lastMessage.type === 'bot') {
    regenerateMessage(lastMessage)
  }
}

const editMessage = (message: Message) => {
  // 实现消息编辑功能
  console.log('编辑消息:', message)
  ElMessage.info('编辑功能开发中...')
}

const deleteMessage = (messageId: string) => {
  const index = messages.value.findIndex(m => m.id === messageId)
  if (index > -1) {
    messages.value.splice(index, 1)
    ElMessage.success('消息已删除')
  }
}

const regenerateMessage = (message: Message) => {
  // 实现消息重新生成功能
  console.log('重新生成消息:', message)
  ElMessage.info('重新生成功能开发中...')
}

const formatMessage = (content: string): string => {
  // 简单的消息格式化，支持基本的HTML
  return content.replace(/\n/g, '<br>')
}

const formatTime = (timestamp: Date): string => {
  return timestamp.toLocaleTimeString()
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 加载预设列表
const loadPresets = async () => {
  try {
    // 这里应该调用实际的API
    // const response = await fetch('/api/presets')
    // if (response.ok) {
    //   const data = await response.json()
    //   presets.value = data
    // }
    console.log('预设加载完成')
  } catch (error) {
    console.error('加载预设失败:', error)
  }
}

onMounted(() => {
  loadPresets()
})
</script>

<style scoped>
.silly-tavern-home {
  height: 100vh;
  background: var(--theme-main-bg);
  position: relative;
  overflow: hidden;
  color: var(--text-primary);
}

.background-blur {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at center, var(--glass-bg-dark) 0%, var(--theme-main-bg) 100%);
  backdrop-filter: blur(var(--blur-chat));
  z-index: 0;
}

.main-container {
  display: flex;
  height: 100vh;
  position: relative;
  z-index: 1;
}

/* 面板通用样式 */
.left-panel,
.right-panel {
  background: var(--st-glass-bg);
  backdrop-filter: blur(var(--blur-main));
  border: 1px solid var(--st-glass-border);
  transition: width var(--duration-normal) var(--easing-ease-in-out);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
}

.left-panel {
  width: 320px;
  border-right: none;
  border-radius: 0 var(--radius-xl) var(--radius-xl) 0;
  margin: var(--space-4) 0 var(--space-4) var(--space-4);
}

.right-panel {
  width: 280px;
  border-left: none;
  border-radius: var(--radius-xl) 0 0 var(--radius-xl);
  margin: var(--space-4) var(--space-4) var(--space-4) 0;
}

.left-panel.collapsed {
  width: 60px;
}

.right-panel.collapsed {
  width: 60px;
}

/* 面板头部 */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  border-bottom: 1px solid var(--st-glass-border);
  background: var(--glass-bg-dark);
  border-radius: inherit;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-primary);
  font-weight: 600;
  font-size: var(--text-sm);
  text-shadow: var(--text-shadow);
}

.collapse-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 面板内容 */
.panel-content {
  flex: 1;
  padding: var(--space-4);
  overflow-y: auto;
  color: var(--text-secondary);
}

.config-section {
  margin-bottom: var(--space-8);
}

.config-section h4 {
  color: var(--text-primary);
  margin-bottom: var(--space-4);
  font-size: var(--text-sm);
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: var(--text-shadow);
  border-bottom: 1px solid var(--st-glass-border);
  padding-bottom: var(--space-2);
}

.parameter-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.parameter-item label {
  display: block;
  margin-bottom: var(--space-2);
  color: var(--text-secondary);
  font-size: var(--text-xs);
  font-weight: 500;
}

.preset-actions {
  margin-top: var(--space-4);
}

/* 聊天区域 */
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--theme-chat-bg);
  backdrop-filter: blur(var(--blur-chat));
  margin: var(--space-4);
  border-radius: var(--radius-2xl);
  border: 1px solid var(--st-glass-border);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-6);
  background: var(--glass-bg-dark);
  border-bottom: 1px solid var(--st-glass-border);
}

.character-info {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.character-details h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--text-lg);
  font-weight: 600;
  text-shadow: var(--text-shadow);
}

.character-status {
  color: var(--text-secondary);
  font-size: var(--text-sm);
}

.chat-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.btn-text {
  margin-left: var(--space-1);
}

/* 消息区域 */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
  scroll-behavior: smooth;
}

.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: var(--text-muted);
}

.empty-icon {
  font-size: var(--text-3xl);
  margin-bottom: var(--space-4);
  opacity: 0.5;
}

.empty-chat h3 {
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* 输入区域 */
.input-area {
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--st-glass-border);
  background: var(--glass-bg-light);
  backdrop-filter: blur(var(--blur-md));
}

.input-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.message-input {
  resize: none;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.input-info {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.send-actions {
  display: flex;
  gap: var(--space-2);
}

.send-btn {
  min-width: 100px;
}

/* 角色卡片 */
.character-card {
  text-align: center;
  margin-bottom: var(--space-6);
}

.character-avatar {
  margin-bottom: var(--space-4);
}

.character-info-detail h3 {
  color: var(--text-primary);
  margin-bottom: var(--space-2);
  text-shadow: var(--text-shadow);
}

.character-description {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: 1.5;
  margin-bottom: var(--space-4);
}

.character-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  justify-content: center;
}

/* 聊天统计 */
.chat-stats h4 {
  color: var(--text-primary);
  margin-bottom: var(--space-4);
  font-size: var(--text-sm);
  text-shadow: var(--text-shadow);
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.stat-label {
  color: var(--text-secondary);
  font-size: var(--text-xs);
}

.stat-value {
  color: var(--accent);
  font-weight: 600;
  font-size: var(--text-xs);
}

/* ST风格元素覆写 */
.st-select :deep(.el-select) {
  width: 100%;
}

.st-select :deep(.el-input__inner) {
  background: var(--input-bg);
  border-color: var(--input-border);
  color: var(--text-primary);
}

.st-slider :deep(.el-slider__runway) {
  background: var(--glass-bg);
}

.st-slider :deep(.el-slider__bar) {
  background: linear-gradient(90deg, var(--primary), var(--secondary));
}

.st-slider :deep(.el-slider__button) {
  border-color: var(--primary);
  background: var(--primary);
}

/* 响应式适配 */
@media (max-width: 1200px) {
  .right-panel {
    width: 240px;
  }
}

@media (max-width: 992px) {
  .left-panel {
    width: 280px;
  }
  
  .right-panel {
    width: 220px;
  }
}

@media (max-width: 768px) {
  .main-container {
    flex-direction: column;
  }
  
  .left-panel,
  .right-panel {
    width: 100%;
    height: auto;
    margin: var(--space-2);
    border-radius: var(--radius-xl);
  }
  
  .chat-area {
    margin: var(--space-2);
    flex: 1;
  }
  
  .chat-actions .btn-text {
    display: none;
  }
}
</style> 