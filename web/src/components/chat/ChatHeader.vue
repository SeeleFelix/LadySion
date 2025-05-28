<template>
  <header class="chat-header">
    <div v-if="character" class="character-info">
      <div class="avatar" v-if="character.avatar">
        <img :src="character.avatar" :alt="character.name">
      </div>
      <div class="avatar placeholder" v-else>
        {{ character.name.charAt(0) }}
      </div>
      <h2 class="name">{{ character.name }}</h2>
    </div>
    <h1 v-else class="app-title">{{ title || '简易聊天' }}</h1>
  </header>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

interface Character {
  id: string;
  name: string;
  avatar?: string;
}

const props = defineProps<{
  character?: Character;
  title?: string;
}>();
</script>

<style scoped>
.chat-header {
  padding: 16px;
  background-color: #1890ff;
  color: white;
  text-align: center;
}

.app-title {
  margin: 0;
  font-size: 1.5rem;
}

.character-info {
  display: flex;
  align-items: center;
  justify-content: center;
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
  background-color: white;
  color: #1890ff;
  font-size: 1.2rem;
  font-weight: bold;
}

.name {
  margin: 0;
  font-size: 1.2rem;
}
</style> 