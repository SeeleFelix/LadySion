/**
 * TypeScript Resource API (TRA) - 统一导出
 * Spring Data JPA风格的TypeScript资源API
 */

// 类型导出
export type {
  Resource,
  RealtimeResource,
  ResourceConfig,
  RealtimeConfig,
  RequestOptions,
  CreateResourceProxy,
  CreateRealtimeResourceProxy
} from './types'

// 错误类导出
export { TRAError } from './types'

// 主要功能导出
export { createResourceProxy } from './createResourceMapper'
export { createRealtimeResourceProxy } from './createRealtimeResourceMapper'

// HTTP客户端导出（高级用法）
export { HttpClient } from './httpClient'

// 默认导出主要功能
export { createResourceProxy as default } from './createResourceMapper' 