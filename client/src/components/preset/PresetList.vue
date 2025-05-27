<template>
  <div class="preset-list">
    <div class="list-header">
      <el-input
        v-model="searchText"
        placeholder="搜索预设..."
        size="small"
        clearable
        class="search-input"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <div class="list-content" v-loading="loading">
      <div class="preset-items">
        <div
          v-for="preset in filteredPresets"
          :key="preset.id"
          class="preset-item"
          :class="{ active: selectedPresetId === preset.id }"
          @click="selectPreset(preset)"
        >
          <div class="preset-main">
            <div class="preset-name">{{ preset.name }}</div>
            <div class="preset-description" v-if="preset.description">
              {{ preset.description }}
            </div>
            <div class="preset-meta">
              <span class="preset-date">
                {{ formatDate(preset.updatedAt) }}
              </span>
            </div>
          </div>
          
          <div class="preset-actions">
            <el-dropdown @command="handleCommand" trigger="click">
              <el-button type="text" size="small" class="action-button">
                <el-icon><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="{ action: 'edit', preset }">
                    <el-icon><Edit /></el-icon>
                    编辑
                  </el-dropdown-item>
                  <el-dropdown-item :command="{ action: 'duplicate', preset }">
                    <el-icon><CopyDocument /></el-icon>
                    复制
                  </el-dropdown-item>
                  <el-dropdown-item :command="{ action: 'export', preset }">
                    <el-icon><Download /></el-icon>
                    导出
                  </el-dropdown-item>
                  <el-dropdown-item 
                    :command="{ action: 'delete', preset }"
                    divided
                    class="danger-item"
                  >
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredPresets.length === 0 && !loading" class="empty-list">
        <el-empty description="暂无预设" size="small">
          <template #image>
            <el-icon size="48" color="#c0c4cc"><Document /></el-icon>
          </template>
        </el-empty>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Search, MoreFilled, Edit, CopyDocument, Download, Delete, Document } from '@element-plus/icons-vue'

interface Preset {
  id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
  [key: string]: any
}

interface Props {
  presets: Preset[]
  loading?: boolean
  selectedPresetId?: string
}

interface Emits {
  (e: 'select', preset: Preset): void
  (e: 'delete', preset: Preset): void
  (e: 'duplicate', preset: Preset): void
  (e: 'export', preset: Preset): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  selectedPresetId: ''
})

const emit = defineEmits<Emits>()

// 响应式数据
const searchText = ref('')

// 计算属性
const filteredPresets = computed(() => {
  if (!searchText.value) {
    return props.presets
  }
  
  const query = searchText.value.toLowerCase()
  return props.presets.filter(preset => 
    preset.name.toLowerCase().includes(query) ||
    (preset.description && preset.description.toLowerCase().includes(query))
  )
})

// 方法
const selectPreset = (preset: Preset) => {
  emit('select', preset)
}

const handleCommand = (command: { action: string; preset: Preset }) => {
  const { action, preset } = command
  
  switch (action) {
    case 'edit':
      selectPreset(preset)
      break
    case 'duplicate':
      emit('duplicate', preset)
      break
    case 'export':
      emit('export', preset)
      break
    case 'delete':
      emit('delete', preset)
      break
  }
}

const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}
</script>

<style scoped>
.preset-list {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.list-header {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.search-input {
  width: 100%;
}

.list-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.preset-items {
  flex: 1;
  overflow-y: auto;
}

.preset-item {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
}

.preset-item:hover {
  background-color: #f8f9fa;
}

.preset-item.active {
  background-color: #e6f7ff;
  border-left: 3px solid #1890ff;
}

.preset-main {
  flex: 1;
  min-width: 0;
}

.preset-name {
  font-weight: 500;
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
  word-break: break-word;
}

.preset-description {
  font-size: 12px;
  color: #606266;
  line-height: 1.4;
  margin-bottom: 6px;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.preset-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preset-date {
  font-size: 11px;
  color: #909399;
}

.preset-actions {
  margin-left: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.preset-item:hover .preset-actions {
  opacity: 1;
}

.action-button {
  padding: 4px !important;
  min-height: auto !important;
}

.empty-list {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

:deep(.danger-item) {
  color: #f56c6c !important;
}

:deep(.danger-item:hover) {
  background-color: #fef0f0 !important;
}

/* 滚动条样式 */
.preset-items::-webkit-scrollbar {
  width: 6px;
}

.preset-items::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.preset-items::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.preset-items::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style> 