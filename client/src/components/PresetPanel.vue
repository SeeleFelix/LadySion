<template>
  <div class="preset-panel">
    <el-card class="preset-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <h2 class="panel-title">
            <i class="fas fa-cogs"></i>
            预设管理
          </h2>
          <div class="header-actions">
            <el-button 
              :icon="Refresh" 
              @click="handleInitialize"
              :loading="isLoading"
              size="small"
            >
              刷新全部
            </el-button>
          </div>
        </div>
      </template>

      <!-- 全局错误提示 -->
      <el-alert
        v-if="hasError"
        :title="error?.message || '操作失败'"
        type="error"
        :closable="true"
        show-icon
        @close="clearError"
        style="margin-bottom: 16px"
      />

      <!-- 初始化状态 -->
      <div v-if="!isInitialized && !isLoading" class="init-prompt">
        <el-empty 
          description="点击刷新按钮加载预设"
          :image-size="100"
        >
          <el-button type="primary" @click="handleInitialize">
            <i class="fas fa-play"></i>
            开始加载
          </el-button>
        </el-empty>
      </div>

      <!-- 预设选择器列表 -->
      <div v-else class="preset-list">
        <!-- 指令模式预设 -->
        <preset-selector
          title="指令模式"
          :presets="instructPresets"
          :selected-preset="selectedInstructPreset"
          :is-loading="isLoading"
          :has-error="hasError"
          :error="error"
          @select="handleSelectInstruct"
          @refresh="handleRefreshInstruct"
          @edit="handleEditPreset"
        >
          <template #preview="{ preset }">
            <div v-if="isInstructPreset(preset)" class="instruct-preview">
              <p><strong>停止序列:</strong> {{ preset.stopSequence || '无' }}</p>
              <p><strong>输入序列:</strong> {{ preset.inputSequence || '无' }}</p>
              <p><strong>输出序列:</strong> {{ preset.outputSequence || '无' }}</p>
              <p><strong>启用包装:</strong> {{ preset.wrap ? '是' : '否' }}</p>
            </div>
          </template>
        </preset-selector>

        <!-- 上下文模板预设 -->
        <preset-selector
          title="上下文模板"
          :presets="contextPresets"
          :selected-preset="selectedContextPreset"
          :is-loading="isLoading"
          :has-error="hasError"
          :error="error"
          @select="handleSelectContext"
          @refresh="handleRefreshContext"
          @edit="handleEditPreset"
        >
          <template #preview="{ preset }">
            <div v-if="isContextPreset(preset)" class="context-preview">
              <p><strong>内容:</strong> {{ getContentPreview(preset.content) }}</p>
              <p><strong>前缀:</strong> {{ preset.prefix || '无' }}</p>
              <p><strong>后缀:</strong> {{ preset.suffix || '无' }}</p>
              <p><strong>优先级:</strong> {{ preset.priority || '默认' }}</p>
            </div>
          </template>
        </preset-selector>

        <!-- 系统提示词预设 -->
        <preset-selector
          title="系统提示词"
          :presets="systemPromptPresets"
          :selected-preset="selectedSystemPromptPreset"
          :is-loading="isLoading"
          :has-error="hasError"
          :error="error"
          @select="handleSelectSystemPrompt"
          @refresh="handleRefreshSystemPrompt"
          @edit="handleEditPreset"
        >
          <template #preview="{ preset }">
            <div v-if="isSystemPromptPreset(preset)" class="sysprompt-preview">
              <p><strong>内容:</strong> {{ getContentPreview(preset.content) }}</p>
              <p><strong>状态:</strong> 
                <el-tag :type="preset.enabled ? 'success' : 'danger'" size="small">
                  {{ preset.enabled ? '启用' : '禁用' }}
                </el-tag>
              </p>
              <p><strong>分类:</strong> {{ preset.category || '未分类' }}</p>
            </div>
          </template>
        </preset-selector>

        <!-- 宏定义 -->
        <preset-selector
          title="宏定义"
          :presets="macroPresets"
          :selected-preset="selectedMacroPreset"
          :is-loading="isLoading"
          :has-error="hasError"
          :error="error"
          :show-edit-button="false"
          @select="handleSelectMacro"
          @refresh="handleRefreshMacros"
        >
          <template #preview="{ preset }">
            <div v-if="isMacroDescription(preset)" class="macro-preview">
              <p><strong>宏名称:</strong> {{ preset.name }}</p>
              <p><strong>示例:</strong> {{ preset.example || '无示例' }}</p>
            </div>
          </template>
        </preset-selector>
      </div>

      <!-- 状态统计 -->
      <div v-if="isInitialized" class="preset-stats">
        <el-card shadow="never" body-style="padding: 12px">
          <div class="stats-header">
            <i class="fas fa-chart-pie"></i>
            <span>预设统计</span>
          </div>
          <div class="stats-content">
            <div class="stat-item">
              <span class="stat-label">指令模式:</span>
              <el-tag type="info" size="small">{{ instructPresets.length }}</el-tag>
            </div>
            <div class="stat-item">
              <span class="stat-label">上下文模板:</span>
              <el-tag type="info" size="small">{{ contextPresets.length }}</el-tag>
            </div>
            <div class="stat-item">
              <span class="stat-label">系统提示词:</span>
              <el-tag type="info" size="small">{{ systemPromptPresets.length }}</el-tag>
            </div>
            <div class="stat-item">
              <span class="stat-label">宏定义:</span>
              <el-tag type="info" size="small">{{ macroPresets.length }}</el-tag>
            </div>
          </div>
        </el-card>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ElCard, ElButton, ElAlert, ElEmpty, ElTag } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';
import PresetSelector from './PresetSelector.vue';
import { usePresets } from '../composables/usePresets';
import type { 
  Preset, 
  InstructPreset, 
  ContextPreset, 
  SystemPromptPreset, 
  MacroDescription 
} from '../types/preset';

// 使用组合式函数
const {
  // 状态
  isLoading,
  hasError,
  isInitialized,
  error,
  presets,
  selectedPresets,
  
  // 操作
  loadPresets,
  selectPreset,
  getPresetsByType,
  getSelectedPreset,
  initialize,
  clearError,
} = usePresets();

// 类型守卫函数
const isInstructPreset = (preset: Preset): preset is InstructPreset => {
  return 'inputSequence' in preset && 'outputSequence' in preset;
};

const isContextPreset = (preset: Preset): preset is ContextPreset => {
  return 'content' in preset && typeof preset.content === 'string' && !('enabled' in preset);
};

const isSystemPromptPreset = (preset: Preset): preset is SystemPromptPreset => {
  return 'content' in preset && 'enabled' in preset;
};

const isMacroDescription = (preset: Preset): preset is MacroDescription => {
  return 'example' in preset || (!('content' in preset) && !('inputSequence' in preset));
};

// 辅助函数
const getContentPreview = (content: string): string => {
  if (!content) return '无内容';
  return content.length > 50 ? `${content.substring(0, 50)}...` : content;
};

// 计算属性 - 各类型预设
const instructPresets = computed(() => getPresetsByType('instruct'));
const contextPresets = computed(() => getPresetsByType('context'));
const systemPromptPresets = computed(() => getPresetsByType('sysprompt'));
const macroPresets = computed(() => getPresetsByType('macros'));

// 计算属性 - 选中的预设
const selectedInstructPreset = computed(() => getSelectedPreset('instruct'));
const selectedContextPreset = computed(() => getSelectedPreset('context'));
const selectedSystemPromptPreset = computed(() => getSelectedPreset('sysprompt'));
const selectedMacroPreset = computed(() => getSelectedPreset('macros'));

// 事件处理
const handleInitialize = async () => {
  try {
    await initialize();
  } catch (error) {
    console.error('初始化失败:', error);
  }
};

const handleSelectInstruct = async (name: string) => {
  try {
    await selectPreset('instruct', name);
  } catch (error) {
    console.error('选择指令预设失败:', error);
  }
};

const handleSelectContext = async (name: string) => {
  try {
    await selectPreset('context', name);
  } catch (error) {
    console.error('选择上下文预设失败:', error);
  }
};

const handleSelectSystemPrompt = async (name: string) => {
  try {
    await selectPreset('sysprompt', name);
  } catch (error) {
    console.error('选择系统提示词预设失败:', error);
  }
};

const handleSelectMacro = async (name: string) => {
  try {
    await selectPreset('macros', name);
  } catch (error) {
    console.error('选择宏失败:', error);
  }
};

const handleRefreshInstruct = async () => {
  try {
    await loadPresets('instruct');
  } catch (error) {
    console.error('刷新指令预设失败:', error);
  }
};

const handleRefreshContext = async () => {
  try {
    await loadPresets('context');
  } catch (error) {
    console.error('刷新上下文预设失败:', error);
  }
};

const handleRefreshSystemPrompt = async () => {
  try {
    await loadPresets('sysprompt');
  } catch (error) {
    console.error('刷新系统提示词预设失败:', error);
  }
};

const handleRefreshMacros = async () => {
  try {
    await loadPresets('macros');
  } catch (error) {
    console.error('刷新宏定义失败:', error);
  }
};

const handleEditPreset = (preset: Preset) => {
  console.log('编辑预设:', preset);
  // TODO: 打开预设编辑器
};
</script>

<style scoped>
.preset-panel {
  max-width: 600px;
  margin: 0 auto;
}

.preset-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-title {
  margin: 0;
  font-size: 18px;
  color: var(--el-text-color-primary);
}

.panel-title i {
  margin-right: 8px;
  color: var(--el-color-primary);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.init-prompt {
  text-align: center;
  padding: 32px 16px;
}

.preset-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.instruct-preview,
.context-preview,
.sysprompt-preview,
.macro-preview {
  font-size: 12px;
  line-height: 1.4;
}

.instruct-preview p,
.context-preview p,
.sysprompt-preview p,
.macro-preview p {
  margin: 4px 0;
  color: var(--el-text-color-regular);
}

.preset-stats {
  margin-top: 24px;
}

.stats-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.stats-header i {
  margin-right: 6px;
  color: var(--el-color-primary);
}

.stats-content {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

@media (max-width: 768px) {
  .preset-panel {
    max-width: 100%;
    margin: 0;
  }
  
  .stats-content {
    grid-template-columns: 1fr;
  }
}
</style> 