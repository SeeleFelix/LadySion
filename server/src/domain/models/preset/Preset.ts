/**
 * 预设类型枚举
 */
export enum PresetType {
  INSTRUCT = 'instruct',
  CONTEXT = 'context',
  SYSTEM_PROMPT = 'system-prompt',
  POST_HISTORY_INSTRUCTIONS = 'post-history-instructions'
}

/**
 * 基础预设接口
 */
export interface Preset {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 指令模式预设接口
 */
export interface InstructPreset extends Preset {
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
 * 上下文模板预设接口
 */
export interface ContextPreset extends Preset {
  // 上下文结构
  contextTemplate: string;         // 主要上下文模板
  exampleSeparator: string;        // 示例分隔符
  chatStart: string;               // 对话开始标记
  
  // 示例对话
  exampleDialogues?: ExampleDialogue[];
  
  // 格式设置
  useStoryString?: boolean;        // 使用故事字符串
  usePersonality?: boolean;        // 使用人格描述
  useScenario?: boolean;           // 使用场景
  useSystemInstruction?: boolean;  // 使用系统指令
  
  // 高级设置
  maxContextLength?: number;       // 最大上下文长度
  tokenBudget?: number;            // 令牌预算
  insertionDepth?: number;         // 插入深度
  
  // 宏设置
  enableMacros?: boolean;          // 启用宏
  
  // 激活设置
  activationRegex?: string;        // 激活正则表达式
}

/**
 * 示例对话接口
 */
export interface ExampleDialogue {
  id: string;
  user: string;
  assistant: string;
  order?: number;
}

/**
 * 系统提示词预设接口
 */
export interface SystemPromptPreset extends Preset {
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
 * 后历史指令预设接口
 */
export interface PostHistoryInstructionsPreset extends Preset {
  // 主要内容
  content: string;                 // 后历史指令内容
  
  // 选项
  enabled: boolean;                // 是否启用
  priority?: number;               // 优先级
  
  // 条件激活
  activationRegex?: string;        // 激活正则表达式
  enabledFor?: string[];           // 启用的模型列表
  
  // 字符特定设置
  preferCharacterInstructions?: boolean;  // 优先使用角色特定指令
  allowCharacterOverride?: boolean;       // 允许角色覆盖
  
  // 宏设置
  enableMacros?: boolean;          // 启用宏处理
  
  // 高级设置
  insertionPosition?: 'end' | 'before_last' | 'custom';  // 插入位置
  customPosition?: number;         // 自定义位置
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
  postHistoryInstructions?: PostHistoryInstructionsPreset;
  
  // 元数据
  tags?: string[];
  category?: string;
  language?: string;
  
  // 导入导出信息
  exportedAt?: Date;
  importedAt?: Date;
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
  
  // 后历史指令配置
  postHistoryInstructions?: {
    enabled: boolean;
    selectedPresetId?: string;
    preferCharacterInstructions?: boolean;
    allowCharacterOverride?: boolean;
  };
}

/**
 * 宏描述接口
 */
export interface MacroDescription {
  name: string;
  description: string;
  syntax?: string;
  example?: string;
  category?: string;
} 