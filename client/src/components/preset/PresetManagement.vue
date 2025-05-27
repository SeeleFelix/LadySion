<template>
  <div class="preset-management">
    <!-- 标题区域 -->
    <div class="preset-header">
      <h2 class="preset-title">预设管理</h2>
      <div class="preset-actions">
        <button 
          class="btn btn-sm btn-ghost"
          @click="refreshPresets"
          :disabled="loading"
          title="刷新预设"
        >
          <i class="fa-solid fa-refresh" :class="{ 'fa-spin': loading }"></i>
        </button>
        <button 
          class="btn btn-sm btn-primary"
          @click="saveCurrentConfig"
          :disabled="loading"
        >
          <i class="fa-solid fa-save"></i>
          保存配置
        </button>
      </div>
    </div>

    <!-- 预设类型选择 -->
    <div class="preset-tabs">
      <button 
        v-for="type in presetTypes" 
        :key="type.key"
        class="btn btn-sm"
        :class="activeTab === type.key ? 'btn-primary' : 'btn-secondary'"
        @click="activeTab = type.key"
      >
        <i :class="type.icon"></i>
        {{ type.label }}
      </button>
    </div>

    <!-- 预设列表 -->
    <div class="preset-list custom-scrollbar">
      <div 
        v-for="preset in currentPresets" 
        :key="preset.name"
        class="preset-item"
        :class="{ active: preset.name === selectedPreset?.name }"
        @click="selectPreset(preset)"
      >
        <div class="preset-info">
          <h4 class="preset-name">{{ preset.name }}</h4>
          <p class="preset-description">{{ preset.description || '没有描述' }}</p>
        </div>
        <div class="preset-actions">
          <button 
            class="btn btn-icon btn-sm btn-ghost"
            @click.stop="editPreset(preset)"
            title="编辑"
          >
            <i class="fa-solid fa-edit"></i>
          </button>
          <button 
            class="btn btn-icon btn-sm btn-ghost"
            @click.stop="deletePreset(preset)"
            title="删除"
            :disabled="preset.isDefault"
          >
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="currentPresets.length === 0" class="empty-state">
        <div class="card">
          <div class="card-body text-center">
            <i class="fa-solid fa-inbox" style="font-size: 2rem; margin-bottom: var(--space-4); opacity: 0.5; color: var(--text-muted);"></i>
            <p style="margin: 0; color: var(--text-secondary);">没有找到{{ activeTabLabel }}预设</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 当前配置显示 -->
    <div v-if="selectedPreset" class="current-config">
      <div class="config-header">
        <h3>{{ selectedPreset.name }}</h3>
        <div class="badge badge-primary">{{ activeTabLabel }}</div>
      </div>
      <div class="config-content custom-scrollbar">
        <pre class="config-text">{{ JSON.stringify(selectedPreset.content, null, 2) }}</pre>
      </div>
      <div class="config-actions">
        <button 
          class="btn btn-primary"
          @click="applyPreset"
          :disabled="loading"
        >
          <i class="fa-solid fa-check"></i>
          应用此预设
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">
        <i class="fa-solid fa-spinner fa-spin"></i>
        <p>加载中...</p>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-message">
      <div class="card">
        <div class="card-body">
          <div style="display: flex; align-items: center; gap: var(--space-3); color: var(--error-color);">
            <i class="fa-solid fa-exclamation-triangle"></i>
            <span>{{ error }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePresetStore } from '../../store/presetStore'
import type { Preset, PresetType } from '../../types/preset'

// 状态管理
const presetStore = usePresetStore()
const loading = ref(false)
const error = ref<string | null>(null)
const activeTab = ref<PresetType>('instruct')
const selectedPreset = ref<Preset | null>(null)

// 预设类型配置
const presetTypes = [
  { key: 'instruct' as PresetType, label: '指令', icon: 'fa-solid fa-terminal' },
  { key: 'context' as PresetType, label: '上下文', icon: 'fa-solid fa-comments' },
  { key: 'sysprompt' as PresetType, label: '系统提示', icon: 'fa-solid fa-robot' },
  { key: 'macros' as PresetType, label: '宏', icon: 'fa-solid fa-magic' }
]

// 计算属性
const currentPresets = computed(() => {
  return presetStore.getPresetsByType(activeTab.value)
})

const activeTabLabel = computed(() => {
  return presetTypes.find(type => type.key === activeTab.value)?.label || ''
})

// 方法
const loadPresets = async () => {
  loading.value = true
  error.value = null
  try {
    await presetStore.loadPresets(activeTab.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载预设失败'
    console.error('加载预设失败:', err)
  } finally {
    loading.value = false
  }
}

const refreshPresets = async () => {
  await loadPresets()
}

const selectPreset = (preset: Preset) => {
  selectedPreset.value = preset
}

const applyPreset = async () => {
  if (!selectedPreset.value) return
  
  loading.value = true
  try {
    await presetStore.selectPreset(activeTab.value, selectedPreset.value.name)
    // 这里可以添加成功提示
  } catch (err) {
    error.value = err instanceof Error ? err.message : '应用预设失败'
    console.error('应用预设失败:', err)
  } finally {
    loading.value = false
  }
}

const saveCurrentConfig = async () => {
  loading.value = true
  try {
    await presetStore.updateConfig(activeTab.value, {})
    // 这里可以添加成功提示
  } catch (err) {
    error.value = err instanceof Error ? err.message : '保存配置失败'
    console.error('保存配置失败:', err)
  } finally {
    loading.value = false
  }
}

const editPreset = (preset: Preset) => {
  // TODO: 实现预设编辑功能
  console.log('编辑预设:', preset.name)
}

const deletePreset = async (preset: Preset) => {
  if (preset.isDefault) return
  
  if (confirm(`确定要删除预设 "${preset.name}" 吗？`)) {
    loading.value = true
    try {
      await presetStore.deletePreset(activeTab.value, preset.name)
      if (selectedPreset.value?.name === preset.name) {
        selectedPreset.value = null
      }
      await loadPresets()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除预设失败'
      console.error('删除预设失败:', err)
    } finally {
      loading.value = false
    }
  }
}

// 监听标签切换
const watchActiveTab = async (newTab: PresetType) => {
  selectedPreset.value = null
  await loadPresets()
}

// 生命周期
onMounted(() => {
  loadPresets()
})

// 监听器
import { watch } from 'vue'
watch(activeTab, watchActiveTab)
</script>

<style scoped>
.preset-management {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: var(--space-4);
}

/* 头部区域 */
.preset-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.preset-title {
  color: var(--text-primary);
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.preset-actions {
  display: flex;
  gap: var(--space-2);
}

/* 标签切换 */
.preset-tabs {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-2);
  background: var(--glass-bg-dark);
  border-radius: var(--radius-lg);
  border: 1px solid var(--glass-border);
}

/* 预设列表 */
.preset-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  overflow-y: auto;
  max-height: 300px;
  padding: var(--space-2);
}

.preset-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background: var(--glass-bg-medium);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.preset-item:hover {
  background: var(--glass-bg-dark);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.preset-item.active {
  background: rgba(var(--primary-rgb), 0.2);
  border-color: var(--primary-color);
}

.preset-info {
  flex: 1;
  min-width: 0;
}

.preset-name {
  color: var(--text-primary);
  margin: 0 0 var(--space-1) 0;
  font-size: 0.95rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preset-description {
  color: var(--text-muted);
  margin: 0;
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preset-item .preset-actions {
  display: flex;
  gap: var(--space-1);
  margin-left: var(--space-3);
}

/* 当前配置 */
.current-config {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.config-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4);
  background: var(--glass-bg-dark);
  border-bottom: 1px solid var(--glass-border);
}

.config-header h3 {
  color: var(--text-primary);
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
}

.config-content {
  padding: var(--space-4);
  max-height: 200px;
  overflow-y: auto;
}

.config-text {
  background: var(--glass-bg-dark);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  color: var(--text-secondary);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.8rem;
  line-height: 1.4;
  white-space: pre-wrap;
  overflow-x: auto;
  margin: 0;
}

.config-actions {
  padding: var(--space-4);
  border-top: 1px solid var(--glass-border);
  background: var(--glass-bg-dark);
}

/* 空状态 */
.empty-state {
  padding: var(--space-6);
}

/* 加载状态 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.loading-spinner {
  text-align: center;
  color: var(--text-primary);
}

.loading-spinner i {
  font-size: 2rem;
  margin-bottom: var(--space-3);
  color: var(--primary-color);
}

.loading-spinner p {
  margin: 0;
  color: var(--text-secondary);
}

/* 错误消息 */
.error-message {
  margin-top: var(--space-4);
}

.text-center {
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .preset-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
  }
  
  .preset-tabs {
    flex-wrap: wrap;
  }
  
  .preset-item {
    padding: var(--space-3);
  }
  
  .preset-name {
    font-size: 0.9rem;
  }
  
  .preset-description {
    font-size: 0.75rem;
  }
}
</style> 