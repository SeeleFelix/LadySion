/**
 * 预设类型枚举
 */
export enum PresetType {
  INSTRUCT = 'instruct',
  CONTEXT = 'context',
  SYSTEM_PROMPT = 'sysprompt',
  MACROS = 'macros',
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
  inputSequence: string;
  inputSuffix: string;
  outputSequence: string;
  outputSuffix: string;
  systemSequence: string;
  systemSuffix: string;
  
  // 特殊序列
  firstInputSequence: string;
  firstOutputSequence: string;
  lastInputSequence?: string;
  lastOutputSequence?: string;
  lastSystemSequence?: string;
  
  // 停止和对齐
  stopSequence: string;
  userAlignmentMessage?: string;
  
  // 选项
  wrap: boolean;
  macro: boolean;
  activationRegex: string;
  derivedFromModel?: boolean;
  bindToContext?: boolean;
  
  // 系统提示词处理
  systemSameAsUser?: boolean;
  systemInstruction?: boolean;
  
  // 高级选项
  enabledFor?: string[];
  priority?: number;
}

/**
 * 上下文模板预设接口
 */
export interface ContextPreset extends Preset {
  contextTemplate: string;
  exampleSeparator: string;
  chatStart: string;
  exampleDialogues?: ExampleDialogue[];
  useStoryString?: boolean;
  usePersonality?: boolean;
  useScenario?: boolean;
  useSystemInstruction?: boolean;
  maxContextLength?: number;
  tokenBudget?: number;
  insertionDepth?: number;
  enableMacros?: boolean;
  activationRegex?: string;
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
  content: string;
  category?: string;
  tags?: string[];
  enabled: boolean;
  priority?: number;
  activationRegex?: string;
  enabledFor?: string[];
  formatBeforeContext?: boolean;
  formatAfterContext?: boolean;
  enableMacros?: boolean;
}

/**
 * 后历史指令预设接口
 */
export interface PostHistoryInstructionsPreset extends Preset {
  content: string;
  enabled: boolean;
  priority?: number;
  activationRegex?: string;
  enabledFor?: string[];
  preferCharacterInstructions?: boolean;
  allowCharacterOverride?: boolean;
  enableMacros?: boolean;
  insertionPosition?: 'end' | 'before_last' | 'custom';
  customPosition?: number;
}

/**
 * 主预设接口
 */
export interface MasterPreset {
  name: string;
  description?: string;
  version?: string;
  author?: string;
  instruct?: InstructPreset;
  context?: ContextPreset;
  systemPrompt?: SystemPromptPreset;
  postHistoryInstructions?: PostHistoryInstructionsPreset;
  tags?: string[];
  category?: string;
  language?: string;
  exportedAt?: Date;
  importedAt?: Date;
}

/**
 * 预设配置接口
 */
export interface PresetConfiguration {
  instructMode?: {
    enabled: boolean;
    bindToContext: boolean;
    selectedPresetId?: string;
    autoSelect: boolean;
  };
  contextTemplate?: {
    enabled: boolean;
    selectedPresetId?: string;
    maxTokens?: number;
  };
  systemPrompt?: {
    enabled: boolean;
    selectedPresetId?: string;
    preferCharacterPrompt?: boolean;
  };
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