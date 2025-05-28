<template>
  <el-button
    :type="type"
    :size="size"
    :loading="loading"
    :disabled="disabled"
    :icon="icon"
    :circle="circle"
    :round="round"
    :plain="plain"
    @click="handleClick"
    :class="buttonClass"
  >
    <slot />
  </el-button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElButton } from 'element-plus'

// 组件属性
interface Props {
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'
  size?: 'large' | 'default' | 'small'
  loading?: boolean
  disabled?: boolean
  icon?: string
  circle?: boolean
  round?: boolean
  plain?: boolean
  variant?: 'solid' | 'outline' | 'ghost'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'default',
  size: 'default',
  loading: false,
  disabled: false,
  circle: false,
  round: false,
  plain: false,
  variant: 'solid'
})

// 组件事件
interface Emits {
  click: [event: MouseEvent]
}

const emit = defineEmits<Emits>()

// 计算属性
const buttonClass = computed(() => {
  return [
    'base-button',
    `base-button--${props.variant}`
  ]
})

// 事件处理
const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<style scoped>
.base-button {
  transition: all 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
  font-weight: 500;
}

.base-button--outline {
  border: 1px solid var(--el-border-color);
  background: transparent;
}

.base-button--ghost {
  border: none;
  background: transparent;
  box-shadow: none;
}

.base-button:hover {
  transform: translateY(-1px);
}

.base-button:active {
  transform: translateY(0);
}
</style> 