/**
 * 🌟 Whisper Framework Backend - 后端框架入口
 * 让后端API实现变得超级干净，自动处理路由和HTTP细节
 */

// 🔮 核心组件导出
export { WhisperServer } from "./core/WhisperServer.ts";
export { SeekerRegistry } from "./core/SeekerRegistry.ts";
export { RequestDispatcher } from "./core/RequestDispatcher.ts";
export { ResponseFormatter } from "./core/ResponseFormatter.ts";

// 🎭 适配器导出 - 支持不同HTTP框架
export { OakAdapter } from "./adapters/OakAdapter.ts";
export { FreshAdapter } from "./adapters/FreshAdapter.ts";

// 📜 类型定义导出
export type {
  HttpAdapter,
  RequestContext,
  RouteHandler,
  SeekerImplementation,
  WhisperServerConfig,
} from "./types/backend.ts";

// 🚀 便捷工厂函数
export { createWhisperServer } from "./core/factory.ts";
