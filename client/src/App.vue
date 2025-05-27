<template>
  <div id="app" class="st-app">
    <!-- 背景 -->
    <div class="st-background"></div>
    
    <!-- 顶部工具栏 -->
    <header class="st-topbar glass-panel">
      <div class="st-topbar-left">
        <!-- AI配置抽屉按钮 -->
        <button 
          class="btn btn-icon" 
          :class="leftDrawerOpen ? 'btn-primary' : 'btn-secondary'"
          @click="toggleLeftDrawer"
          title="AI响应配置"
        >
          <i class="fa-solid fa-sliders"></i>
        </button>
        
        <!-- 角色管理抽屉按钮 -->
        <button 
          class="btn btn-icon" 
          :class="rightDrawerOpen ? 'btn-primary' : 'btn-secondary'"
          @click="toggleRightDrawer"
          title="角色管理"
        >
          <i class="fa-solid fa-users"></i>
        </button>
        
        <!-- 其他工具按钮 -->
        <button class="btn btn-icon btn-ghost" title="世界信息">
          <i class="fa-solid fa-globe"></i>
        </button>
        
        <button class="btn btn-icon btn-ghost" title="扩展管理">
          <i class="fa-solid fa-puzzle-piece"></i>
        </button>
      </div>
      
      <div class="st-topbar-center">
        <h1 class="st-title text-gradient">LadySion</h1>
      </div>
      
      <div class="st-topbar-right">
        <button class="btn btn-icon btn-ghost" title="设置">
          <i class="fa-solid fa-cog"></i>
        </button>
      </div>
    </header>
    
    <!-- 主要内容区域 -->
    <main class="st-main">
      <!-- 左侧抽屉：AI配置 -->
      <aside class="st-drawer st-drawer-left glass-panel" :class="{ open: leftDrawerOpen }">
        <div class="st-drawer-header">
          <h3>AI响应配置</h3>
          <button class="btn btn-icon btn-sm btn-ghost" @click="leftDrawerOpen = false">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <div class="st-drawer-content custom-scrollbar">
          <PresetManagement />
        </div>
      </aside>
      
      <!-- 中心聊天区域 -->
      <section class="st-chat-area">
        <ChatInterface 
          :current-character="currentCharacter || undefined"
          @character-change="handleCharacterChange"
        />
      </section>
      
      <!-- 右侧抽屉：角色管理 -->
      <aside class="st-drawer st-drawer-right glass-panel" :class="{ open: rightDrawerOpen }">
        <div class="st-drawer-header">
          <h3>角色管理</h3>
          <button class="btn btn-icon btn-sm btn-ghost" @click="rightDrawerOpen = false">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <div class="st-drawer-content custom-scrollbar">
          <div class="character-placeholder">
            <div class="card fade-in">
              <div class="card-body text-center">
                <i class="fa-solid fa-user-plus" style="font-size: 2rem; margin-bottom: var(--space-4); opacity: 0.5; color: var(--text-muted);"></i>
                <p style="margin: 0 0 var(--space-3) 0; color: var(--text-secondary);">角色管理功能暂时不可用</p>
                <div class="badge">当前角色: {{ currentCharacter?.name || '无' }}</div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ChatInterface from './components/chat/ChatInterface.vue'
import PresetManagement from './components/preset/PresetManagement.vue'
import type { Character } from './types/character'

// 抽屉状态
const leftDrawerOpen = ref(false)
const rightDrawerOpen = ref(false)

// 当前角色
const currentCharacter = ref<Character | null>(null)

// 抽屉控制
const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value
  if (leftDrawerOpen.value) {
    rightDrawerOpen.value = false
  }
}

const toggleRightDrawer = () => {
  rightDrawerOpen.value = !rightDrawerOpen.value
  if (rightDrawerOpen.value) {
    leftDrawerOpen.value = false
  }
}

// 角色选择处理（保留用于未来实现）
const handleCharacterChange = (character: Character) => {
  currentCharacter.value = character
}
</script>

<style scoped>
.st-app {
  width: 100%;
  height: 100vh;
  position: relative;
  display: flex;
  flex-direction: column;
}

.st-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  z-index: -1;
}

/* 顶部工具栏 */
.st-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 var(--space-5);
  z-index: 100;
  border-radius: 0;
  border-bottom: 1px solid var(--glass-border);
}

.st-topbar-left,
.st-topbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.st-topbar-center {
  flex: 1;
  display: flex;
  justify-content: center;
}

.st-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* 主要内容区域 */
.st-main {
  flex: 1;
  display: flex;
  position: relative;
  overflow: hidden;
}

/* 抽屉样式 */
.st-drawer {
  position: fixed;
  top: 60px;
  bottom: 0;
  width: 400px;
  transition: transform var(--transition-slow);
  z-index: 90;
  display: flex;
  flex-direction: column;
  border-radius: 0;
}

.st-drawer-left {
  left: 0;
  transform: translateX(-100%);
  border-right: 1px solid var(--glass-border);
  border-left: none;
}

.st-drawer-left.open {
  transform: translateX(0);
}

.st-drawer-right {
  right: 0;
  transform: translateX(100%);
  border-left: 1px solid var(--glass-border);
  border-right: none;
}

.st-drawer-right.open {
  transform: translateX(0);
}

.st-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--glass-border);
  background: var(--glass-bg-dark);
}

.st-drawer-header h3 {
  color: var(--text-primary);
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.st-drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-5);
}

/* 聊天区域 */
.st-chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: transparent;
  transition: margin var(--transition-slow);
  padding: var(--space-4);
}

/* 当抽屉打开时调整聊天区域 */
.st-main:has(.st-drawer-left.open) .st-chat-area {
  margin-left: 400px;
}

.st-main:has(.st-drawer-right.open) .st-chat-area {
  margin-right: 400px;
}

/* 字符占位符样式 */
.character-placeholder {
  text-align: center;
}

.text-center {
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .st-drawer {
    width: 350px;
  }
  
  .st-main:has(.st-drawer-left.open) .st-chat-area {
    margin-left: 350px;
  }
  
  .st-main:has(.st-drawer-right.open) .st-chat-area {
    margin-right: 350px;
  }
}

@media (max-width: 768px) {
  .st-drawer {
    width: 100%;
  }
  
  .st-main:has(.st-drawer-left.open) .st-chat-area,
  .st-main:has(.st-drawer-right.open) .st-chat-area {
    margin-left: 0;
    margin-right: 0;
  }
  
  .st-topbar {
    padding: 0 var(--space-4);
  }
  
  .st-title {
    font-size: 1.25rem;
  }
  
  .st-chat-area {
    padding: var(--space-2);
  }
  
  .st-drawer-content {
    padding: var(--space-4);
  }
}
</style> 