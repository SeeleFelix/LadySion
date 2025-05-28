<template>
  <div class="theme-switcher">
    <el-dropdown 
      trigger="click" 
      placement="bottom-end"
      @command="handleThemeChange"
      class="theme-dropdown"
    >
      <el-button class="ls-btn ls-btn--secondary theme-trigger">
        <font-awesome-icon icon="palette" />
        <span class="theme-name">{{ currentThemeName }}</span>
        <font-awesome-icon icon="chevron-down" />
      </el-button>
      
      <template #dropdown>
        <el-dropdown-menu class="theme-menu">
          <el-dropdown-item 
            v-for="theme in themes" 
            :key="theme.id"
            :command="theme.id"
            :class="{ 'is-active': currentTheme === theme.id }"
            class="theme-item"
          >
            <div class="theme-preview">
              <div 
                class="theme-color-swatch" 
                :style="{ backgroundColor: theme.primaryColor }"
              ></div>
              <div class="theme-info">
                <div class="theme-title">{{ theme.name }}</div>
                <div class="theme-description">{{ theme.description }}</div>
              </div>
              <font-awesome-icon 
                v-if="currentTheme === theme.id" 
                icon="check"
                class="theme-check"
              />
            </div>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Theme {
  id: string
  name: string
  description: string
  primaryColor: string
  className: string
}

const currentTheme = ref<string>('dark-lite')

const themes: Theme[] = [
  {
    id: 'dark-lite',
    name: 'Dark Lite',
    description: 'SillyTavern 经典暗色主题',
    primaryColor: 'rgba(220, 220, 210, 1)',
    className: 'theme-dark-lite'
  },
  {
    id: 'azure',
    name: 'Azure',
    description: '蓝色科幻风格主题',
    primaryColor: 'rgba(111, 133, 253, 1)',
    className: 'theme-azure'
  },
  {
    id: 'macaron',
    name: 'Celestial Macaron',
    description: '梦幻马卡龙色调主题',
    primaryColor: 'rgba(229, 175, 162, 1)',
    className: 'theme-macaron'
  },
  {
    id: 'cappuccino',
    name: 'Cappuccino',
    description: '温暖咖啡色调主题',
    primaryColor: 'rgba(165, 140, 115, 1)',
    className: 'theme-cappuccino'
  }
]

const currentThemeName = computed(() => {
  return themes.find(theme => theme.id === currentTheme.value)?.name || 'Dark Lite'
})

const handleThemeChange = (themeId: string) => {
  const selectedTheme = themes.find(theme => theme.id === themeId)
  if (!selectedTheme) return

  // 移除当前主题类
  const currentThemeObj = themes.find(theme => theme.id === currentTheme.value)
  if (currentThemeObj) {
    document.documentElement.classList.remove(currentThemeObj.className)
  }

  // 应用新主题类
  document.documentElement.classList.add(selectedTheme.className)
  currentTheme.value = themeId

  // 保存到本地存储
  localStorage.setItem('lady-sion-theme', themeId)

  // 通知其他组件主题已更改
  window.dispatchEvent(new CustomEvent('theme-changed', { 
    detail: { themeId, theme: selectedTheme } 
  }))
}

// 初始化主题
const initTheme = () => {
  // 从本地存储读取主题设置
  const savedTheme = localStorage.getItem('lady-sion-theme') || 'dark-lite'
  const theme = themes.find(t => t.id === savedTheme) || themes[0]
  
  // 应用主题
  document.documentElement.classList.add(theme.className)
  currentTheme.value = theme.id
}

onMounted(() => {
  initTheme()
})

// 导出主题管理功能
defineExpose({
  currentTheme,
  themes,
  switchTheme: handleThemeChange
})
</script>

<style scoped>
.theme-switcher {
  position: relative;
}

.theme-trigger {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 120px;
  justify-content: space-between;
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-xs);
}

.theme-name {
  flex: 1;
  text-align: left;
  font-size: var(--text-xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.theme-dropdown :deep(.el-dropdown) {
  width: 100%;
}

.theme-menu {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-xl);
  backdrop-filter: blur(var(--blur-main));
  box-shadow: var(--shadow-xl);
  padding: var(--space-2);
  min-width: 280px;
}

.theme-item {
  padding: 0 !important;
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-1);
  transition: var(--transition-fast);
}

.theme-item:last-child {
  margin-bottom: 0;
}

.theme-item:hover {
  background: var(--glass-bg-light) !important;
}

.theme-item.is-active {
  background: rgba(var(--primary-rgb), 0.1) !important;
  border-color: var(--primary);
}

.theme-preview {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  width: 100%;
}

.theme-color-swatch {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-md);
  border: 2px solid var(--glass-border);
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}

.theme-info {
  flex: 1;
  min-width: 0;
}

.theme-title {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-1);
}

.theme-description {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  line-height: 1.3;
}

.theme-check {
  color: var(--primary);
  font-size: var(--text-sm);
  flex-shrink: 0;
}

/* ST风格增强效果 */
.theme-switcher :deep(.el-button) {
  background: var(--st-glass-bg);
  border-color: var(--st-glass-border);
  color: var(--text-primary);
  text-shadow: var(--text-shadow);
  backdrop-filter: blur(var(--blur-md));
}

.theme-switcher :deep(.el-button:hover) {
  background: var(--glass-bg-medium);
  border-color: var(--accent);
  box-shadow: 0 0 15px rgba(var(--accent-rgb), 0.3);
}

/* 主题预览动画 */
.theme-item {
  animation: fadeInDown var(--duration-fast) var(--easing-ease);
}

.theme-color-swatch {
  transition: var(--transition-fast);
}

.theme-item:hover .theme-color-swatch {
  transform: scale(1.1);
  box-shadow: var(--shadow-md);
}

/* 不同主题下的特殊样式 */
:global(.theme-azure) .theme-switcher :deep(.el-button:hover) {
  box-shadow: 0 0 15px rgba(111, 133, 253, 0.4);
}

:global(.theme-macaron) .theme-switcher :deep(.el-button:hover) {
  box-shadow: 0 0 15px rgba(229, 175, 162, 0.4);
}

:global(.theme-cappuccino) .theme-switcher :deep(.el-button:hover) {
  box-shadow: 0 0 15px rgba(165, 140, 115, 0.4);
}

/* 响应式适配 */
@media (max-width: 768px) {
  .theme-trigger {
    min-width: 120px;
  }
  
  .theme-menu {
    min-width: 240px;
  }
  
  .theme-preview {
    padding: var(--space-2) var(--space-3);
  }
}
</style> 