/**
 * TRA 配置和环境管理
 * 统一配置接口，支持开发/生产环境
 */

import type { ApiPaths, RealtimeConfig, ResourceConfig } from "./types.ts";

// 默认配置，参考Spring Boot application.yml
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
 * 环境变量接口
 */
interface EnvironmentConfig {
  DEV?: boolean;
  VITE_API_BASE_URL?: string;
  VITE_WHISPER_TIMEOUT?: string;
}

/**
 * Whisper API基础配置
 */
export interface WhisperConfig {
  baseUrl: string;
  headers?: Record<string, string>;
  timeout?: number;
}

function getEnvValue(key: string, defaultValue: string = ""): string {
  try {
    // 首先尝试从Deno环境变量获取
    const denoValue = Deno.env.get(key);
    if (denoValue) return denoValue;
    
    // 然后尝试从global对象获取（如果在浏览器环境中）
    if (typeof globalThis !== "undefined" && (globalThis as any).process?.env?.[key]) {
      return (globalThis as any).process.env[key];
    }
    
    // 最后返回默认值
    return defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * 获取环境配置
 */
function getEnvironmentConfig(): EnvironmentConfig {
  return {
    DEV: getEnvValue("DEV") === "true" || getEnvValue("NODE_ENV") === "development",
    VITE_API_BASE_URL: getEnvValue("VITE_API_BASE_URL", "http://localhost:8080"),
    VITE_WHISPER_TIMEOUT: getEnvValue("VITE_WHISPER_TIMEOUT", "5000"),
  };
}

/**
 * 从环境变量获取配置
 */
function getEnvConfig(): Partial<ResourceConfig> {
  const config: Partial<ResourceConfig> = {};

  // 基础配置
  const baseUrl = getEnvValue("VITE_TRA_BASE_URL");
  if (baseUrl) {
    config.baseUrl = baseUrl;
  }

  const timeout = getEnvValue("VITE_TRA_TIMEOUT");
  if (timeout) {
    const timeoutNum = parseInt(timeout, 10);
    if (!isNaN(timeoutNum)) {
      config.timeout = timeoutNum;
    }
  }

  const retries = getEnvValue("VITE_TRA_RETRIES");
  if (retries) {
    const retriesNum = parseInt(retries, 10);
    if (!isNaN(retriesNum)) {
      config.retries = retriesNum;
    }
  }

  const retryDelay = getEnvValue("VITE_TRA_RETRY_DELAY");
  if (retryDelay) {
    const retryDelayNum = parseInt(retryDelay, 10);
    if (!isNaN(retryDelayNum)) {
      config.retryDelay = retryDelayNum;
    }
  }

  // Headers配置
  const contentType = getEnvValue("VITE_TRA_CONTENT_TYPE");
  if (contentType) {
    config.headers = {
      "Content-Type": contentType,
    };
  }

  // API路径配置
  const apiPaths: Partial<ApiPaths> = {};
  const resourcesPath = getEnvValue("VITE_TRA_RESOURCES_PATH");
  if (resourcesPath) {
    apiPaths.resources = resourcesPath;
  }
  const realtimePath = getEnvValue("VITE_TRA_REALTIME_PATH");
  if (realtimePath) {
    apiPaths.realtime = realtimePath;
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
 * 解析并返回运行时配置
 * 动态从环境变量和默认配置中合并配置
 */
export function getWhisperConfig(
  customConfig: Partial<WhisperConfig> = {},
): WhisperConfig {
  const baseUrl = getEnvValue("VITE_API_BASE_URL", "http://localhost:8080");
  const timeout = getEnvValue("VITE_WHISPER_TIMEOUT", "5000");
  
  const baseConfig: WhisperConfig = {
    baseUrl,
    headers: {
      "Content-Type": "application/json",
    },
    timeout: parseInt(timeout, 10),
  };

  // 合并自定义配置
  return {
    ...baseConfig,
    ...customConfig,
    headers: {
      ...baseConfig.headers,
      ...customConfig.headers,
    },
  };
}

/**
 * 获取完整的whisper API URL
 * @param model 资源模型名称
 * @param method 方法名称
 * @param config 可选配置
 * @returns 完整的API URL
 */
export function buildWhisperUrl(
  model: string,
  method: string,
  config?: Partial<WhisperConfig>,
): string {
  const fullConfig = getWhisperConfig(config);
  
  // 构建标准的whisper URL: /api/whisper/<model>/<method>
  const path = `/api/whisper/${model}/${method}`;
  
  // 如果baseUrl已经是完整URL，直接拼接路径
  if (fullConfig.baseUrl.startsWith("http")) {
    const baseUrl = fullConfig.baseUrl.endsWith("/")
      ? fullConfig.baseUrl.slice(0, -1)
      : fullConfig.baseUrl;
    return baseUrl + path;
  }
  
  return path;
}

/**
 * 调试用：显示当前有效配置
 */
export function debugConfig(): void {
  const isDev = getEnvValue("DEV") === "true" || getEnvValue("NODE_ENV") === "development";
  if (isDev) {
    console.group("🔧 TRA Configuration");
    console.log("Environment variables:", getEnvConfig());
    console.log("Final resource config:", getResourceConfig());
    console.log("Final realtime config:", getRealtimeConfig());
    console.log("Final whisper config:", getWhisperConfig());
    console.groupEnd();
  }
}

/**
 * 验证配置有效性
 */
export function validateConfig(config: WhisperConfig): boolean {
  if (!config.baseUrl) {
    console.error("[TRA] 配置错误: baseUrl 不能为空");
    return false;
  }
  
  if (config.timeout && config.timeout < 0) {
    console.error("[TRA] 配置错误: timeout 不能为负数");
    return false;
  }
  
  return true;
}

// 导出默认配置供测试使用
export { DEFAULT_CONFIG };

/**
 * 预设配置 - 针对常见环境
 */
export const PRESET_CONFIGS = {
  development: {
    baseUrl: "http://localhost:8080",
    headers: { "Content-Type": "application/json" },
    timeout: 10000,
  },
  production: {
    baseUrl: "https://api.ladysion.com",
    headers: { "Content-Type": "application/json" },
    timeout: 5000,
  },
  testing: {
    baseUrl: "http://localhost:3000",
    headers: { "Content-Type": "application/json" },
    timeout: 30000,
  },
} as const;

/**
 * 根据环境名称获取预设配置
 */
export function getPresetConfig(
  environment: keyof typeof PRESET_CONFIGS,
): WhisperConfig {
  return PRESET_CONFIGS[environment];
}
