<template>
  <div class="character-list">
    <h2 class="title">角色列表</h2>
    
    <div v-if="loading" class="loading">
      正在加载角色...
    </div>
    
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
    
    <div v-else-if="characters.length === 0" class="empty">
      暂无角色
    </div>
    
    <ul v-else class="list">
      <li 
        v-for="character in characters" 
        :key="character.id" 
        class="character-item"
        :class="{ active: currentCharacter?.id === character.id }"
        @click="selectCharacter(character)"
      >
        <div class="avatar" v-if="character.avatar">
          <img :src="character.avatar" :alt="character.name">
        </div>
        <div class="avatar placeholder" v-else>
          {{ character.name.charAt(0) }}
        </div>
        <div class="info">
          <h3 class="name">{{ character.name }}</h3>
          <p class="description">{{ character.description }}</p>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useCharacterStore } from '@/store';
import type { Character } from '@/types/api';

const characterStore = useCharacterStore();

const { 
  characters, 
  currentCharacter, 
  loading, 
  error, 
  fetchCharacters, 
  selectCharacter
} = characterStore;

onMounted(async () => {
  await fetchCharacters();
});
</script>

<style scoped>
.character-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
}

.title {
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 1.5rem;
}

.loading, .error, .empty {
  margin: 16px 0;
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
}

.character-item {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.character-item:hover {
  background-color: #f5f5f5;
}

.character-item.active {
  background-color: #e6f7ff;
  border-left: 3px solid #1890ff;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
  overflow: hidden;
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
}

.name {
  margin: 0 0 4px 0;
  font-size: 1rem;
}

.description {
  margin: 0;
  font-size: 0.8rem;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style> 