import { computed } from 'vue'
import { useCharacterStore } from '@/stores/modules/character'
import type { CreateCharacterData, UpdateCharacterData } from '@/types'

/**
 * 角色管理相关的组合式API
 */
export function useCharacter() {
  const store = useCharacterStore()

  // 响应式状态
  const characters = computed(() => store.characters)
  const currentCharacter = computed(() => store.currentCharacter)
  const loading = computed(() => store.loading)
  const error = computed(() => store.error)
  const characterCount = computed(() => store.characterCount)
  const hasCharacters = computed(() => store.hasCharacters)

  // 操作方法
  const loadCharacters = async () => {
    await store.loadCharacters()
  }

  const loadCharacterById = async (id: string) => {
    return await store.loadCharacterById(id)
  }

  const createCharacter = async (data: CreateCharacterData) => {
    return await store.createCharacter(data)
  }

  const updateCharacter = async (data: UpdateCharacterData) => {
    return await store.updateCharacter(data)
  }

  const deleteCharacter = async (id: string) => {
    await store.deleteCharacter(id)
  }

  const setCurrentCharacter = (character: any) => {
    store.setCurrentCharacter(character)
  }

  const clearError = () => {
    store.clearError()
  }

  // 工具方法
  const findCharacterById = (id: string) => {
    return characters.value.find(c => c.id === id)
  }

  const getCharactersByName = (name: string) => {
    return characters.value.filter(c => 
      c.name.toLowerCase().includes(name.toLowerCase())
    )
  }

  return {
    // 状态
    characters,
    currentCharacter,
    loading,
    error,
    characterCount,
    hasCharacters,
    
    // 方法
    loadCharacters,
    loadCharacterById,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    setCurrentCharacter,
    clearError,
    
    // 工具方法
    findCharacterById,
    getCharactersByName
  }
} 