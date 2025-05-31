/**
 * TypeScript Resource API (TRA) - 配置管理
 * 使用Vite官方环境变量方案，零依赖且原生支持
 */

import type { ApiPaths, RealtimeConfig, ResourceConfig } from "./types";

/**
 * 默认配置值 - 修正：默认使用相对路径
 */
const DEFAULT_CONFIG = {
  baseUrl: "", // 🔧 修正：默认空字符串，使用相对路径
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  retries: 3,
  retryDelay: 1000,
  apiPaths: {
    resources: "/api/resources",
    realtime: "/api/realtime",
  },
} as const;

/**
 * 从Vite环境变量获取配置
 * 使用官方 import.meta.env 方式
 */
function getEnvConfig(): Partial<ResourceConfig> {
  // 在非Vite环境（如测试）中返回空配置
  if (typeof import.meta === "undefined" || !import.meta.env) {
    return {};
  }

  const env = import.meta.env;
  const config: Partial<ResourceConfig> = {};

  // 基础配置
  if (env.VITE_TRA_BASE_URL) {
    config.baseUrl = env.VITE_TRA_BASE_URL;
  }

  if (env.VITE_TRA_TIMEOUT) {
    const timeout = parseInt(env.VITE_TRA_TIMEOUT, 10);
    if (!isNaN(timeout)) {
      config.timeout = timeout;
    }
  }

  if (env.VITE_TRA_RETRIES) {
    const retries = parseInt(env.VITE_TRA_RETRIES, 10);
    if (!isNaN(retries)) {
      config.retries = retries;
    }
  }

  if (env.VITE_TRA_RETRY_DELAY) {
    const retryDelay = parseInt(env.VITE_TRA_RETRY_DELAY, 10);
    if (!isNaN(retryDelay)) {
      config.retryDelay = retryDelay;
    }
  }

  // Headers配置
  if (env.VITE_TRA_CONTENT_TYPE) {
    config.headers = {
      "Content-Type": env.VITE_TRA_CONTENT_TYPE,
    };
  }

  // API路径配置
  const apiPaths: Partial<ApiPaths> = {};
  if (env.VITE_TRA_RESOURCES_PATH) {
    apiPaths.resources = env.VITE_TRA_RESOURCES_PATH;
  }
  if (env.VITE_TRA_REALTIME_PATH) {
    apiPaths.realtime = env.VITE_TRA_REALTIME_PATH;
  }

  if (Object.keys(apiPaths).length > 0) {
    config.apiPaths = apiPaths;
  }

  return config;
}

/**
 * 合并配置对象
 */
function mergeConfig<T extends ResourceConfig>(
  base: Required<T>,
  override?: Partial<ResourceConfig>,
): Required<T> {
  if (!override) {
    return base;
  }

  const result = { ...base };

  if (override.baseUrl !== undefined) {
    result.baseUrl = override.baseUrl;
  }

  if (override.timeout !== undefined) {
    result.timeout = override.timeout;
  }

  if (override.retries !== undefined) {
    result.retries = override.retries;
  }

  if (override.retryDelay !== undefined) {
    result.retryDelay = override.retryDelay;
  }

  if (override.headers !== undefined) {
    result.headers = { ...result.headers, ...override.headers };
  }

  if (override.apiPaths !== undefined) {
    result.apiPaths = { ...result.apiPaths, ...override.apiPaths };
  }

  return result;
}

/**
 * 获取完整的基础资源配置
 */
export function getResourceConfig(
  userConfig?: Partial<ResourceConfig>,
): Required<ResourceConfig> {
  const envConfig = getEnvConfig();
  const baseConfig = mergeConfig(DEFAULT_CONFIG, envConfig);
  return mergeConfig(baseConfig, userConfig);
}

/**
 * 获取完整的实时资源配置
 */
export function getRealtimeConfig(
  userConfig?: Partial<RealtimeConfig>,
): Required<RealtimeConfig> {
  const envConfig = getEnvConfig();
  const defaultRealtimeConfig = {
    ...DEFAULT_CONFIG,
    reconnect: true,
    reconnectDelay: 3000,
  };
  const baseConfig = mergeConfig(defaultRealtimeConfig, envConfig);
  return mergeConfig(baseConfig, userConfig);
}

/**
 * 构建资源API路径（相对路径）
 * 返回: /api/resources/ResourceName
 */
export function buildResourcePath(
  resourceName: string,
  config?: Partial<ResourceConfig>,
): string {
  const finalConfig = getResourceConfig(config);
  return `${finalConfig.apiPaths.resources}/${resourceName}`;
}

/**
 * 构建实时API路径（相对路径）
 * 返回: /api/realtime/ResourceName
 */
export function buildRealtimePath(
  resourceName: string,
  config?: Partial<RealtimeConfig>,
): string {
  const finalConfig = getRealtimeConfig(config);
  return `${finalConfig.apiPaths.realtime}/${resourceName}`;
}

/**
 * 构建完整的API URL（仅供外部使用）
 * 返回: http://localhost:3000/api/resources/ResourceName
 */
export function buildApiUrl(
  resourceName: string,
  config?: Partial<ResourceConfig>,
): string {
  const finalConfig = getResourceConfig(config);
  const path = buildResourcePath(resourceName, config);
  return `${finalConfig.baseUrl}${path}`;
}

/**
 * 构建完整的实时API URL（仅供外部使用）
 * 返回: http://localhost:3000/api/realtime/ResourceName
 */
export function buildRealtimeUrl(
  resourceName: string,
  config?: Partial<RealtimeConfig>,
): string {
  const finalConfig = getRealtimeConfig(config);
  const path = buildRealtimePath(resourceName, config);
  return `${finalConfig.baseUrl}${path}`;
}

/**
 * 调试用：显示当前有效配置
 */
export function debugConfig(): void {
  if (import.meta.env.DEV) {
    console.group("🔧 TRA Configuration");
    console.log("Environment variables:", getEnvConfig());
    console.log("Final resource config:", getResourceConfig());
    console.log("Final realtime config:", getRealtimeConfig());
    console.groupEnd();
  }
}
