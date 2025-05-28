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
            <i class="fas fa-sliders-h"></i>
            <span>AI 配置</span>
          </div>
          <button class="collapse-btn" @click="toggleLeftPanel">
            <i class="fas" :class="leftPanelCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'"></i>
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
              <el-button size="small" @click="$router.push('/presets')" type="primary">
                <i class="fas fa-cog"></i> 管理预设
              </el-button>
            </div>
          </div>

          <!-- 生成参数 -->
          <div class="config-section">
            <h4>生成参数</h4>
            <div class="parameter-group">
              <div class="parameter-item">
                <label>温度</label>
                <el-slider v-model="temperature" :min="0" :max="2" :step="0.1" show-input />
              </div>
              <div class="parameter-item">
                <label>最大令牌</label>
                <el-slider v-model="maxTokens" :min="50" :max="2048" :step="50" show-input />
              </div>
              <div class="parameter-item">
                <label>Top P</label>
                <el-slider v-model="topP" :min="0" :max="1" :step="0.1" show-input />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 中央聊天区域 -->
      <div class="chat-area">
        <!-- 顶部栏 -->
        <div class="chat-header">
          <div class="chat-title">
            <div class="character-info">
              <img :src="currentCharacter.avatar" :alt="currentCharacter.name" class="character-avatar">
              <div class="character-details">
                <h3>{{ currentCharacter.name }}</h3>
                <p>{{ currentCharacter.description }}</p>
              </div>
            </div>
          </div>
          <div class="chat-actions">
            <el-button circle size="small" @click="clearChat">
              <i class="fas fa-trash"></i>
            </el-button>
            <el-button circle size="small" @click="exportChat">
              <i class="fas fa-download"></i>
            </el-button>
          </div>
        </div>

        <!-- 消息区域 -->
        <div class="messages-container" ref="messagesContainer">
          <div class="messages-list">
            <div 
              v-for="message in messages" 
              :key="message.id" 
              class="message-wrapper"
              :class="{ 'user-message': message.type === 'user', 'assistant-message': message.type === 'assistant' }"
            >
              <div class="message-avatar">
                <img 
                  :src="message.type === 'user' ? userAvatar : currentCharacter.avatar" 
                  :alt="message.type === 'user' ? '用户' : currentCharacter.name"
                >
              </div>
              <div class="message-content">
                <div class="message-header">
                  <span class="message-author">
                    {{ message.type === 'user' ? '你' : currentCharacter.name }}
                  </span>
                  <span class="message-time">
                    {{ formatTime(message.timestamp) }}
                  </span>
                </div>
                <div class="message-text" v-html="formatMessage(message.content)"></div>
                <div class="message-actions">
                  <button class="action-btn" @click="editMessage(message)">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="action-btn" @click="deleteMessage(message.id)">
                    <i class="fas fa-trash"></i>
                  </button>
                  <button class="action-btn" @click="regenerateMessage(message)" v-if="message.type === 'assistant'">
                    <i class="fas fa-redo"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="chat-input-area">
          <div class="input-container">
            <el-input
              v-model="inputMessage"
              type="textarea"
              :rows="3"
              placeholder="在这里输入你的消息..."
              class="st-input"
              @keydown.ctrl.enter="sendMessage"
              :disabled="isGenerating"
            />
            <div class="input-actions">
              <el-button 
                type="primary" 
                @click="sendMessage" 
                :loading="isGenerating"
                class="send-btn"
              >
                <i class="fas fa-paper-plane"></i>
                发送
              </el-button>
              <el-button 
                v-if="isGenerating"
                @click="stopGeneration"
                type="danger"
                class="stop-btn"
              >
                <i class="fas fa-stop"></i>
                停止
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧角色面板 -->
      <div class="right-panel" :class="{ collapsed: rightPanelCollapsed }">
        <div class="panel-header">
          <div class="panel-title">
            <i class="fas fa-users"></i>
            <span>角色</span>
          </div>
          <button class="collapse-btn" @click="toggleRightPanel">
            <i class="fas" :class="rightPanelCollapsed ? 'fa-chevron-left' : 'fa-chevron-right'"></i>
          </button>
        </div>
        
        <div class="panel-content" v-show="!rightPanelCollapsed">
          <!-- 当前角色信息 -->
          <div class="current-character">
            <div class="character-card">
              <img :src="currentCharacter.avatar" :alt="currentCharacter.name" class="character-image">
              <div class="character-info">
                <h4>{{ currentCharacter.name }}</h4>
                <p>{{ currentCharacter.description }}</p>
              </div>
            </div>
          </div>

          <!-- 角色列表 -->
          <div class="character-list">
            <h4>可用角色</h4>
            <div class="character-grid">
              <div 
                v-for="character in characters" 
                :key="character.id"
                class="character-item"
                :class="{ active: character.id === currentCharacter.id }"
                @click="selectCharacter(character)"
              >
                <img :src="character.avatar" :alt="character.name">
                <span>{{ character.name }}</span>
              </div>
            </div>
            <el-button 
              type="primary" 
              @click="$router.push('/characters')"
              class="manage-btn"
              block
            >
              <i class="fas fa-cog"></i> 管理角色
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Character {
  id: string
  name: string
  avatar: string
  description: string
}

interface Preset {
  id: string
  name: string
  type: string
}

// 响应式数据
const leftPanelCollapsed = ref(false)
const rightPanelCollapsed = ref(false)
const inputMessage = ref('')
const isGenerating = ref(false)
const messagesContainer = ref<HTMLElement>()

// 配置参数
const temperature = ref(0.7)
const maxTokens = ref(150)
const topP = ref(0.9)
const selectedPreset = ref('')

// 用户头像
const userAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=User&backgroundColor=409EFF'

// 示例角色数据
const sampleCharacters = [
  {
    id: '1',
    name: 'Aria',
    description: '友善的AI助手',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aria',
    personality: '友善、乐于助人、聪明'
  },
  {
    id: '2', 
    name: 'Luna',
    description: '神秘的月之女神',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
    personality: '神秘、优雅、智慧'
  },
  {
    id: '3',
    name: 'Rex',
    description: '勇敢的探险家',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rex',
    personality: '勇敢、冒险、坚强'
  },
  {
    id: '4',
    name: 'Sage',
    description: '智慧的贤者',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sage',
    personality: '智慧、沉稳、博学'
  }
]

// 当前选中的角色
const currentCharacter = ref(sampleCharacters[0])

// 响应式数据
const characters = ref(sampleCharacters)

// 预设列表
const presets = ref<Preset[]>([])

// 消息列表
const messages = ref<Message[]>([
  {
    id: '1',
    type: 'assistant',
    content: '你好！我是 ' + sampleCharacters[0].name + '，' + sampleCharacters[0].description + '。有什么我可以帮助你的吗？',
    timestamp: new Date(Date.now() - 300000) // 5分钟前
  },
  {
    id: '2',
    type: 'user',
    content: '你好！很高兴认识你。能告诉我更多关于你的信息吗？',
    timestamp: new Date(Date.now() - 240000) // 4分钟前
  },
  {
    id: '3',
    type: 'assistant',
    content: '当然可以！我是一个' + sampleCharacters[0].personality + '的AI角色。我喜欢与人交流，解答问题，分享有趣的想法。我会尽我所能帮助你，让我们的对话变得有意义和愉快！',
    timestamp: new Date(Date.now() - 180000) // 3分钟前
  }
])

// 方法
const toggleLeftPanel = () => {
  leftPanelCollapsed.value = !leftPanelCollapsed.value
}

const toggleRightPanel = () => {
  rightPanelCollapsed.value = !rightPanelCollapsed.value
}

const selectCharacter = (character: Character) => {
  currentCharacter.value = character
  // 清空消息或切换对话
  messages.value = [{
    id: Date.now().toString(),
    type: 'assistant',
    content: `你好！我是${character.name}，${character.description}`,
    timestamp: new Date()
  }]
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isGenerating.value) return

  const userMessage: Message = {
    id: Date.now().toString(),
    type: 'user',
    content: inputMessage.value,
    timestamp: new Date()
  }

  messages.value.push(userMessage)
  const messageContent = inputMessage.value
  inputMessage.value = ''
  isGenerating.value = true

  await nextTick()
  scrollToBottom()

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: messageContent,
        character: currentCharacter.value.id,
        temperature: temperature.value,
        maxTokens: maxTokens.value,
        topP: topP.value
      })
    })

    if (!response.ok) {
      throw new Error('网络错误')
    }

    const data = await response.json()

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: data.message,
      timestamp: new Date()
    }

    messages.value.push(assistantMessage)
    await nextTick()
    scrollToBottom()
  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败，请稍后再试')
  } finally {
    isGenerating.value = false
  }
}

const stopGeneration = () => {
  isGenerating.value = false
  // 这里应该取消正在进行的请求
}

const clearChat = () => {
  messages.value = []
}

const exportChat = () => {
  const chatData = {
    character: currentCharacter.value,
    messages: messages.value,
    exportTime: new Date().toISOString()
  }
  
  const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `chat_${currentCharacter.value.name}_${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const editMessage = (message: Message) => {
  // 实现消息编辑功能
  console.log('编辑消息:', message)
}

const deleteMessage = (messageId: string) => {
  const index = messages.value.findIndex(m => m.id === messageId)
  if (index > -1) {
    messages.value.splice(index, 1)
  }
}

const regenerateMessage = (message: Message) => {
  // 实现消息重新生成功能
  console.log('重新生成消息:', message)
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
    const response = await fetch('/api/presets')
    if (response.ok) {
      const data = await response.json()
      presets.value = data
    }
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
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  position: relative;
  overflow: hidden;
}

.background-blur {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at center, rgba(68, 68, 68, 0.3) 0%, rgba(34, 34, 34, 0.8) 100%);
  backdrop-filter: blur(2px);
  z-index: 0;
}

.main-container {
  display: flex;
  height: 100vh;
  position: relative;
  z-index: 1;
}

/* 左侧面板 */
.left-panel {
  width: 320px;
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
}

.left-panel.collapsed {
  width: 50px;
}

/* 右侧面板 */
.right-panel {
  width: 280px;
  background: rgba(26, 26, 26, 0.95);
  backdrop-filter: blur(10px);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
}

.right-panel.collapsed {
  width: 50px;
}

/* 面板头部 */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.3);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
  font-weight: bold;
}

.collapse-btn {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: all 0.2s;
}

.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

/* 面板内容 */
.panel-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  color: #ccc;
}

.config-section {
  margin-bottom: 30px;
}

.config-section h4 {
  color: #fff;
  margin-bottom: 15px;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.parameter-group {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.parameter-item label {
  display: block;
  margin-bottom: 8px;
  color: #bbb;
  font-size: 13px;
}

.preset-actions {
  margin-top: 15px;
}

/* 聊天区域 */
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(42, 42, 42, 0.8);
  backdrop-filter: blur(5px);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: rgba(0, 0, 0, 0.4);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.character-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.character-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.character-details h3 {
  margin: 0;
  color: #fff;
  font-size: 16px;
}

.character-details p {
  margin: 5px 0 0 0;
  color: #888;
  font-size: 12px;
}

.chat-actions {
  display: flex;
  gap: 10px;
}

/* 消息区域 */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.message-wrapper {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.message-avatar img {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.message-content {
  flex: 1;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 15px;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
}

.user-message .message-content {
  background: rgba(64, 158, 255, 0.2);
  border-color: rgba(64, 158, 255, 0.3);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.message-author {
  font-weight: bold;
  color: #fff;
  font-size: 13px;
}

.message-time {
  color: #888;
  font-size: 11px;
}

.message-text {
  color: #ddd;
  line-height: 1.5;
}

.message-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 5px;
  opacity: 0;
  transition: opacity 0.2s;
}

.message-content:hover .message-actions {
  opacity: 1;
}

.action-btn {
  background: rgba(0, 0, 0, 0.6);
  border: none;
  color: #888;
  padding: 4px 6px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

/* 输入区域 */
.chat-input-area {
  padding: 20px;
  background: rgba(0, 0, 0, 0.4);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.input-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.input-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

/* 角色相关 */
.current-character {
  margin-bottom: 30px;
}

.character-card {
  background: rgba(0, 0, 0, 0.4);
  border-radius: 12px;
  padding: 15px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.character-image {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  margin-bottom: 10px;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.character-card h4 {
  margin: 0 0 5px 0;
  color: #fff;
}

.character-card p {
  margin: 0;
  color: #888;
  font-size: 12px;
}

.character-list h4 {
  color: #fff;
  margin-bottom: 15px;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 10px;
  margin-bottom: 20px;
}

.character-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.character-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.character-item.active {
  background: rgba(64, 158, 255, 0.3);
  border-color: rgba(64, 158, 255, 0.5);
}

.character-item img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-bottom: 5px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.character-item span {
  color: #ccc;
  font-size: 11px;
  text-align: center;
}

.manage-btn {
  width: 100%;
}

/* Element Plus 样式覆盖 */
.st-select,
.st-input {
  --el-input-bg-color: rgba(0, 0, 0, 0.4);
  --el-input-border-color: rgba(255, 255, 255, 0.2);
  --el-input-hover-border-color: rgba(64, 158, 255, 0.5);
  --el-input-focus-border-color: rgba(64, 158, 255, 0.8);
  --el-input-text-color: #fff;
  --el-input-placeholder-color: #888;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style> 