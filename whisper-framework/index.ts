/**
 * 🌟 Whisper Framework - 神性命名体系的TypeScript API框架
 * 在scripture中创建seeker实例，前端直接导入使用
 */

// 🔮 核心工厂函数导出
export { createSeeker } from "./core/seeker.ts";

// 🔧 配置管理导出
export { 
  getDoctrine, 
  getDoctrineSync, 
  clearDoctrineCache,
  generateConfigTemplate 
} from "./core/doctrine.ts";

// 📜 类型定义导出
export type {
  Eidolon,
  Spell,
  Omen,
  Grace,
  Whisper,
  Seeker,
  Doctrine,
  CreateSeeker,
} from "./types/core.ts";

// 🚨 异常类导出
export { WrathError, OmenError } from "./types/core.ts"; 