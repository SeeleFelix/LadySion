import { createPinia } from 'pinia';

// 创建Pinia实例
export const pinia = createPinia();

// 全局状态枚举
export enum LoadingState {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error'
}

// 通用错误类型
export interface AppError {
  code?: string;
  message: string;
  details?: any;
  timestamp: Date;
}

// 创建统一的错误处理函数
export function createAppError(message: string, code?: string, details?: any): AppError {
  return {
    code,
    message,
    details,
    timestamp: new Date()
  };
}

// 导出stores
export { usePresetStore } from './presetStore'; 