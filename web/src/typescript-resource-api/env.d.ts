/**
 * Vite环境变量类型声明
 * 为TRA配置提供类型安全的环境变量支持
 */

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TRA_BASE_URL?: string
  readonly VITE_TRA_TIMEOUT?: string
  readonly VITE_TRA_RETRIES?: string
  readonly VITE_TRA_RETRY_DELAY?: string
  readonly VITE_TRA_CONTENT_TYPE?: string
  readonly VITE_TRA_RESOURCES_PATH?: string
  readonly VITE_TRA_REALTIME_PATH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 