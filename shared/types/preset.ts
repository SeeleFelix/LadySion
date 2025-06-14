/**
 * LadySion 预设类型定义
 *
 * 这个文件定义了前后端共享的预设相关类型
 * 与服务端 domain/entities/Preset.ts 保持同步
 *
 * @version 2.0.0
 * @author LadySion Team
 */

// ================================
// 核心枚举和基础类型
// ================================

/**
 * 预设类型枚举 - 与后端保持完全一致
 */
export enum PresetType {
  /** 指令模式预设 */
  INSTRUCT = "instruct",
  /** 上下文模板预设 */
  CONTEXT = "context",
  /** 系统提示词预设 */
  SYSTEM_PROMPT = "sysprompt",
  /** 宏定义预设 */
  MACROS = "macros",
  /** 后历史指令预设 */
  POST_HISTORY_INSTRUCTIONS = "post-history-instructions",
}

/**
 * 预设类型的字符串字面量类型 - 用于兼容旧代码
 * @deprecated 请使用 PresetType 枚举
 */
export type PresetTypeString =
  | "instruct"
  | "context"
  | "sysprompt"
  | "macros"
  | "post-history-instructions";

/**
 * 预设优先级类型
 */
export type PresetPriority = number;

/**
 * 预设激活正则表达式类型
 */
export type ActivationRegex = string;

// ================================
// 基础接口定义
// ================================

/**
 * 基础预设接口 - 所有预设类型的共同属性
 */
export interface BasePreset {
  /** 预设唯一标识符 */
  readonly id: string;
  /** 预设名称 */
  name: string;
  /** 预设描述 */
  description?: string;
  /** 创建时间 */
  readonly createdAt?: Date;
  /** 最后更新时间 */
  readonly updatedAt?: Date;
}

/**
 * 可激活的预设通用属性
 */
export interface ActivatablePreset {
  /** 激活正则表达式 */
  activationRegex?: ActivationRegex;
  /** 启用的模型列表 */
  enabledFor?: string[];
  /** 优先级 */
  priority?: PresetPriority;
}

/**
 * 支持宏的预设通用属性
 */
export interface MacroEnabledPreset {
  /** 是否启用宏处理 */
  enableMacros?: boolean;
}

// ================================
// 指令模式预设
// ================================

/**
 * 指令模式预设内容接口
 */
export interface InstructPresetContent extends ActivatablePreset {
  // 基本序列配置
  /** 输入序列前缀 */
  inputSequence: string;
  /** 输入序列后缀 */
  inputSuffix: string;
  /** 输出序列前缀 */
  outputSequence: string;
  /** 输出序列后缀 */
  outputSuffix: string;
  /** 系统序列前缀 */
  systemSequence: string;
  /** 系统序列后缀 */
  systemSuffix: string;

  // 特殊序列配置
  /** 首次输入序列 */
  firstInputSequence: string;
  /** 首次输出序列 */
  firstOutputSequence: string;
  /** 最后输入序列 */
  lastInputSequence?: string;
  /** 最后输出序列 */
  lastOutputSequence?: string;
  /** 最后系统序列 */
  lastSystemSequence?: string;

  // 停止和对齐配置
  /** 停止序列 */
  stopSequence: string;
  /** 用户对齐消息 */
  userAlignmentMessage?: string;

  // 行为选项
  /** 是否启用换行 */
  wrap: boolean;
  /** 是否启用宏处理 */
  macro: boolean;
  /** 是否绑定到上下文 */
  bindToContext?: boolean;
  /** 是否从模型派生 */
  derivedFromModel?: boolean;

  // 系统提示词处理
  /** 系统提示词是否与用户相同 */
  systemSameAsUser?: boolean;
  /** 是否使用系统指令前缀 */
  systemInstruction?: boolean;
}

/**
 * 完整的指令模式预设接口
 */
export interface InstructPreset extends BasePreset, InstructPresetContent {}

// ================================
// 上下文模板预设
// ================================

/**
 * 示例对话接口
 */
export interface ExampleDialogue {
  /** 对话唯一标识符 */
  readonly id: string;
  /** 用户消息 */
  user: string;
  /** 助手回复 */
  assistant: string;
  /** 显示顺序 */
  order?: number;
}

/**
 * 上下文预设内容接口
 */
export interface ContextPresetContent extends ActivatablePreset, MacroEnabledPreset {
  // 核心模板配置
  /** 上下文模板内容 */
  content?: string;
  /** 上下文模板 (alias for content, 保持兼容性) */
  contextTemplate?: string;

  // 分隔符和标记配置
  /** 示例分隔符 */
  exampleSeparator?: string;
  /** 对话开始标记 */
  chatStart?: string;

  // 示例对话配置
  /** 示例对话列表 */
  exampleDialogues?: ExampleDialogue[];

  // 内容使用选项
  /** 是否使用故事字符串 */
  useStoryString?: boolean;
  /** 是否使用角色个性 */
  usePersonality?: boolean;
  /** 是否使用场景描述 */
  useScenario?: boolean;
  /** 是否使用系统指令 */
  useSystemInstruction?: boolean;

  // 高级配置
  /** 最大上下文长度 */
  maxContextLength?: number;
  /** Token预算 */
  tokenBudget?: number;
  /** 插入深度 */
  insertionDepth?: number;

  // 兼容性字段
  /** 前缀 (向后兼容) */
  prefix?: string;
  /** 后缀 (向后兼容) */
  suffix?: string;
  /** 是否允许越狱提示 (向后兼容) */
  allowJailbreak?: boolean;
  /** 防止新角色作者 (向后兼容) */
  preventNewRoleAuthor?: boolean;
}

/**
 * 完整的上下文预设接口
 */
export interface ContextPreset extends BasePreset, ContextPresetContent {}

// ================================
// 系统提示词预设
// ================================

/**
 * 系统提示词预设内容接口
 */
export interface SystemPromptPresetContent extends ActivatablePreset, MacroEnabledPreset {
  /** 系统提示词内容 */
  content: string;

  // 分类和标签
  /** 预设分类 */
  category?: string;
  /** 标签列表 */
  tags?: string[];

  // 状态控制
  /** 是否启用 */
  enabled: boolean;

  // 格式化选项
  /** 在上下文前格式化 */
  formatBeforeContext?: boolean;
  /** 在上下文后格式化 */
  formatAfterContext?: boolean;
}

/**
 * 完整的系统提示词预设接口
 */
export interface SystemPromptPreset extends BasePreset, SystemPromptPresetContent {}

// ================================
// 宏定义相关
// ================================

/**
 * 宏描述接口
 */
export interface MacroDescription extends BasePreset {
  /** 宏示例 */
  example?: string;
  /** 宏分类 */
  category?: string;
}

// ================================
// 联合类型和工具类型
// ================================

/**
 * 预设联合类型
 */
export type Preset =
  | InstructPreset
  | ContextPreset
  | SystemPromptPreset
  | MacroDescription;

/**
 * 根据预设类型获取对应的预设接口
 */
export type PresetByType<T extends PresetType> = T extends PresetType.INSTRUCT ? InstructPreset
  : T extends PresetType.CONTEXT ? ContextPreset
  : T extends PresetType.SYSTEM_PROMPT ? SystemPromptPreset
  : T extends PresetType.MACROS ? MacroDescription
  : never;

// ================================
// API 响应和配置类型
// ================================

/**
 * API响应包装器
 */
export interface ApiResponse<T = any> {
  /** 请求是否成功 */
  success: boolean;
  /** 响应数据 */
  data?: T;
  /** 成功消息 */
  message?: string;
  /** 错误信息 */
  error?: string;
  /** 错误代码 */
  errorCode?: string;
}

/**
 * 预设配置接口
 */
export interface PresetConfiguration {
  /** 指令模式配置 */
  instructMode?: {
    enabled: boolean;
    bindToContext: boolean;
    selectedPresetId?: string;
    autoSelect: boolean;
  };

  /** 上下文模板配置 */
  contextTemplate?: {
    enabled: boolean;
    selectedPresetId?: string;
    maxTokens?: number;
  };

  /** 系统提示词配置 */
  systemPrompt?: {
    enabled: boolean;
    selectedPresetId?: string;
    preferCharacterPrompt?: boolean;
  };

  /** 宏配置 */
  macros?: {
    enabled: boolean;
    selectedMacros?: string[];
  };
}

/**
 * 主预设接口 - 用于批量导入导出
 */
export interface MasterPreset {
  /** 预设包名称 */
  name: string;
  /** 预设包描述 */
  description?: string;
  /** 版本号 */
  version?: string;
  /** 作者信息 */
  author?: string;

  // 子预设
  /** 指令模式预设 */
  instruct?: InstructPreset;
  /** 上下文预设 */
  context?: ContextPreset;
  /** 系统提示词预设 */
  systemPrompt?: SystemPromptPreset;

  // 元数据
  /** 标签列表 */
  tags?: string[];
  /** 分类 */
  category?: string;
  /** 语言 */
  language?: string;

  // 时间戳
  /** 导出时间 */
  exportedAt?: Date;
  /** 导入时间 */
  importedAt?: Date;
}

/**
 * 预设操作结果
 */
export interface PresetOperationResult<T = any> extends ApiResponse<T> {
  /** 操作的预设 */
  preset?: T;
  /** 相关配置 */
  config?: PresetConfiguration;
}

/**
 * 预设查询参数
 */
export interface PresetQueryParams {
  /** 预设类型 */
  type?: PresetType | PresetTypeString;
  /** 是否启用 */
  enabled?: boolean;
  /** 搜索关键词 */
  search?: string;
  /** 分类筛选 */
  category?: string;
  /** 标签筛选 */
  tags?: string[];
  /** 分页限制 */
  limit?: number;
  /** 分页偏移 */
  offset?: number;
  /** 排序字段 */
  sortBy?: "name" | "createdAt" | "updatedAt" | "priority";
  /** 排序方向 */
  sortOrder?: "asc" | "desc";
}

// ================================
// 常量定义
// ================================

/**
 * 预设类型显示名称映射
 */
export const PRESET_TYPE_LABELS: Record<PresetType, string> = {
  [PresetType.INSTRUCT]: "指令模式",
  [PresetType.CONTEXT]: "上下文模板",
  [PresetType.SYSTEM_PROMPT]: "系统提示词",
  [PresetType.MACROS]: "宏定义",
  [PresetType.POST_HISTORY_INSTRUCTIONS]: "后历史指令",
} as const;

/**
 * 默认优先级配置
 */
export const DEFAULT_PRIORITIES: Record<PresetType, number> = {
  [PresetType.SYSTEM_PROMPT]: 100,
  [PresetType.CONTEXT]: 200,
  [PresetType.INSTRUCT]: 300,
  [PresetType.MACROS]: 400,
  [PresetType.POST_HISTORY_INSTRUCTIONS]: 500,
} as const;

// ================================
// 工具函数类型
// ================================

/**
 * 预设验证错误
 */
export interface PresetValidationError {
  /** 错误字段 */
  field: string;
  /** 错误消息 */
  message: string;
  /** 错误值 */
  value?: any;
  /** 错误代码 */
  code?: string;
}

/**
 * 预设验证结果
 */
export interface PresetValidationResult {
  /** 是否有效 */
  isValid: boolean;
  /** 错误列表 */
  errors: PresetValidationError[];
}

// ================================
// 向后兼容性导出
// ================================

/**
 * @deprecated 请使用 PresetType 枚举
 */
export type PresetTypeOld = PresetTypeString;

/**
 * @deprecated 请使用 InstructPresetContent
 */
export interface InstructPresetContentLegacy
  extends Omit<InstructPresetContent, "activationRegex"> {
  activation_regex?: string;
}
