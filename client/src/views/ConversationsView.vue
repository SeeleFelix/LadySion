<template>
  <div class="conversations-view">
    <h1>对话列表</h1>
    <el-card>
      <div class="conversations-toolbar">
        <el-input
          v-model="searchQuery"
          placeholder="搜索对话..."
          clearable
          style="width: 300px;"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <el-empty v-if="!conversations.length" description="暂无对话记录">
        <el-button type="primary" @click="startNewConversation">开始新的对话</el-button>
      </el-empty>

      <el-table v-else :data="conversations" style="width: 100%">
        <el-table-column label="角色" width="100">
          <template #default="scope">
            <el-avatar :src="scope.row.character.avatar" :alt="scope.row.character.name"></el-avatar>
          </template>
        </el-table-column>
        <el-table-column prop="character.name" label="名称" width="150" />
        <el-table-column label="最后一条消息" min-width="200">
          <template #default="scope">
            <div class="last-message">{{ scope.row.lastMessage }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="最后更新时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.updatedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button-group>
              <el-button 
                type="primary" 
                size="small" 
                @click="continueConversation(scope.row.id)"
              >
                继续
              </el-button>
              <el-button 
                type="danger" 
                size="small" 
                @click="deleteConversation(scope.row.id)"
              >
                删除
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Search } from '@element-plus/icons-vue';

const router = useRouter();
const searchQuery = ref('');

// 临时数据
interface Character {
  id: string;
  name: string;
  avatar: string;
}

interface Conversation {
  id: string;
  character: Character;
  lastMessage: string;
  updatedAt: string;
}

const conversations = ref<Conversation[]>([
  {
    id: '1',
    character: {
      id: '1',
      name: '小红',
      avatar: 'https://placekitten.com/100/100'
    },
    lastMessage: '今天天气真好！',
    updatedAt: '2023-06-15T14:30:00'
  },
  {
    id: '2',
    character: {
      id: '2',
      name: '小明',
      avatar: 'https://placekitten.com/100/101'
    },
    lastMessage: '你好，有什么我可以帮你的吗？',
    updatedAt: '2023-06-14T09:15:00'
  }
]);

// 格式化日期
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN');
}

// 开始新的对话
function startNewConversation() {
  // 跳转到角色选择页面或直接创建新对话
  router.push('/characters');
}

// 继续对话
function continueConversation(id: string) {
  router.push(`/conversation/${id}`);
}

// 删除对话
function deleteConversation(id: string) {
  // 实现删除逻辑
  conversations.value = conversations.value.filter(conv => conv.id !== id);
}
</script>

<style scoped>
.conversations-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  margin-bottom: 20px;
  text-align: center;
}

.conversations-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.last-message {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
  color: #606266;
}
</style> 