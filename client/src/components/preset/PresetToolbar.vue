<template>
  <div class="preset-toolbar">
    <!-- 预设类型切换 -->
    <div class="toolbar-section">
      <el-radio-group v-model="currentType" @change="handleTypeChange" size="small">
        <el-radio-button label="instruct">指令模式</el-radio-button>
        <el-radio-button label="context">上下文模板</el-radio-button>
        <el-radio-button label="systemPrompt">系统提示词</el-radio-button>
        <el-radio-button label="postHistoryInstructions">后历史指令</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 操作按钮 -->
    <div class="toolbar-section">
      <el-button 
        type="primary" 
        size="small" 
        @click="$emit('create')"
      >
        <el-icon><Plus /></el-icon>
        新建预设
      </el-button>
      
      <el-divider direction="vertical" />
      
      <el-button 
        size="small" 
        @click="$emit('refresh')"
        :loading="refreshing"
      >
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
      
      <el-dropdown @command="handleCommand" trigger="click">
        <el-button size="small">
          <el-icon><MoreFilled /></el-icon>
          更多
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="import">
              <el-icon><Upload /></el-icon>
              导入预设
            </el-dropdown-item>
            <el-dropdown-item command="export">
              <el-icon><Download /></el-icon>
              导出预设
            </el-dropdown-item>
            <el-dropdown-item command="backup" divided>
              <el-icon><DocumentCopy /></el-icon>
              备份数据
            </el-dropdown-item>
            <el-dropdown-item command="restore">
              <el-icon><RefreshLeft /></el-icon>
              恢复数据
            </el-dropdown-item>
            <el-dropdown-item command="settings" divided>
              <el-icon><Setting /></el-icon>
              设置
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 搜索和筛选 -->
    <div class="toolbar-section">
      <el-input
        v-model="searchText"
        placeholder="搜索预设..."
        size="small"
        clearable
        style="width: 200px"
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      
      <el-select
        v-model="sortBy"
        placeholder="排序方式"
        size="small"
        style="width: 120px; margin-left: 8px"
        @change="handleSort"
      >
        <el-option label="名称" value="name" />
        <el-option label="创建时间" value="createdAt" />
        <el-option label="修改时间" value="updatedAt" />
        <el-option label="优先级" value="priority" />
      </el-select>
      
      <el-button 
        size="small" 
        :type="sortOrder === 'desc' ? 'primary' : 'default'"
        @click="toggleSortOrder"
        style="margin-left: 4px"
      >
        <el-icon>
          <component :is="sortOrder === 'desc' ? SortDown : SortUp" />
        </el-icon>
      </el-button>
    </div>

    <!-- 筛选器 -->
    <div class="toolbar-section filter-section">
      <el-popover
        placement="bottom-start"
        :width="300"
        trigger="click"
        title="高级筛选"
      >
        <template #reference>
          <el-button size="small" :type="hasActiveFilters ? 'primary' : 'default'">
            <el-icon><Filter /></el-icon>
            筛选
            <el-badge 
              v-if="activeFilterCount > 0" 
              :value="activeFilterCount" 
              class="filter-badge"
            />
          </el-button>
        </template>
        
        <div class="filter-content">
          <el-form label-width="80px" size="small">
            <el-form-item label="状态">
              <el-checkbox-group v-model="filters.enabled">
                <el-checkbox label="enabled">已启用</el-checkbox>
                <el-checkbox label="disabled">已禁用</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            
            <el-form-item label="优先级">
              <el-slider 
                v-model="filters.priorityRange" 
                range 
                :min="0" 
                :max="100"
                show-stops
              />
            </el-form-item>
            
            <el-form-item label="模型">
              <el-select 
                v-model="filters.models" 
                multiple 
                placeholder="选择模型"
                style="width: 100%"
              >
                <el-option label="ChatGPT" value="gpt" />
                <el-option label="Claude" value="claude" />
                <el-option label="Llama" value="llama" />
                <el-option label="Vicuna" value="vicuna" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="创建时间">
              <el-date-picker
                v-model="filters.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                size="small"
                style="width: 100%"
              />
            </el-form-item>
          </el-form>
          
          <div class="filter-actions">
            <el-button size="small" @click="clearFilters">
              <el-icon><Close /></el-icon>
              清除
            </el-button>
            <el-button size="small" type="primary" @click="applyFilters">
              <el-icon><Check /></el-icon>
              应用
            </el-button>
          </div>
        </div>
      </el-popover>
    </div>

    <!-- 视图模式切换 -->
    <div class="toolbar-section">
      <el-radio-group v-model="viewMode" @change="handleViewModeChange" size="small">
        <el-radio-button label="list">
          <el-icon><List /></el-icon>
        </el-radio-button>
        <el-radio-button label="grid">
          <el-icon><Grid /></el-icon>
        </el-radio-button>
      </el-radio-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Plus, Refresh, MoreFilled, Search, Filter, 
  Upload, Download, DocumentCopy, RefreshLeft, Setting,
  SortDown, SortUp, Close, Check, List, Grid
} from '@element-plus/icons-vue'

interface Props {
  refreshing?: boolean
}

interface Emits {
  (e: 'create'): void
  (e: 'refresh'): void
  (e: 'type-change', type: string): void
  (e: 'search', text: string): void
  (e: 'sort', sortBy: string, sortOrder: string): void
  (e: 'filter', filters: any): void
  (e: 'view-mode-change', mode: string): void
  (e: 'command', command: string): void
}

const props = withDefaults(defineProps<Props>(), {
  refreshing: false
})

const emit = defineEmits<Emits>()

// 响应式数据
const currentType = ref('instruct')
const searchText = ref('')
const sortBy = ref('updatedAt')
const sortOrder = ref('desc')
const viewMode = ref('list')

// 筛选器
const filters = ref({
  enabled: [],
  priorityRange: [0, 100],
  models: [],
  dateRange: null
})

// 计算属性
const hasActiveFilters = computed(() => {
  return filters.value.enabled.length > 0 ||
    filters.value.priorityRange[0] > 0 ||
    filters.value.priorityRange[1] < 100 ||
    filters.value.models.length > 0 ||
    filters.value.dateRange !== null
})

const activeFilterCount = computed(() => {
  let count = 0
  if (filters.value.enabled.length > 0) count++
  if (filters.value.priorityRange[0] > 0 || filters.value.priorityRange[1] < 100) count++
  if (filters.value.models.length > 0) count++
  if (filters.value.dateRange !== null) count++
  return count
})

// 方法
const handleTypeChange = (type: string) => {
  emit('type-change', type)
}

const handleSearch = (text: string) => {
  emit('search', text)
}

const handleSort = () => {
  emit('sort', sortBy.value, sortOrder.value)
}

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  handleSort()
}

const handleViewModeChange = (mode: string) => {
  emit('view-mode-change', mode)
}

const handleCommand = (command: string) => {
  emit('command', command)
}

const clearFilters = () => {
  filters.value = {
    enabled: [],
    priorityRange: [0, 100],
    models: [],
    dateRange: null
  }
}

const applyFilters = () => {
  emit('filter', { ...filters.value })
}
</script>

<style scoped>
.preset-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  flex-wrap: wrap;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-section {
  position: relative;
}

.filter-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  z-index: 1;
}

.filter-content {
  padding: 8px 0;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

:deep(.el-radio-group) {
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 2px;
}

:deep(.el-radio-button__inner) {
  border: none;
  background-color: transparent;
  box-shadow: none;
}

:deep(.el-radio-button__inner:hover) {
  color: #409eff;
  background-color: rgba(64, 158, 255, 0.1);
}

:deep(.el-radio-button.is-active .el-radio-button__inner) {
  background-color: #409eff;
  color: #fff;
  box-shadow: none;
}

:deep(.el-badge__content) {
  height: 16px;
  line-height: 16px;
  padding: 0 4px;
  font-size: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .preset-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .toolbar-section {
    justify-content: center;
  }
  
  .toolbar-section:first-child {
    justify-content: flex-start;
  }
}
</style> 