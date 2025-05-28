<template>
  <el-card class="character-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span class="character-name">{{ character.name }}</span>
        <div class="card-actions">
          <el-button 
            type="primary" 
            size="small" 
            @click="handleChat"
          >
            聊天
          </el-button>
          <el-button 
            type="info" 
            size="small" 
            @click="handleEdit"
          >
            编辑
          </el-button>
          <el-button 
            type="danger" 
            size="small" 
            @click="handleDelete"
          >
            删除
          </el-button>
        </div>
      </div>
    </template>

    <div class="character-content">
      <div class="character-avatar" v-if="character.avatar">
        <el-avatar :src="character.avatar" :size="60" />
      </div>
      
      <div class="character-info">
        <p class="character-description">
          {{ truncateText(character.description, 100) }}
        </p>
        
        <div class="character-meta">
          <span class="create-time">
            创建于 {{ formatRelativeTime(character.createdAt) }}
          </span>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ElCard, ElButton, ElAvatar, ElMessageBox } from 'element-plus'
import { useCharacter } from '@/composables/useCharacter'
import { formatRelativeTime, truncateText } from '@/utils/format'
import type { Character } from '@/types'

// 组件属性
interface Props {
  character: Character
}

const props = defineProps<Props>()

// 组件事件
interface Emits {
  chat: [character: Character]
  edit: [character: Character]
}

const emit = defineEmits<Emits>()

// 使用组合式API
const { deleteCharacter } = useCharacter()

// 事件处理
const handleChat = () => {
  emit('chat', props.character)
}

const handleEdit = () => {
  emit('edit', props.character)
}

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除角色 "${props.character.name}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    await deleteCharacter(props.character.id)
  } catch (error) {
    // 用户取消删除或删除失败
    console.log('删除取消或失败:', error)
  }
}
</script>

<style scoped>
.character-card {
  margin-bottom: 16px;
  transition: transform 0.2s ease;
}

.character-card:hover {
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.character-name {
  font-weight: 600;
  font-size: 16px;
  color: var(--el-text-color-primary);
}

.card-actions {
  display: flex;
  gap: 8px;
}

.character-content {
  display: flex;
  gap: 16px;
}

.character-avatar {
  flex-shrink: 0;
}

.character-info {
  flex: 1;
  min-width: 0;
}

.character-description {
  margin: 0 0 12px 0;
  color: var(--el-text-color-regular);
  line-height: 1.5;
}

.character-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.create-time {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style> 