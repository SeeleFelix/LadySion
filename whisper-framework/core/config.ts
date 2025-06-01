/**
 * 🔧 Whisper Framework 配置管理
 * 从配置文件读取和管理Doctrine配置
 */

import type { Doctrine } from "../types/core.ts";
import doctrineConfig from "../config/doctrine.json" with { type: "json" };

/**
 * 获取当前环境名称
 */
function getCurrentEnvironment(): string {
  // 优先使用环境变量，其次是Deno.env，最后默认为development
  return Deno.env.get("WHISPER_ENV") || 
         Deno.env.get("NODE_ENV") || 
         "development";
}

/**
 * 合并配置对象
 */
function mergeConfig(base: Partial<Doctrine>, override: Partial<Doctrine>): Required<Doctrine> {
  return {
    baseUrl: override.baseUrl ?? base.baseUrl ?? "",
    timeout: override.timeout ?? base.timeout ?? 30000,
    headers: {
      ...base.headers,
      ...override.headers,
    },
    retries: override.retries ?? base.retries ?? 3,
    retryDelay: override.retryDelay ?? base.retryDelay ?? 1000,
    whisperPath: override.whisperPath ?? base.whisperPath ?? "/whisper",
  };
}

/**
 * 🕯️ 获取Doctrine配置
 * 支持环境特定配置和运行时覆盖
 */
export function getDoctrine(overrides?: Partial<Doctrine>): Required<Doctrine> {
  const env = getCurrentEnvironment();
  const defaultConfig = doctrineConfig.default;
  const envConfig = doctrineConfig[env as keyof typeof doctrineConfig] || {};
  
  // 配置优先级：运行时覆盖 > 环境配置 > 默认配置
  let finalConfig = mergeConfig(defaultConfig, envConfig);
  
  if (overrides) {
    finalConfig = mergeConfig(finalConfig, overrides);
  }
  
  return finalConfig;
}

/**
 * 🌟 设置全局配置覆盖
 */
let globalOverrides: Partial<Doctrine> = {};

export function setGlobalDoctrine(overrides: Partial<Doctrine>): void {
  globalOverrides = { ...globalOverrides, ...overrides };
}

export function getGlobalDoctrine(): Required<Doctrine> {
  return getDoctrine(globalOverrides);
} 