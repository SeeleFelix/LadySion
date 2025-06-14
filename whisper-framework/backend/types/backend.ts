/**
 * 🌟 Whisper Framework Backend - 类型定义
 * 定义后端框架的核心接口和类型
 */

import type { Doctrine, Eidolon, Grace, Omen, Spell } from "../../types/core.ts";

/**
 * 🙏 Seeker 实现基类
 * 所有后端服务都应该实现相应的 Seeker 接口
 */
export interface SeekerImplementation {
  // 标记接口，具体方法由实际接口定义
}

/**
 * 🌐 HTTP 适配器接口 - 支持不同框架
 */
export interface HttpAdapter {
  name: string;
  mount(server: any, config: WhisperServerConfig): Promise<void>;
  createRouteHandler(handler: RouteHandler): any;
}

/**
 * 🎯 请求上下文
 */
export interface RequestContext {
  eidolon: string;
  ritual: string;
  spell: Spell;
  headers: Record<string, string>;
  ip?: string;
  userAgent?: string;
  timestamp: number;
}

/**
 * 📋 路由处理器
 */
export interface RouteHandler {
  (context: RequestContext): Promise<Grace<any>>;
}

/**
 * ⚙️ Whisper 服务器配置
 */
export interface WhisperServerConfig {
  // 基础配置
  port?: number;
  host?: string;
  whisperPath?: string;

  // 安全配置
  cors?: {
    origin?: string | string[];
    credentials?: boolean;
  };

  // 认证配置
  auth?: {
    enabled?: boolean;
    verify?: (token: string) => Promise<boolean>;
  };

  // 日志配置
  logging?: {
    enabled?: boolean;
    level?: "debug" | "info" | "warn" | "error";
    format?: "json" | "text";
  };

  // 性能配置
  timeout?: number;
  maxBodySize?: number;

  // 中间件配置
  middleware?: {
    enableMetrics?: boolean;
    enableRateLimit?: boolean;
    rateLimit?: {
      windowMs?: number;
      max?: number;
    };
  };
}

/**
 * 🔍 Seeker 注册信息
 */
export interface SeekerRegistration {
  name: string;
  instance: SeekerImplementation;
  methods: Set<string>;
  metadata?: Record<string, any>;
}

/**
 * 📊 请求度量信息
 */
export interface RequestMetrics {
  requestId: string;
  eidolon: string;
  ritual: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: "pending" | "success" | "error";
  statusCode?: number;
  errorType?: "omen" | "wrath";
}

/**
 * 🚨 错误处理配置
 */
export interface ErrorHandlerConfig {
  includeStackTrace?: boolean;
  logErrors?: boolean;
  customErrorMap?: Record<string, Omen>;
}
