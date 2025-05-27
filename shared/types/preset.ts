/**
 * 简化的共享预设类型定义
 */

/**
 * 预设类型 - 与后端保持一致
 */
export type PresetType = 'instruct' | 'context' | 'sysprompt' | 'macros';

/**
 * 基础预设接口
 */
export interface BasePreset {
  id: string;
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * 指令模式预设内容 - 匹配后端结构
 */
export interface InstructPresetContent {
  // 基本序列
  inputSequence: string;           // input_sequence
  inputSuffix: string;             // input_suffix
  outputSequence: string;          // output_sequence
  outputSuffix: string;            // output_suffix
  systemSequence: string;          // system_sequence
  systemSuffix: string;            // system_suffix
  
  // 特殊序列
  firstInputSequence: string;      // first_input_sequence
  firstOutputSequence: string;     // first_output_sequence
  lastInputSequence?: string;      // last_input_sequence
  lastOutputSequence?: string;     // last_output_sequence
  lastSystemSequence?: string;     // last_system_sequence
  
  // 停止和对齐
  stopSequence: string;            // stop_sequence
  userAlignmentMessage?: string;   // user_alignment_message
  
  // 选项
  wrap: boolean;                   // wrap
  macro: boolean;                  // macro
  activationRegex: string;         // activation_regex
  derivedFromModel?: boolean;      // derived
  bindToContext?: boolean;         // bind_to_context
  
  // 系统提示词处理
  systemSameAsUser?: boolean;      // system_same_as_user
  systemInstruction?: boolean;     // system_instruction_prefix
  
  // 高级选项
  enabledFor?: string[];           // 启用的模型列表
  priority?: number;               // 激活优先级
}

/**
 * 指令模式预设
 */
export interface InstructPreset extends BasePreset, InstructPresetContent {}

/**
 * 上下文预设内容 - 匹配后端结构
 */
export interface ContextPresetContent {
  // 基本设置
  content: string;                 // 上下文模板内容
  
  // 高级设置
  prefix?: string;                 // 前缀
  suffix?: string;                 // 后缀
  
  // 标识设置
  chatStart?: string;              // 对话开始标记
  exampleSeparator?: string;       // 示例分隔符
  
  // 选项
  allowJailbreak?: boolean;        // 允许越狱提示
  preventNewRoleAuthor?: boolean;  // 防止新角色作者
  
  // 高级选项
  enabledFor?: string[];           // 启用的模型列表
  priority?: number;               // 优先级
}

/**
 * 上下文模板预设
 */
export interface ContextPreset extends BasePreset, ContextPresetContent {}

/**
 * 系统提示词预设内容 - 匹配后端结构
 */
export interface SystemPromptPresetContent {
  // 主要内容
  content: string;                 // 系统提示词内容
  
  // 分类和标签
  category?: string;               // 预设分类
  tags?: string[];                 // 标签列表
  
  // 选项
  enabled: boolean;                // 是否启用
  priority?: number;               // 优先级
  
  // 条件激活
  activationRegex?: string;        // 激活正则表达式
  enabledFor?: string[];           // 启用的模型列表
  
  // 格式设置
  formatBeforeContext?: boolean;   // 在上下文前格式化
  formatAfterContext?: boolean;    // 在上下文后格式化
  
  // 宏设置
  enableMacros?: boolean;          // 启用宏处理
}

/**
 * 系统提示词预设
 */
export interface SystemPromptPreset extends BasePreset, SystemPromptPresetContent {}

/**
 * 宏描述接口
 */
export interface MacroDescription extends BasePreset {
  // 宏名称在name字段中
  // 宏描述在description字段中
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
  // 指令模式配置
  instructMode?: {
    enabled: boolean;
    bindToContext: boolean;
    selectedPresetId?: string;
    autoSelect: boolean;
  };
  
  // 上下文模板配置
  contextTemplate?: {
    enabled: boolean;
    selectedPresetId?: string;
    maxTokens?: number;
  };
  
  // 系统提示词配置
  systemPrompt?: {
    enabled: boolean;
    selectedPresetId?: string;
    preferCharacterPrompt?: boolean;
  };
}

/**
 * 主预设接口
 */
export interface MasterPreset {
  name: string;
  description?: string;
  version?: string;
  author?: string;
  
  // 子预设
  instruct?: InstructPreset;
  context?: ContextPreset;
  systemPrompt?: SystemPromptPreset;
  
  // 元数据
  tags?: string[];
  category?: string;
  language?: string;
  
  // 导入导出信息
  exportedAt?: Date;
  importedAt?: Date;
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