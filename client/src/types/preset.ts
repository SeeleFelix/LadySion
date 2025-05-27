/**
 * 前端预设类型定义 - 简化版本
 */

// 从共享类型导入基础定义
export * from '../../../shared/types/preset';

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
  CHARACTER = 'character',
  CHAT = 'chat',
  WORLD = 'world',
  USER = 'user',
  SYSTEM = 'system',
  TIME = 'time',
  FORMATTING = 'formatting'
} 