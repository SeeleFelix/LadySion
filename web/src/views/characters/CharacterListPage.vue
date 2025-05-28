<template>
  <div class="character-list-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1 class="page-title">角色管理</h1>
      <div class="page-actions">
        <el-button
          type="primary"
          @click="handleCreateCharacter"
          :loading="loading"
        >
          <el-icon><Plus /></el-icon>
          创建角色
        </el-button>
      </div>
    </div>

    <!-- 搜索和过滤 -->
    <div class="search-section">
      <el-input
        v-model="searchQuery"
        placeholder="搜索角色名称..."
        clearable
        @input="handleSearch"
        style="width: 300px"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-loading
        v-loading="true"
        text="加载中..."
        style="height: 200px"
      />
    </div>

    <!-- 角色列表 -->
    <div v-else-if="filteredCharacters.length" class="character-grid">
      <CharacterCard
        v-for="character in filteredCharacters"
        :key="character.id"
        :character="character"
        @chat="handleStartChat"
        @edit="handleEditCharacter"
      />
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <el-empty
        :image-size="120"
        description="暂无角色"
      >
        <el-button
          type="primary"
          @click="handleCreateCharacter"
        >
          创建第一个角色
        </el-button>
      </el-empty>
    </div>

    <!-- 分页 -->
    <div v-if="characterCount > pageSize" class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="characterCount"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElButton, ElInput, ElIcon, ElEmpty, ElPagination, ElLoading } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'

import CharacterCard from '@/components/business/CharacterCard.vue'
import { useCharacter } from '@/composables/useCharacter'
import { debounce } from '@/utils/common'
import type { Character } from '@/types'

const router = useRouter()

// 使用组合式API
const {
  characters,
  loading,
  error,
  characterCount,
  hasCharacters,
  loadCharacters
} = useCharacter()

// 本地状态
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

// 计算属性
const filteredCharacters = computed(() => {
  let filtered = characters.value

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(character =>
      character.name.toLowerCase().includes(query) ||
      character.description.toLowerCase().includes(query)
    )
  }

  // 分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filtered.slice(start, end)
})

// 防抖搜索
const handleSearch = debounce((value: string) => {
  searchQuery.value = value
  currentPage.value = 1
}, 300)

// 事件处理
const handleCreateCharacter = () => {
  router.push('/characters/create')
}

const handleEditCharacter = (character: Character) => {
  router.push(`/characters/${character.id}/edit`)
}

const handleStartChat = (character: Character) => {
  router.push({
    name: 'chat',
    params: { characterId: character.id }
  })
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

// 生命周期
onMounted(async () => {
  await loadCharacters()
})
</script>

<style scoped>
.character-list-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.page-actions {
  display: flex;
  gap: 12px;
}

.search-section {
  margin-bottom: 24px;
  display: flex;
  gap: 16px;
  align-items: center;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.character-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}

@media (max-width: 768px) {
  .character-list-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .character-grid {
    grid-template-columns: 1fr;
  }
}
</style> 