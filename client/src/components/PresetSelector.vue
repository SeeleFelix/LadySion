<template>
  <div class="preset-selector">
    <div class="preset-header">
      <h3 class="preset-title">{{ title }}</h3>
      <el-button 
        v-if="showRefresh"
        :icon="Refresh" 
        size="small" 
        @click="handleRefresh"
        :loading="isLoading"
      />
    </div>
    
    <el-select
      v-model="selectedValue"
      :placeholder="`选择${title}`"
      :loading="isLoading"
      :disabled="!hasPresets"
      filterable
      clearable
      @change="handleSelect"
      style="width: 100%"
    >
      <el-option
        v-for="preset in presets"
        :key="preset.id"
        :label="preset.name"
        :value="preset.name"
      >
        <div class="preset-option">
          <span class="preset-name">{{ preset.name }}</span>
          <el-tag v-if="preset.isDefault" size="small" type="success">默认</el-tag>
        </div>
        <div v-if="preset.description" class="preset-description">
          {{ preset.description }}
        </div>
      </el-option>
    </el-select>
    
    <div v-if="hasError" class="preset-error">
      <el-alert
        :title="error?.message || '加载失败'"
        type="error"
        :closable="false"
        show-icon
      />
    </div>
    
    <div v-if="selectedPreset" class="preset-preview">
      <el-card shadow="never" body-style="padding: 12px">
        <div class="preview-header">
          <span class="preview-title">当前配置</span>
          <el-button 
            v-if="showEditButton"
            :icon="Edit" 
            size="small" 
            text 
            @click="$emit('edit', selectedPreset)"
          >
            编辑
          </el-button>
        </div>
        <div class="preview-content">
          <slot name="preview" :preset="selectedPreset">
            <p class="preview-description">{{ selectedPreset.description || '无描述' }}</p>
          </slot>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ElSelect, ElOption, ElButton, ElTag, ElAlert, ElCard } from 'element-plus';
import { Refresh, Edit } from '@element-plus/icons-vue';
import type { Preset } from '../types/preset';
import type { AppError } from '../store';

interface Props {
  title: string;
  presets: Preset[];
  selectedPreset: Preset | null;
  isLoading?: boolean;
  hasError?: boolean;
  error?: AppError | null;
  showRefresh?: boolean;
  showEditButton?: boolean;
}

interface Emits {
  (e: 'select', name: string): void;
  (e: 'refresh'): void;
  (e: 'edit', preset: Preset): void;
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  hasError: false,
  error: null,
  showRefresh: true,
  showEditButton: true,
});

const emit = defineEmits<Emits>();

// 本地状态
const selectedValue = ref<string | null>(null);

// 计算属性
const hasPresets = computed(() => props.presets.length > 0);

// 监听选中的预设变化
watch(
  () => props.selectedPreset,
  (newPreset) => {
    selectedValue.value = newPreset?.name || null;
  },
  { immediate: true }
);

// 事件处理
const handleSelect = (name: string | null) => {
  if (name) {
    emit('select', name);
  }
};

const handleRefresh = () => {
  emit('refresh');
};
</script>

<style scoped>
.preset-selector {
  margin-bottom: 16px;
}

.preset-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.preset-title {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.preset-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.preset-name {
  flex: 1;
  font-weight: 500;
}

.preset-description {
  font-size: 12px;
  color: var(--el-text-color-regular);
  margin-top: 4px;
  line-height: 1.2;
}

.preset-error {
  margin-top: 8px;
}

.preset-preview {
  margin-top: 12px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.preview-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.preview-content {
  font-size: 12px;
}

.preview-description {
  margin: 0;
  color: var(--el-text-color-regular);
  line-height: 1.4;
}
</style> 