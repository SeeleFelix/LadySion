/**
 * 前端预设类型定义 - 基于共享类型的扩展
 */

// 从共享类型导入基础定义
export * from "../../../shared/types/preset";

// 重新导出一些常用类型，提供更好的开发体验
export {
  type ApiResponse,
  type ContextPreset,
  DEFAULT_PRIORITIES,
  type InstructPreset,
  type MasterPreset,
  type Preset,
  PRESET_TYPE_LABELS,
  type PresetConfiguration,
  PresetType,
  type PresetTypeString,
  type SystemPromptPreset,
} from "../../../shared/types/preset";

/**
 * 前端扩展的预设接口
 */
export interface ExtendedPreset extends Preset {
  /** 是否为默认预设 */
  isDefault?: boolean;
  /** 是否已选中 */
  isSelected?: boolean;
  /** 是否正在加载 */
  loading?: boolean;
  /** 本地修改状态 */
  isDirty?: boolean;
  /** 预设使用次数统计 */
  usageCount?: number;
  /** 最后使用时间 */
  lastUsedAt?: Date;
}

/**
 * 预设验证错误
 */
export interface PresetValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * 宏变量（前端显示用）
 */
export interface MacroVariable {
  name: string;
  description: string;
  category: string;
  example?: string;
}

/**
 * 宏分类枚举
 */
export enum MacroCategory {
  CHARACTER = "character",
  CHAT = "chat",
  WORLD = "world",
  USER = "user",
  SYSTEM = "system",
  TIME = "time",
  FORMATTING = "formatting",
}

/**
 * 前端预设管理状态
 */
export interface PresetManagerState {
  /** 当前选中的预设类型 */
  activeType: PresetType;
  /** 各类型的预设列表 */
  presets: Record<PresetType, ExtendedPreset[]>;
  /** 加载状态 */
  loading: Record<PresetType, boolean>;
  /** 错误状态 */
  errors: Record<PresetType, string | null>;
  /** 搜索关键词 */
  searchQuery: string;
  /** 筛选器 */
  filters: {
    category?: string;
    tags?: string[];
    enabled?: boolean;
  };
}

/**
 * 预设导入导出选项
 */
export interface PresetImportExportOptions {
  /** 包含配置 */
  includeConfig?: boolean;
  /** 包含元数据 */
  includeMetadata?: boolean;
  /** 压缩输出 */
  compress?: boolean;
  /** 文件格式 */
  format?: "json" | "yaml" | "toml";
}

/**
 * 预设操作权限
 */
export interface PresetPermissions {
  /** 可以读取 */
  canRead: boolean;
  /** 可以编辑 */
  canEdit: boolean;
  /** 可以删除 */
  canDelete: boolean;
  /** 可以导出 */
  canExport: boolean;
  /** 可以分享 */
  canShare: boolean;
}

// ================================
// 前端特有的工具类型
// ================================

/**
 * 预设表单数据类型
 */
export type PresetFormData<T extends PresetType> = Omit<
  PresetByType<T>,
  "id" | "createdAt" | "updatedAt"
>;

/**
 * 预设列表项展示类型
 */
export type PresetListItem = Pick<
  ExtendedPreset,
  "id" | "name" | "description" | "isDefault" | "isSelected" | "usageCount"
>;

/**
 * 预设统计信息
 */
export interface PresetStats {
  total: number;
  byType: Record<PresetType, number>;
  enabled: number;
  disabled: number;
  recentlyUsed: number;
}

// ================================
// 兼容性类型别名
// ================================

/**
 * @deprecated 请使用 PresetType.INSTRUCT
 */
export const PRESET_TYPE_INSTRUCT = PresetType.INSTRUCT;

/**
 * @deprecated 请使用 PresetType.CONTEXT
 */
export const PRESET_TYPE_CONTEXT = PresetType.CONTEXT;

/**
 * @deprecated 请使用 PresetType.SYSTEM_PROMPT
 */
export const PRESET_TYPE_SYSTEM_PROMPT = PresetType.SYSTEM_PROMPT;

/**
 * @deprecated 请使用 PresetType.MACROS
 */
export const PRESET_TYPE_MACROS = PresetType.MACROS;
