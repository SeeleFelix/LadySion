import { computed, ref, watch } from "vue";
import { defineStore } from "pinia";
import { ElMessage } from "element-plus";
import { presetApi } from "@/services";
import type { BasePreset, Preset, PresetType } from "@/services";

// 扩展BasePreset类型，添加isDefault属性
interface ExtendedBasePreset extends BasePreset {
  isDefault?: boolean;
}

// 扩展各种预设类型
interface ExtendedInstructPreset extends ExtendedBasePreset {
  type: "instruct";
  template: string;
  parameters: Record<string, any>;
}

interface ExtendedContextPreset extends ExtendedBasePreset {
  type: "context";
  template: string;
  variables: Record<string, any>;
}

interface ExtendedSystemPromptPreset extends ExtendedBasePreset {
  type: "sysprompt";
  content: string;
  parameters: Record<string, any>;
}

interface ExtendedMasterPreset extends ExtendedBasePreset {
  type: "master";
  data: Record<string, any>;
}

type ExtendedPreset =
  | ExtendedInstructPreset
  | ExtendedContextPreset
  | ExtendedSystemPromptPreset
  | ExtendedMasterPreset;

/**
 * 预设Store
 */
export const usePresetStore = defineStore("preset", () => {
  // 状态
  const presets = ref<Record<PresetType, ExtendedPreset[]>>({
    instruct: [],
    context: [],
    sysprompt: [],
    master: [],
  });

  const selectedPresets = ref<Record<PresetType, ExtendedPreset | null>>({
    instruct: null,
    context: null,
    sysprompt: null,
    master: null,
  });

  const loading = ref(false);
  const error = ref<string | null>(null);

  // 操作方法
  const loadPresets = async (type: PresetType) => {
    loading.value = true;
    error.value = null;
    try {
      const result = await presetApi.getAll(type);
      presets.value[type] = result.map((preset) => ({
        ...preset,
        isDefault: false, // 可以根据实际需要设置默认值
      })) as ExtendedPreset[];
    } catch (err: any) {
      const errorMessage = err.message || `加载${type}预设失败`;
      error.value = errorMessage;
      ElMessage.error(errorMessage);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const selectPreset = async (type: PresetType, id: string) => {
    loading.value = true;
    error.value = null;
    try {
      // 这里可以调用API选择预设的方法
      switch (type) {
        case "instruct":
          await presetApi.selectInstructPreset(id);
          break;
        case "context":
          await presetApi.selectContextPreset(id);
          break;
        case "sysprompt":
          await presetApi.selectSystemPromptPreset(id);
          break;
      }

      // 更新本地选中状态
      const preset = presets.value[type].find((p) => p.id === id);
      if (preset) {
        selectedPresets.value[type] = preset;
      }
    } catch (err: any) {
      const errorMessage = err.message || `选择${type}预设失败`;
      error.value = errorMessage;
      ElMessage.error(errorMessage);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getPresetsByType = (type: PresetType): ExtendedPreset[] => {
    return presets.value[type] || [];
  };

  const initializeStore = async () => {
    // 初始化所有预设类型
    const types: PresetType[] = ["instruct", "context", "sysprompt", "master"];
    await Promise.all(types.map((type) => loadPresets(type)));
  };

  return {
    presets,
    selectedPresets,
    loading,
    error,
    loadPresets,
    selectPreset,
    getPresetsByType,
    initializeStore,
  };
});

/**
 * 预设管理组合式函数
 * 提供统一的预设操作接口
 */
export function usePresets() {
  const presetStore = usePresetStore();

  // 本地响应式状态
  const currentError = ref<string | null>(null);
  const loadingState = ref<"idle" | "loading" | "success" | "error">("idle");

  // 计算属性
  const isLoading = computed(() => loadingState.value === "loading");
  const hasError = computed(() => currentError.value !== null);
  const isInitialized = computed(() => loadingState.value !== "idle");

  // 错误处理
  const clearError = () => {
    currentError.value = null;
  };

  const handleError = (error: unknown, operation: string) => {
    const message = error instanceof Error ? error.message : `${operation}失败`;
    currentError.value = message;
    loadingState.value = "error";
    console.error(`${operation}失败:`, error);
  };

  // 预设操作
  const loadPresets = async (type: PresetType) => {
    try {
      loadingState.value = "loading";
      clearError();

      await presetStore.loadPresets(type);

      loadingState.value = "success";
    } catch (error) {
      handleError(error, `加载${type}预设`);
      throw error;
    }
  };

  const selectPreset = async (type: PresetType, id: string) => {
    try {
      loadingState.value = "loading";
      clearError();

      await presetStore.selectPreset(type, id);

      loadingState.value = "success";
    } catch (error) {
      handleError(error, `选择${type}预设`);
      throw error;
    }
  };

  const getPresetsByType = (type: PresetType): ExtendedPreset[] => {
    return presetStore.getPresetsByType(type);
  };

  const getSelectedPreset = (type: PresetType) => {
    return presetStore.selectedPresets[type];
  };

  const initialize = async () => {
    try {
      loadingState.value = "loading";
      clearError();

      await presetStore.initializeStore();

      loadingState.value = "success";
    } catch (error) {
      handleError(error, "初始化预设");
      throw error;
    }
  };

  // 监听store错误
  watch(
    () => presetStore.error,
    (error) => {
      if (error) {
        currentError.value = error;
        loadingState.value = "error";
      }
    },
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
    getPresetNames: (type: PresetType) => getPresetsByType(type).map((p) => p.name),
    hasPresets: (type: PresetType) => getPresetsByType(type).length > 0,
    getDefaultPreset: (type: PresetType) => getPresetsByType(type).find((p) => p.isDefault),
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
    loadPresets: () => loadPresets("instruct"),
    selectPreset: (id: string) => selectPreset("instruct", id),
    presets: computed(() => getPresetsByType("instruct")),
    selectedPreset: computed(() => getSelectedPreset("instruct")),
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
    loadPresets: () => loadPresets("context"),
    selectPreset: (id: string) => selectPreset("context", id),
    presets: computed(() => getPresetsByType("context")),
    selectedPreset: computed(() => getSelectedPreset("context")),
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
    loadPresets: () => loadPresets("sysprompt"),
    selectPreset: (id: string) => selectPreset("sysprompt", id),
    presets: computed(() => getPresetsByType("sysprompt")),
    selectedPreset: computed(() => getSelectedPreset("sysprompt")),
  };
}
