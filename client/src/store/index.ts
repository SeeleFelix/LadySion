import { createPinia } from 'pinia';

// 导出存储
export * from './character';
export * from './conversation';

// 创建Pinia实例
export const pinia = createPinia(); 