<template>
  <div class="conversation-list">
    <div class="header">
      <h2 class="title">对话列表</h2>
      <button class="new-btn" @click="createNewConversation">
        <span class="icon">+</span> 新对话
      </button>
    </div>
    
    <div v-if="loading" class="loading">
      正在加载对话...
    </div>
    
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
    
    <div v-else-if="conversations.length === 0" class="empty">
      暂无对话，点击"新对话"开始聊天
    </div>
    
    <ul v-else class="list">
      <li 
        v-for="conversation in conversations" 
        :key="conversation.id" 
        class="conversation-item"
        :class="{ active: currentConversation?.id === conversation.id }"
        @click="selectConversation(conversation.id)"
      >
        <div class="avatar" v-if="conversation.character?.avatar">
          <img :src="conversation.character.avatar" :alt="conversation.character.name">
        </div>
        <div class="avatar placeholder" v-else-if="conversation.character">
          {{ conversation.character.name.charAt(0) }}
        </div>
        <div class="avatar placeholder" v-else>
          ?
        </div>
        
        <div class="info">
          <h3 class="name">{{ conversation.character?.name || '未知角色' }}</h3>
          <p class="last-message">{{ getLastMessage(conversation) }}</p>
          <p class="timestamp">{{ formatDate(conversation.updatedAt) }}</p>
        </div>
        
        <button class="delete-btn" @click.stop="confirmDelete(conversation)">
          <span class="icon">×</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useConversationStore } from '@/store';
import type { Conversation } from '@/types/api';

const conversationStore = useConversationStore();
const { 
  conversations, 
  currentConversation, 
  loading, 
  error, 
  fetchConversations, 
  selectConversation,
  createConversation,
  deleteConversation
} = conversationStore;

const showDeleteConfirm = ref(false);
const conversationToDelete = ref<Conversation | null>(null);

onMounted(async () => {
  await fetchConversations();
});

const getLastMessage = (conversation: Conversation): string => {
  if (!conversation.messages || conversation.messages.length === 0) {
    return '暂无消息';
  }
  
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  return lastMessage.content.length > 30 
    ? lastMessage.content.substring(0, 30) + '...' 
    : lastMessage.content;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  
  // 今天的消息只显示时间
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  
  // 一周内的消息显示星期几
  const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff < 7) {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[date.getDay()];
  }
  
  // 其他消息显示完整日期
  return date.toLocaleDateString('zh-CN');
};

const createNewConversation = async () => {
  await createConversation();
};

const confirmDelete = (conversation: Conversation) => {
  if (confirm(`确定要删除与 ${conversation.character?.name || '未知角色'} 的对话吗？`)) {
    deleteConversation(conversation.id);
  }
};
</script>

<style scoped>
.conversation-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-right: 1px solid #e8e8e8;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.title {
  margin: 0;
  font-size: 1.5rem;
}

.new-btn {
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.new-btn .icon {
  margin-right: 4px;
  font-size: 1.2rem;
}

.loading, .error, .empty {
  margin: 16px;
  text-align: center;
}

.error {
  color: #ff4d4f;
}

.list {
  list-style: none;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  flex: 1;
}

.conversation-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  position: relative;
}

.conversation-item:hover {
  background-color: #f5f5f5;
}

.conversation-item.active {
  background-color: #e6f7ff;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1890ff;
  color: white;
  font-size: 1.2rem;
  font-weight: bold;
}

.info {
  flex: 1;
  min-width: 0;
}

.name {
  margin: 0 0 4px 0;
  font-size: 1rem;
  font-weight: 500;
}

.last-message {
  margin: 0 0 4px 0;
  font-size: 0.9rem;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.timestamp {
  margin: 0;
  font-size: 0.8rem;
  color: #999;
}

.delete-btn {
  background: none;
  border: none;
  color: #999;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  visibility: hidden;
}

.conversation-item:hover .delete-btn {
  visibility: visible;
}

.delete-btn:hover {
  background-color: #f0f0f0;
  color: #ff4d4f;
}
</style> 