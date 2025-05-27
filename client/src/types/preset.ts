/**
 * 预设类型
 */
export type PresetType = 'instruct' | 'context' | 'sysprompt' | 'macros';

/**
 * 预设基类接口
 */
export interface Preset {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 基础预设接口
 */
export interface BasePreset {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
}

/**
 * 指令模式预设内容
 */
export interface InstructPresetContent {
  enabled: boolean;
  system_prompt: string;
  input_prefix: string;
  output_prefix: string;
  system_prefix: string;
  stop_sequence: string;
  separator_sequence: string;
  wrap: boolean;
  macro: boolean;
}

/**
 * 指令模式预设
 */
export interface InstructPreset extends BasePreset {
  content: InstructPresetContent;
}

/**
 * 上下文预设内容
 */
export interface ContextPresetContent {
  template: string;
  max_length: number;
  scan_depth: number;
  frequency_penalty: number;
  presence_penalty: number;
}

/**
 * 上下文模板预设
 */
export interface ContextPreset extends BasePreset {
  content: ContextPresetContent;
}

/**
 * 系统提示词预设内容
 */
export interface SystemPromptPresetContent {
  prompt: string;
  enabled: boolean;
}

/**
 * 系统提示词预设
 */
export interface SystemPromptPreset extends BasePreset {
  content: SystemPromptPresetContent;
}

/**
 * 宏描述接口
 */
export interface MacroDescription extends BasePreset {
  example?: string;
}

/**
 * 联合类型
 */
export type Preset = InstructPreset | ContextPreset | SystemPromptPreset | MacroDescription;

/**
 * 示例对话
 */
export interface ExampleDialogue {
  id: string;
  userMessage: string;
  assistantMessage: string;
  order: number;
}

/**
 * 指令模式配置接口
 */
export interface InstructModeConfig {
  enabled: boolean;
  bindToContext: boolean;
  selectedPresetId?: string;
}

/**
 * 上下文模板配置接口
 */
export interface ContextTemplateConfig {
  selectedPresetId?: string;
}

/**
 * 系统提示词配置接口
 */
export interface SystemPromptConfig {
  enabled: boolean;
  selectedPresetId?: string;
}

/**
 * 主预设接口 (导入导出用)
 */
export interface MasterPreset {
  name: string;
  instruct?: InstructPreset;
  context?: ContextPreset;
  systemPrompt?: SystemPromptPreset;
}

/**
 * 预设导入数据
 */
export interface PresetImportData {
  content: string;
  fileName: string;
  fileType: 'json' | 'yaml';
  conflictResolution: 'skip' | 'overwrite' | 'rename';
  strictValidation: boolean;
}

/**
 * 预设导出数据
 */
export interface PresetExportData {
  format: 'json' | 'yaml';
  scope: 'current' | 'type' | 'all';
  options: string[];
  type?: string;
  preset?: Preset;
}

/**
 * 预设过滤器
 */
export interface PresetFilters {
  enabled: string[];
  priorityRange: [number, number];
  models: string[];
  dateRange: [Date, Date] | null;
}

/**
 * 预设排序选项
 */
export interface PresetSortOptions {
  sortBy: 'name' | 'createdAt' | 'updatedAt' | 'priority';
  sortOrder: 'asc' | 'desc';
}

/**
 * 创建预设数据类型
 */
export type CreatePresetData = Omit<Preset, 'id'>;

/**
 * 更新预设数据类型
 */
export type UpdatePresetData = Partial<Omit<Preset, 'id'>>;

/**
 * 预设验证错误
 */
export interface PresetValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * 预设操作结果
 */
export interface PresetOperationResult {
  success: boolean;
  message: string;
  data?: any;
  errors?: PresetValidationError[];
}

/**
 * 宏变量
 */
export interface MacroVariable {
  name: string;
  description: string;
  category: string;
  example?: string;
  contextDependent?: boolean;
}

/**
 * 宏分类枚举
 */
export enum MacroCategory {
  CHARACTER = 'character',
  CHAT = 'chat',
  WORLD = 'world',
  USER = 'user',
  SYSTEM = 'system',
  TIME = 'time',
  FORMATTING = 'formatting'
}

/**
 * 预设模板
 */
export interface PresetTemplate {
  id: string;
  name: string;
  description: string;
  type: PresetType;
  tags: string[];
  data: Partial<Preset>;
  isDefault: boolean;
} 