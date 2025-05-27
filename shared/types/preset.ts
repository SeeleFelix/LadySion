/**
 * 简化的共享预设类型定义
 */

/**
 * 预设类型
 */
export type PresetType = 'instruct' | 'context' | 'sysprompt' | 'macros';

/**
 * 基础预设接口
 */
export interface BasePreset {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
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
 * 预设联合类型
 */
export type Preset = InstructPreset | ContextPreset | SystemPromptPreset | MacroDescription;

/**
 * API响应包装器
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * 预设配置接口
 */
export interface PresetConfiguration {
  instruct?: {
    enabled: boolean;
    bindToContext: boolean;
    selectedPresetId?: string;
  };
  context?: {
    selectedPresetId?: string;
  };
  systemPrompt?: {
    enabled: boolean;
    selectedPresetId?: string;
  };
}

/**
 * 主预设接口
 */
export interface MasterPreset {
  id?: string;
  name: string;
  description?: string;
  version?: string;
  author?: string;
  instruct?: InstructPreset;
  context?: ContextPreset;
  systemPrompt?: SystemPromptPreset;
  tags?: string[];
  category?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * 预设操作结果
 */
export interface PresetOperationResult<T = any> extends ApiResponse<T> {
  preset?: T;
  config?: PresetConfiguration;
}

/**
 * 预设查询参数
 */
export interface PresetQueryParams {
  type?: PresetType;
  enabled?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
} 