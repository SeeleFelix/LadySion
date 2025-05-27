import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { 
  PresetType, 
  InstructPreset, 
  ContextPreset, 
  SystemPromptPreset, 
  MacroDescription, 
  Preset,
  ApiResponse
} from '../types/preset';
import * as presetApi from '../api/presetApi';

export const usePresetStore = defineStore('preset', () => {
  // 状态
  const presets = ref<{
    instruct: InstructPreset[];
    context: ContextPreset[];
    sysprompt: SystemPromptPreset[];
    macros: MacroDescription[];
  }>({
    instruct: [],
    context: [],
    sysprompt: [],
    macros: []
  });

  const selectedPresets = ref<{
    instruct: InstructPreset | null;
    context: ContextPreset | null;
    sysprompt: SystemPromptPreset | null;
    macros: MacroDescription | null;
  }>({
    instruct: null,
    context: null,
    sysprompt: null,
    macros: null
  });

  const loading = ref(false);
  const error = ref<string | null>(null);

  // Actions - 调用真实API
  const loadPresets = async (type: PresetType) => {
    loading.value = true;
    error.value = null;
    
    try {
      if (type === 'macros') {
        // 宏使用特殊端点
        const response = await presetApi.getMacroDescriptions();
        const macroData = response.data.map((macro: any) => ({
          id: macro.name || `macro-${Date.now()}`,
          name: macro.name,
          description: macro.description,
          example: macro.example,
          createdAt: new Date(),
          updatedAt: new Date()
        }));
        presets.value.macros = macroData;
      } else {
        // 其他预设类型使用通用端点
        const response = await presetApi.getAllPresets(type);
        const presetData = response.data;
        
        switch (type) {
          case 'instruct':
            presets.value.instruct = presetData as InstructPreset[];
            break;
          case 'context':
            presets.value.context = presetData as ContextPreset[];
            break;
          case 'sysprompt':
            presets.value.sysprompt = presetData as SystemPromptPreset[];
            break;
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载预设失败';
      error.value = errorMessage;
      console.error('加载预设失败:', err);
      
      // API调用失败时清空数据
      switch (type) {
        case 'instruct':
          presets.value.instruct = [];
          break;
        case 'context':
          presets.value.context = [];
          break;
        case 'sysprompt':
          presets.value.sysprompt = [];
          break;
        case 'macros':
          presets.value.macros = [];
          break;
      }
    } finally {
      loading.value = false;
    }
  };

  const getPresetsByType = (type: PresetType): Preset[] => {
    switch (type) {
      case 'instruct':
        return presets.value.instruct;
      case 'context':
        return presets.value.context;
      case 'sysprompt':
        return presets.value.sysprompt;
      case 'macros':
        return presets.value.macros;
      default:
        return [];
    }
  };

  const selectPreset = async (type: PresetType, name: string) => {
    loading.value = true;
    error.value = null;
    
    try {
      const typePresets = getPresetsByType(type);
      const preset = typePresets.find(p => p.name === name);
      
      if (!preset) {
        throw new Error(`预设 "${name}" 不存在`);
      }

      // 调用后端API选择预设
      try {
        switch (type) {
          case 'instruct':
            await presetApi.selectInstructPreset(preset.id);
            selectedPresets.value.instruct = preset as InstructPreset;
            break;
          case 'context':
            await presetApi.selectContextPreset(preset.id);
            selectedPresets.value.context = preset as ContextPreset;
            break;
          case 'sysprompt':
            await presetApi.selectSystemPromptPreset(preset.id);
            selectedPresets.value.sysprompt = preset as SystemPromptPreset;
            break;
          case 'macros':
            // 宏不需要选择API调用，只需本地状态更新
            selectedPresets.value.macros = preset as MacroDescription;
            break;
        }
      } catch (apiError) {
        // 即使API调用失败，也更新本地状态（优雅降级）
        console.warn('API选择调用失败，仅更新本地状态:', apiError);
        switch (type) {
          case 'instruct':
            selectedPresets.value.instruct = preset as InstructPreset;
            break;
          case 'context':
            selectedPresets.value.context = preset as ContextPreset;
            break;
          case 'sysprompt':
            selectedPresets.value.sysprompt = preset as SystemPromptPreset;
            break;
          case 'macros':
            selectedPresets.value.macros = preset as MacroDescription;
            break;
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '选择预设失败';
      console.error('选择预设失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateConfig = async (type: PresetType, config: any) => {
    loading.value = true;
    error.value = null;
    
    try {
      // 调用后端配置更新API
      switch (type) {
        case 'instruct':
          await presetApi.updateInstructModeConfig(config);
          break;
        case 'context':
          await presetApi.updateContextTemplateConfig(config);
          break;
        case 'sysprompt':
          await presetApi.updateSystemPromptConfig(config);
          break;
        default:
          console.log(`更新${type}配置:`, config);
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新配置失败';
      console.error('更新配置失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 保存预设
  const savePreset = async (type: PresetType, preset: Partial<Preset>) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await presetApi.savePreset(type, preset);
      const savedPreset = response.data;
      
      // 更新本地状态
      const typePresets = getPresetsByType(type);
      const existingIndex = typePresets.findIndex(p => p.id === preset.id);
      
      if (existingIndex >= 0) {
        // 更新现有预设
        switch (type) {
          case 'instruct':
            presets.value.instruct[existingIndex] = savedPreset as InstructPreset;
            break;
          case 'context':
            presets.value.context[existingIndex] = savedPreset as ContextPreset;
            break;
          case 'sysprompt':
            presets.value.sysprompt[existingIndex] = savedPreset as SystemPromptPreset;
            break;
          case 'macros':
            presets.value.macros[existingIndex] = savedPreset as MacroDescription;
            break;
        }
      } else {
        // 添加新预设
        switch (type) {
          case 'instruct':
            presets.value.instruct.push(savedPreset as InstructPreset);
            break;
          case 'context':
            presets.value.context.push(savedPreset as ContextPreset);
            break;
          case 'sysprompt':
            presets.value.sysprompt.push(savedPreset as SystemPromptPreset);
            break;
          case 'macros':
            presets.value.macros.push(savedPreset as MacroDescription);
            break;
        }
      }
      
      return savedPreset;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '保存预设失败';
      console.error('保存预设失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 删除预设
  const deletePreset = async (type: PresetType, id: string) => {
    loading.value = true;
    error.value = null;
    
    try {
      await presetApi.deletePreset(type, id);
      
      // 从本地状态移除
      switch (type) {
        case 'instruct':
          presets.value.instruct = presets.value.instruct.filter(p => p.id !== id);
          if (selectedPresets.value.instruct?.id === id) {
            selectedPresets.value.instruct = null;
          }
          break;
        case 'context':
          presets.value.context = presets.value.context.filter(p => p.id !== id);
          if (selectedPresets.value.context?.id === id) {
            selectedPresets.value.context = null;
          }
          break;
        case 'sysprompt':
          presets.value.sysprompt = presets.value.sysprompt.filter(p => p.id !== id);
          if (selectedPresets.value.sysprompt?.id === id) {
            selectedPresets.value.sysprompt = null;
          }
          break;
        case 'macros':
          presets.value.macros = presets.value.macros.filter(p => p.id !== id);
          if (selectedPresets.value.macros?.id === id) {
            selectedPresets.value.macros = null;
          }
          break;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除预设失败';
      console.error('删除预设失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 初始化加载所有预设
  const initializeStore = async () => {
    try {
      await Promise.all([
        loadPresets('instruct'),
        loadPresets('context'),
        loadPresets('sysprompt'),
        loadPresets('macros')
      ]);
      
      // 不自动选择默认预设，让用户手动选择
    } catch (err) {
      console.error('初始化预设store失败:', err);
      // 不抛出错误，允许应用继续运行
    }
  };

  return {
    // 状态
    presets: computed(() => presets.value),
    selectedPresets: computed(() => selectedPresets.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    
    // Actions
    loadPresets,
    getPresetsByType,
    selectPreset,
    updateConfig,
    savePreset,
    deletePreset,
    initializeStore
  };
}); 