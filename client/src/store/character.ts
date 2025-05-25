import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Character } from '@/types/api';
import { characterApi } from '@/api';

export const useCharacterStore = defineStore('character', () => {
  // 状态
  const characters = ref<Character[]>([]);
  const currentCharacter = ref<Character | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  // 获取所有角色
  async function fetchCharacters() {
    loading.value = true;
    error.value = null;
    
    try {
      characters.value = await characterApi.getAllCharacters();
    } catch (err) {
      console.error('获取角色失败:', err);
      error.value = '获取角色失败';
    } finally {
      loading.value = false;
    }
  }
  
  // 根据ID获取角色
  async function fetchCharacterById(id: string) {
    loading.value = true;
    error.value = null;
    
    try {
      currentCharacter.value = await characterApi.getCharacterById(id);
    } catch (err) {
      console.error('获取角色失败:', err);
      error.value = '获取角色失败';
    } finally {
      loading.value = false;
    }
  }
  
  // 创建角色
  async function createCharacter(character: Omit<Character, 'id'>) {
    loading.value = true;
    error.value = null;
    
    try {
      const newCharacter = await characterApi.createCharacter(character);
      characters.value.push(newCharacter);
      return newCharacter;
    } catch (err) {
      console.error('创建角色失败:', err);
      error.value = '创建角色失败';
      return null;
    } finally {
      loading.value = false;
    }
  }
  
  // 更新角色
  async function updateCharacter(id: string, characterData: Partial<Character>) {
    loading.value = true;
    error.value = null;
    
    try {
      const updatedCharacter = await characterApi.updateCharacter(id, characterData);
      
      // 更新本地角色列表
      const index = characters.value.findIndex(c => c.id === id);
      if (index !== -1) {
        characters.value[index] = updatedCharacter;
      }
      
      // 如果当前选中的角色被更新，也更新它
      if (currentCharacter.value && currentCharacter.value.id === id) {
        currentCharacter.value = updatedCharacter;
      }
      
      return updatedCharacter;
    } catch (err) {
      console.error('更新角色失败:', err);
      error.value = '更新角色失败';
      return null;
    } finally {
      loading.value = false;
    }
  }
  
  // 删除角色
  async function deleteCharacter(id: string) {
    loading.value = true;
    error.value = null;
    
    try {
      await characterApi.deleteCharacter(id);
      
      // 从本地列表中删除
      characters.value = characters.value.filter(c => c.id !== id);
      
      // 如果当前选中的角色被删除，清除它
      if (currentCharacter.value && currentCharacter.value.id === id) {
        currentCharacter.value = null;
      }
      
      return true;
    } catch (err) {
      console.error('删除角色失败:', err);
      error.value = '删除角色失败';
      return false;
    } finally {
      loading.value = false;
    }
  }
  
  // 选择角色
  function selectCharacter(character: Character) {
    currentCharacter.value = character;
  }
  
  // 清除当前角色
  function clearCurrentCharacter() {
    currentCharacter.value = null;
  }
  
  return {
    // 状态
    characters,
    currentCharacter,
    loading,
    error,
    
    // 动作
    fetchCharacters,
    fetchCharacterById,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    selectCharacter,
    clearCurrentCharacter
  };
}); 