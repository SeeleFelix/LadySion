/**
 * 🌟 Whisper Framework - 核心类型定义
 * 简洁的工厂函数模式，在scripture中创建seeker实例
 */

// 🔮 Eidolon（映灵）- 核心数据类型基础接口
export interface Eidolon {
}

// 🎭 Spell（法术）- 多参数列表，保留参数顺序
export interface Spell {
  args: any[]; // 参数值列表
}

// 🔱 Omen（神启）- 状态信息
export interface Omen {
  code: number;
  status: "success" | "error" | "warning";
  message: string;
  signal?: string;
}

// ✨ Grace（神恩）- 统一响应格式
export interface Grace<TEidolon = any> {
  eidolon: TEidolon | TEidolon[] | null;
  omen: Omen;
  timestamp: number;
}

// 🌟 Whisper（低语祷告）- 框架内部请求结构
export interface Whisper {
  eidolon: string; // 目标映灵名称
  ritual: string; // 仪式名称
  spell: Spell; // 法术内容（多参数列表）
}

// 🙏 Seeker（祈祷者）- 基类接口
export interface Seeker<T extends Eidolon> {
}

// ⚡ Doctrine（教义）- 强大的配置系统
export interface Doctrine {
  // 🌐 HTTP配置
  baseUrl?: string;
  timeout?: number;
  whisperPath?: string;

  // 🔐 认证与安全
  headers?: Record<string, string>;
  auth?: {
    type?: "bearer" | "basic" | "custom";
    token?: string;
    username?: string;
    password?: string;
    custom?: Record<string, string>;
  };

  // 🔄 重试与容错
  retries?: number;
  retryDelay?: number;
  retryBackoff?: "linear" | "exponential";

  // 🎯 请求配置
  contentType?: string;
  responseType?: "json" | "text" | "blob";

  // 🔧 环境与调试
  environment?: string;
  debug?: boolean;
  logger?: (message: string, data?: any) => void;

  // 📊 监控与性能
  enableMetrics?: boolean;
  requestId?: () => string;

  // 🛡️ 安全配置
  validateSSL?: boolean;
  corsEnabled?: boolean;
}

// 🎯 createSeeker工厂函数类型
export type CreateSeeker = <TSeeker extends Seeker<any>>(
  eidolonName: string,
  doctrine?: Doctrine,
) => TSeeker;

// 🚨 异常类型定义

/**
 * 🔥 WrathError - 系统异常（Wrath神怒）
 * HTTP错误、网络错误、JSON解析错误等不可处理的意外
 */
export class WrathError extends Error {
  constructor(
    message: string,
    public omen: Omen,
    public details?: any,
  ) {
    super(message);
    this.name = "WrathError";
  }
}

/**
 * 📋 OmenError - 业务异常（基于Omen神启）
 * 业务逻辑中可以处理的错误，如用户不存在、权限不足等
 */
export class OmenError extends Error {
  constructor(
    message: string,
    public omen: Omen,
    public details?: any,
  ) {
    super(message);
    this.name = "OmenError";
  }
}
