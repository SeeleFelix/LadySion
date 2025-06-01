/**
 * 🚀 Whisper 服务器工厂函数
 * 提供便捷的创建和配置方式
 */

import { WhisperServer } from "./WhisperServer.ts";
import { OakAdapter } from "../adapters/OakAdapter.ts";
import type { WhisperServerConfig, SeekerImplementation } from "../types/backend.ts";
import type { Router } from "oak/mod.ts";

/**
 * 🎯 创建 Whisper 服务器实例
 */
export function createWhisperServer(config: WhisperServerConfig = {}): WhisperServer {
  const server = new WhisperServer(config);
  
  // 默认注册 Oak 适配器
  server.registerAdapter(new OakAdapter());
  
  return server;
}

/**
 * 🌳 快速创建 Oak 集成的 Whisper 服务器
 */
export async function createOakWhisperServer(
  oakRouter: Router,
  seekers: Record<string, SeekerImplementation> = {},
  config: WhisperServerConfig = {}
): Promise<WhisperServer> {
  
  const server = createWhisperServer(config);
  
  // 注册所有 Seeker
  for (const [name, implementation] of Object.entries(seekers)) {
    server.registerSeeker(name, implementation);
  }
  
  // 启动服务器并集成到 Oak
  await server.start("oak", oakRouter);
  
  return server;
}

/**
 * 🔧 快速设置 Whisper 路由
 * 直接在现有 Oak Router 上添加 Whisper 支持
 */
export function setupWhisperRoutes(
  oakRouter: Router,
  seekers: Record<string, SeekerImplementation>,
  config: WhisperServerConfig = {}
): void {
  
  const adapter = new OakAdapter();
  const server = createWhisperServer(config);
  
  // 注册 Seekers
  for (const [name, implementation] of Object.entries(seekers)) {
    server.registerSeeker(name, implementation);
  }
  
  // 创建路由处理器
  const handler = server["dispatcher"].createHandler();
  const oakHandler = adapter.createRouteHandler(handler);
  
  // 注册路由
  const whisperPath = config.whisperPath || "/api/whisper";
  const routePattern = `${whisperPath}/:eidolon/:ritual`;
  
  oakRouter.post(routePattern, oakHandler);
  
  console.log(`🎉 Whisper 路由已设置: POST ${routePattern}`);
  
  // 打印注册的 Seeker 信息
  const routes = server.getRoutes();
  console.log(`📊 已注册 ${routes.length} 个 Whisper 方法`);
  
  for (const route of routes) {
    console.log(`   🔮 ${route.eidolon}.${route.ritual}`);
  }
}

/**
 * 🎭 创建开发模式的 Whisper 服务器
 * 包含调试功能和详细日志
 */
export function createDevWhisperServer(config: WhisperServerConfig = {}): WhisperServer {
  const devConfig: WhisperServerConfig = {
    logging: {
      enabled: true,
      level: 'debug',
      format: 'text'
    },
    middleware: {
      enableMetrics: true,
    },
    ...config,
  };
  
  const server = createWhisperServer(devConfig);
  
  console.log("🔧 开发模式 Whisper 服务器已创建");
  return server;
}

/**
 * 🚀 创建生产模式的 Whisper 服务器
 * 优化性能和安全配置
 */
export function createProdWhisperServer(config: WhisperServerConfig = {}): WhisperServer {
  const prodConfig: WhisperServerConfig = {
    logging: {
      enabled: true,
      level: 'error',
      format: 'json'
    },
    middleware: {
      enableRateLimit: true,
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15分钟
        max: 100 // 每个IP最多100个请求
      }
    },
    auth: {
      enabled: true,
    },
    timeout: 30000,
    ...config,
  };
  
  const server = createWhisperServer(prodConfig);
  
  console.log("🚀 生产模式 Whisper 服务器已创建");
  return server;
} 