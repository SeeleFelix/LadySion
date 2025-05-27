import { computed, ref, watch } from 'vue';
import { usePresetStore } from '../store';
import { LoadingState, createAppError, type AppError } from '../store';
import type { PresetType, Preset } from '../types/preset';

/**
 * 预设管理组合式函数
 * 提供统一的预设操作接口
 */
export function usePresets() {
  const presetStore = usePresetStore();
  
  // 本地响应式状态
  const currentError = ref<AppError | null>(null);
  const loadingState = ref<LoadingState>(LoadingState.IDLE);
  
  // 计算属性
  const isLoading = computed(() => loadingState.value === LoadingState.LOADING);
  const hasError = computed(() => currentError.value !== null);
  const isInitialized = computed(() => loadingState.value !== LoadingState.IDLE);
  
  // 错误处理
  const clearError = () => {
    currentError.value = null;
  };
  
  const handleError = (error: unknown, operation: string) => {
    const message = error instanceof Error ? error.message : `${operation}失败`;
    currentError.value = createAppError(message, 'PRESET_ERROR', error);
    loadingState.value = LoadingState.ERROR;
    console.error(`${operation}失败:`, error);
  };
  
  // 预设操作
  const loadPresets = async (type: PresetType) => {
    try {
      loadingState.value = LoadingState.LOADING;
      clearError();
      
      await presetStore.loadPresets(type);
      
      loadingState.value = LoadingState.SUCCESS;
    } catch (error) {
      handleError(error, `加载${type}预设`);
      throw error;
    }
  };
  
  const selectPreset = async (type: PresetType, name: string) => {
    try {
      loadingState.value = LoadingState.LOADING;
      clearError();
      
      await presetStore.selectPreset(type, name);
      
      loadingState.value = LoadingState.SUCCESS;
    } catch (error) {
      handleError(error, `选择${type}预设`);
      throw error;
    }
  };
  
  const getPresetsByType = (type: PresetType): Preset[] => {
    return presetStore.getPresetsByType(type);
  };
  
  const getSelectedPreset = (type: PresetType) => {
    switch (type) {
      case 'instruct':
        return presetStore.selectedPresets.instruct;
      case 'context':
        return presetStore.selectedPresets.context;
      case 'sysprompt':
        return presetStore.selectedPresets.sysprompt;
      case 'macros':
        return presetStore.selectedPresets.macros;
      default:
        return null;
    }
  };
  
  const initialize = async () => {
    try {
      loadingState.value = LoadingState.LOADING;
      clearError();
      
      await presetStore.initializeStore();
      
      loadingState.value = LoadingState.SUCCESS;
    } catch (error) {
      handleError(error, '初始化预设');
      throw error;
    }
  };
  
  // 监听store错误
  watch(
    () => presetStore.error,
    (error) => {
      if (error) {
        currentError.value = createAppError(error, 'STORE_ERROR');
        loadingState.value = LoadingState.ERROR;
      }
    }
  );
  
  return {
    // 状态
    isLoading,
    hasError,
    isInitialized,
    error: computed(() => currentError.value),
    loadingState: computed(() => loadingState.value),
    
    // Store状态
    presets: computed(() => presetStore.presets),
    selectedPresets: computed(() => presetStore.selectedPresets),
    
    // 操作
    loadPresets,
    selectPreset,
    getPresetsByType,
    getSelectedPreset,
    initialize,
    clearError,
    
    // 工具函数
    getPresetNames: (type: PresetType) => getPresetsByType(type).map(p => p.name),
    hasPresets: (type: PresetType) => getPresetsByType(type).length > 0,
    getDefaultPreset: (type: PresetType) => getPresetsByType(type).find(p => p.isDefault),
  };
}

/**
 * 特定类型预设的组合式函数
 */
export function useInstructPresets() {
  const { 
    loadPresets, 
    selectPreset, 
    getPresetsByType, 
    getSelectedPreset,
    ...rest 
  } = usePresets();
  
  return {
    ...rest,
    loadPresets: () => loadPresets('instruct'),
    selectPreset: (name: string) => selectPreset('instruct', name),
    presets: computed(() => getPresetsByType('instruct')),
    selectedPreset: computed(() => getSelectedPreset('instruct')),
  };
}

export function useContextPresets() {
  const { 
    loadPresets, 
    selectPreset, 
    getPresetsByType, 
    getSelectedPreset,
    ...rest 
  } = usePresets();
  
  return {
    ...rest,
    loadPresets: () => loadPresets('context'),
    selectPreset: (name: string) => selectPreset('context', name),
    presets: computed(() => getPresetsByType('context')),
    selectedPreset: computed(() => getSelectedPreset('context')),
  };
}

export function useSystemPromptPresets() {
  const { 
    loadPresets, 
    selectPreset, 
    getPresetsByType, 
    getSelectedPreset,
    ...rest 
  } = usePresets();
  
  return {
    ...rest,
    loadPresets: () => loadPresets('sysprompt'),
    selectPreset: (name: string) => selectPreset('sysprompt', name),
    presets: computed(() => getPresetsByType('sysprompt')),
    selectedPreset: computed(() => getSelectedPreset('sysprompt')),
  };
} 