import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { ElMessage } from "element-plus";
import { characterApi } from "@/services";
import type {
  Character,
  CreateCharacterData,
  UpdateCharacterData,
} from "@/types";

export const useCharacterStore = defineStore("character", () => {
  // 状态
  const characters = ref<Character[]>([]);
  const currentCharacter = ref<Character | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 计算属性
  const characterCount = computed(() => characters.value.length);
  const hasCharacters = computed(() => characters.value.length > 0);

  // 操作方法
  /**
   * 加载所有角色
   */
  const loadCharacters = async () => {
    loading.value = true;
    error.value = null;
    try {
      characters.value = await characterApi.getAll();
    } catch (err: any) {
      error.value = err.message || "加载角色失败";
      ElMessage.error(error.value!);
    } finally {
      loading.value = false;
    }
  };

  /**
   * 根据ID获取角色
   */
  const loadCharacterById = async (id: string) => {
    loading.value = true;
    error.value = null;
    try {
      const character = await characterApi.getById(id);
      currentCharacter.value = character;
      return character;
    } catch (err: any) {
      error.value = err.message || "加载角色失败";
      ElMessage.error(error.value!);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 创建新角色
   */
  const createCharacter = async (data: CreateCharacterData) => {
    loading.value = true;
    error.value = null;
    try {
      const newCharacter = await characterApi.create(data);
      characters.value.push(newCharacter);
      ElMessage.success("角色创建成功");
      return newCharacter;
    } catch (err: any) {
      error.value = err.message || "创建角色失败";
      ElMessage.error(error.value!);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 更新角色
   */
  const updateCharacter = async (data: UpdateCharacterData) => {
    loading.value = true;
    error.value = null;
    try {
      const updatedCharacter = await characterApi.update(data);
      const index = characters.value.findIndex((c) => c.id === data.id);
      if (index !== -1) {
        characters.value[index] = updatedCharacter;
      }
      if (currentCharacter.value?.id === data.id) {
        currentCharacter.value = updatedCharacter;
      }
      ElMessage.success("角色更新成功");
      return updatedCharacter;
    } catch (err: any) {
      error.value = err.message || "更新角色失败";
      ElMessage.error(error.value!);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 删除角色
   */
  const deleteCharacter = async (id: string) => {
    loading.value = true;
    error.value = null;
    try {
      await characterApi.remove(id);
      characters.value = characters.value.filter((c) => c.id !== id);
      if (currentCharacter.value?.id === id) {
        currentCharacter.value = null;
      }
      ElMessage.success("角色删除成功");
    } catch (err: any) {
      error.value = err.message || "删除角色失败";
      ElMessage.error(error.value!);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 设置当前角色
   */
  const setCurrentCharacter = (character: Character | null) => {
    currentCharacter.value = character;
  };

  /**
   * 清除错误状态
   */
  const clearError = () => {
    error.value = null;
  };

  return {
    // 状态
    characters,
    currentCharacter,
    loading,
    error,
    // 计算属性
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
  };
});
