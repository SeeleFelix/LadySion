<template>
  <div class="preset-management">
    <PresetPanel />
  </div>
</template>

<script setup lang="ts">
import PresetPanel from './PresetPanel.vue';
</script>

<style scoped>
.preset-management {
  padding: var(--space-4);
  height: 100%;
  overflow-y: auto;
}

/* 适配SillyTavern风格 */
.preset-management :deep(.preset-card) {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(var(--glass-blur));
}

.preset-management :deep(.el-card) {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(var(--glass-blur));
}

.preset-management :deep(.el-select) {
  width: 100%;
}

.preset-management :deep(.el-button) {
  background: var(--btn-bg);
  border: 1px solid var(--btn-border);
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.preset-management :deep(.el-button:hover) {
  background: var(--btn-hover-bg);
  border-color: var(--btn-hover-border);
}

.preset-management :deep(.el-button--primary) {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.preset-management :deep(.el-alert) {
  background: var(--glass-bg);
  border: 1px solid var(--error-color);
  backdrop-filter: blur(var(--glass-blur));
}

.preset-management :deep(.el-tag) {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(var(--glass-blur));
}
</style> 