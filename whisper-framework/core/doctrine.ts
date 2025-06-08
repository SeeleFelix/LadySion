/**
 * 🔮 Whisper Framework - Doctrine（教义）配置系统
 * 约定大于配置，但所有都可以配置，对业务系统零侵入
 */

import type { Doctrine } from "../types/core.ts";
import { WrathError } from "../types/core.ts";
import defaultDoctrine from "../config/doctrine.json" with { type: "json" };

/**
 * 🎯 配置文件路径约定
 */
const PROJECT_CONFIG_PATHS = [
  "./whisper.config.json",
  "./whisper.config.js", 
  "./config/whisper.json",
  "./.whisperrc.json"
];

/**
 * 📋 缓存配置以避免重复读取
 */
let cachedProjectConfig: Partial<Doctrine> | null = null;
let configCacheTime = 0;
const CACHE_TTL = 30000; // 30秒缓存

/**
 * 🔍 智能读取项目配置文件
 */
async function loadProjectConfig(): Promise<Partial<Doctrine>> {
  const now = Date.now();
  
  // 缓存有效，直接返回
  if (cachedProjectConfig && (now - configCacheTime) < CACHE_TTL) {
    return cachedProjectConfig;
  }
  
  for (const configPath of PROJECT_CONFIG_PATHS) {
    try {
      // 检查文件是否存在
      const stat = await Deno.stat(configPath);
      if (!stat.isFile) continue;
      
      let config: Partial<Doctrine>;
      
      if (configPath.endsWith('.js')) {
        // 动态导入JS配置
        const module = await import(`file://${Deno.cwd()}/${configPath}`);
        config = module.default || module;
      } else {
        // JSON配置
        const content = await Deno.readTextFile(configPath);
        config = JSON.parse(content);
      }
      
      // 缓存配置
      cachedProjectConfig = config;
      configCacheTime = now;
      
      return config;
    } catch (error) {
      // 文件不存在或读取失败，继续尝试下一个
      if (error instanceof Deno.errors.NotFound) {
        continue;
      }
      
      // 其他错误（如JSON解析错误）抛出WrathError
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new WrathError(
        `Failed to load config from ${configPath}: ${errorMessage}`,
        {
          code: 0,
          status: 'error',
          message: `配置文件解析失败: ${configPath}`,
          signal: 'config_error'
        },
        { path: configPath, originalError: error }
      );
    }
  }
  
  // 没找到项目配置，返回空对象
  cachedProjectConfig = {};
  configCacheTime = now;
  return {};
}

/**
 * 🔐 智能构建HTTP Headers
 */
function buildHeaders(doctrine: Required<Doctrine>): Record<string, string> {
  const headers: Record<string, string> = {
    ...doctrine.headers
  };
  
  // 设置Content-Type
  if (doctrine.contentType && !headers['Content-Type']) {
    headers['Content-Type'] = doctrine.contentType;
  }
  
  // 处理认证
  if (doctrine.auth) {
    switch (doctrine.auth.type) {
      case 'bearer':
        if (doctrine.auth.token) {
          headers['Authorization'] = `Bearer ${doctrine.auth.token}`;
        }
        break;
        
      case 'basic':
        if (doctrine.auth.username && doctrine.auth.password) {
          const credentials = btoa(`${doctrine.auth.username}:${doctrine.auth.password}`);
          headers['Authorization'] = `Basic ${credentials}`;
        }
        break;
        
      case 'custom':
        if (doctrine.auth.custom) {
          Object.assign(headers, doctrine.auth.custom);
        }
        break;
    }
  }
  
  // 生成请求ID用于追踪
  if (doctrine.enableMetrics && doctrine.requestId) {
    headers['X-Request-ID'] = doctrine.requestId();
  }
  
  // 环境标识
  if (doctrine.environment) {
    headers['X-Environment'] = doctrine.environment;
  }
  
  return headers;
}

/**
 * 🌟 深度合并配置对象
 */
function deepMergeConfig(...configs: Partial<Doctrine>[]): Partial<Doctrine> {
  const result: Partial<Doctrine> = {};
  
  for (const config of configs) {
    if (!config) continue;
    
    for (const [key, value] of Object.entries(config)) {
      if (value === null || value === undefined) continue;
      
      if (key === 'headers' || key === 'auth') {
        // 对象类型需要合并
        const existingValue = result[key as keyof Doctrine];
        if (typeof existingValue === 'object' && existingValue !== null && typeof value === 'object' && value !== null) {
          result[key as keyof Doctrine] = {
            ...existingValue,
            ...value
          } as any;
        } else {
          result[key as keyof Doctrine] = value as any;
        }
      } else {
        // 基础类型直接覆盖
        result[key as keyof Doctrine] = value as any;
      }
    }
  }
  
  return result;
}

/**
 * 🔧 应用默认值并验证配置
 */
function applyDefaultsAndValidate(config: Partial<Doctrine>): Required<Doctrine> {
  const defaults: Required<Doctrine> = {
    baseUrl: 'http://localhost:8000',
    timeout: 30000,
    whisperPath: '/whisper',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'WhisperFramework/1.0'
    },
    auth: undefined as any,
    retries: 3,
    retryDelay: 1000,
    retryBackoff: 'exponential' as const,
    contentType: 'application/json',
    responseType: 'json',
    environment: Deno.env.get('NODE_ENV') || 'development',
    debug: false,
    logger: undefined as any,
    enableMetrics: false,
    requestId: () => crypto.randomUUID(),
    validateSSL: true,
    corsEnabled: true
  };
  
  const merged = deepMergeConfig(defaults, config) as Required<Doctrine>;
  
  // 验证关键配置
  if (!merged.baseUrl) {
    throw new WrathError(
      'baseUrl is required in doctrine configuration',
      {
        code: 0,
        status: 'error',
        message: 'baseUrl配置不能为空',
        signal: 'config_error'
      }
    );
  }
  
  if (merged.timeout <= 0) {
    throw new WrathError(
      'timeout must be greater than 0',
      {
        code: 0,
        status: 'error',
        message: 'timeout配置必须大于0',
        signal: 'config_error'
      }
    );
  }
  
  // 构建最终headers
  merged.headers = buildHeaders(merged);
  
  return merged;
}

/**
 * 🕯️ 获取完整的Doctrine配置
 * 优先级：运行时覆盖 > 环境变量 > 项目配置 > 框架默认
 */
export async function getDoctrine(overrides?: Partial<Doctrine>): Promise<Required<Doctrine>> {
  try {
    // 1. 框架默认配置
    const frameworkDefaults = defaultDoctrine.default;
    
    // 2. 项目配置文件
    const projectConfig = await loadProjectConfig();
    
    // 3. 环境变量配置
    const envConfig: Partial<Doctrine> = {};
    if (Deno.env.get('WHISPER_BASE_URL')) {
      envConfig.baseUrl = Deno.env.get('WHISPER_BASE_URL');
    }
    if (Deno.env.get('WHISPER_TIMEOUT')) {
      envConfig.timeout = parseInt(Deno.env.get('WHISPER_TIMEOUT')!);
    }
    if (Deno.env.get('WHISPER_DEBUG')) {
      envConfig.debug = Deno.env.get('WHISPER_DEBUG') === 'true';
    }
    if (Deno.env.get('WHISPER_AUTH_TOKEN')) {
      envConfig.auth = {
        type: 'bearer',
        token: Deno.env.get('WHISPER_AUTH_TOKEN')
      };
    }
    
    // 4. 合并所有配置
    const finalConfig = deepMergeConfig(
      frameworkDefaults as Partial<Doctrine>,
      projectConfig,
      envConfig,
      overrides || {}
    );
    
    return applyDefaultsAndValidate(finalConfig);
    
  } catch (error) {
    if (error instanceof WrathError) {
      throw error;
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new WrathError(
      `Failed to load doctrine configuration: ${errorMessage}`,
      {
        code: 0,
        status: 'error',
        message: '配置系统初始化失败',
        signal: 'config_error'
      },
      { originalError: error }
    );
  }
}

/**
 * 🌟 同步版本（用于已缓存的配置）
 */
export function getDoctrineSync(overrides?: Partial<Doctrine>): Required<Doctrine> {
  if (!cachedProjectConfig) {
    // 第一次调用必须使用异步版本
    throw new WrathError(
      'Must call getDoctrine() first to initialize configuration',
      {
        code: 0,
        status: 'error',
        message: '必须先调用getDoctrine()初始化配置',
        signal: 'config_error'
      }
    );
  }
  
  const frameworkDefaults = defaultDoctrine.default;
  const envConfig: Partial<Doctrine> = {};
  // ... 省略环境变量处理逻辑，与异步版本相同
  
  const finalConfig = deepMergeConfig(
    frameworkDefaults as Partial<Doctrine>,
    cachedProjectConfig,
    envConfig,
    overrides || {}
  );
  
  return applyDefaultsAndValidate(finalConfig);
}

/**
 * 🔄 清除配置缓存（用于测试或热重载）
 */
export function clearDoctrineCache(): void {
  cachedProjectConfig = null;
  configCacheTime = 0;
}

/**
 * 📋 导出配置示例生成器
 */
export function generateConfigTemplate(): string {
  return JSON.stringify({
    baseUrl: "https://api.yourcompany.com",
    timeout: 60000,
    whisperPath: "/api/whisper",
    debug: false,
    auth: {
      type: "bearer",
      token: "${AUTH_TOKEN}"
    },
    headers: {
      "X-API-Version": "v1",
      "X-Client": "web-app"
    },
    retries: 5,
    retryBackoff: "exponential",
    enableMetrics: true
  }, null, 2);
} 