import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { PresetType, InstructPreset, ContextPreset, SystemPromptPreset, MacroDescription, Preset } from '../types/preset';

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

  // 模拟数据
  const mockInstructPresets: InstructPreset[] = [
    {
      id: '1',
      name: '默认指令模式',
      description: '标准的指令模式配置',
      content: {
        enabled: true,
        system_prompt: '你是一个有用的AI助手',
        input_prefix: '用户: ',
        output_prefix: '助手: ',
        system_prefix: '系统: ',
        stop_sequence: '\n\n',
        separator_sequence: '\n',
        wrap: false,
        macro: false
      },
      isDefault: true
    },
    {
      id: '2',
      name: 'ChatML格式',
      description: 'ChatML风格的指令模式',
      content: {
        enabled: true,
        system_prompt: '<|im_start|>system\n你是一个有用的AI助手<|im_end|>',
        input_prefix: '<|im_start|>user\n',
        output_prefix: '<|im_start|>assistant\n',
        system_prefix: '<|im_start|>system\n',
        stop_sequence: '<|im_end|>',
        separator_sequence: '\n',
        wrap: true,
        macro: false
      },
      isDefault: false
    }
  ];

  const mockContextPresets: ContextPreset[] = [
    {
      id: '1',
      name: '默认上下文',
      description: '标准的上下文模板',
      content: {
        template: '{{char}}和{{user}}的对话\n\n{{history}}',
        max_length: 2048,
        scan_depth: 100,
        frequency_penalty: 0.7,
        presence_penalty: 0.7
      },
      isDefault: true
    }
  ];

  const mockSystemPrompts: SystemPromptPreset[] = [
    {
      id: '1',
      name: '默认系统提示',
      description: '标准的系统提示词',
      content: {
        prompt: '你是一个有用、无害、诚实的AI助手。请用中文回答用户的问题。',
        enabled: true
      },
      isDefault: true
    }
  ];

  const mockMacros: MacroDescription[] = [
    {
      id: '1',
      name: '{{char}}',
      description: '角色名称',
      example: 'Luna'
    },
    {
      id: '2',
      name: '{{user}}',
      description: '用户名称',
      example: '用户'
    }
  ];

  // Actions
  const loadPresets = async (type: PresetType) => {
    loading.value = true;
    error.value = null;
    
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      switch (type) {
        case 'instruct':
          presets.value.instruct = mockInstructPresets;
          break;
        case 'context':
          presets.value.context = mockContextPresets;
          break;
        case 'sysprompt':
          presets.value.sysprompt = mockSystemPrompts;
          break;
        case 'macros':
          presets.value.macros = mockMacros;
          break;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载预设失败';
      console.error('加载预设失败:', err);
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
      
      if (preset) {
        selectedPresets.value[type] = preset as any;
      } else {
        throw new Error(`预设 "${name}" 不存在`);
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
      // 模拟保存配置
      await new Promise(resolve => setTimeout(resolve, 300));
      console.log(`更新${type}配置:`, config);
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新配置失败';
      console.error('更新配置失败:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // 初始化加载默认预设
  const initializeStore = async () => {
    await Promise.all([
      loadPresets('instruct'),
      loadPresets('context'),
      loadPresets('sysprompt'),
      loadPresets('macros')
    ]);
    
    // 选择默认预设
    selectedPresets.value.instruct = presets.value.instruct.find(p => p.isDefault) || null;
    selectedPresets.value.context = presets.value.context.find(p => p.isDefault) || null;
    selectedPresets.value.sysprompt = presets.value.sysprompt.find(p => p.isDefault) || null;
  };

  return {
    // 状态
    presets,
    selectedPresets,
    loading,
    error,
    
    // Actions
    loadPresets,
    getPresetsByType,
    selectPreset,
    updateConfig,
    initializeStore
  };
}); 