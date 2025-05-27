<template>
  <div class="characters-view">
    <h1>角色管理</h1>
    <el-card>
      <div class="characters-toolbar">
        <el-button type="primary" size="small">创建角色</el-button>
        <el-input
          v-model="searchQuery"
          placeholder="搜索角色..."
          clearable
          style="width: 300px;"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <el-empty v-if="!characters.length" description="暂无角色数据">
        <el-button type="primary">创建第一个角色</el-button>
      </el-empty>

      <el-table v-else :data="characters" style="width: 100%">
        <el-table-column label="头像" width="100">
          <template #default="scope">
            <el-avatar :src="scope.row.avatar" :alt="scope.row.name"></el-avatar>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" width="150" />
        <el-table-column prop="description" label="描述" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button-group>
              <el-button type="primary" size="small">对话</el-button>
              <el-button type="warning" size="small">编辑</el-button>
              <el-button type="danger" size="small">删除</el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Search } from '@element-plus/icons-vue';

// 临时数据
interface Character {
  id: string;
  name: string;
  description: string;
  avatar: string;
}

const searchQuery = ref('');
const characters = ref<Character[]>([
  {
    id: '1',
    name: '小红',
    description: '一个活泼开朗的女孩',
    avatar: 'https://placekitten.com/100/100'
  },
  {
    id: '2',
    name: '小明',
    description: '一个聪明的男孩',
    avatar: 'https://placekitten.com/100/101'
  }
]);
</script>

<style scoped>
.characters-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  margin-bottom: 20px;
  text-align: center;
}

.characters-toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}
</style> 