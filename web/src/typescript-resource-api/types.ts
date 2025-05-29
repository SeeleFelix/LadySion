/**
 * TypeScript Resource API (TRA) - 类型定义
 * 统一管理所有TRA相关的类型定义
 */

/**
 * 基础配置接口
 */
export interface ResourceConfig {
  baseUrl?: string
  timeout?: number
  headers?: Record<string, string>
  // 扩展配置选项
  retries?: number
  retryDelay?: number
}

/**
 * HTTP请求选项
 */
export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  url: string
  headers: Record<string, string>
  body?: string
  timeout?: number
}

/**
 * TRA错误类型
 */
export class TRAError extends Error {
  constructor(
    message: string,
    public status?: number,
    public statusText?: string,
    public url?: string
  ) {
    super(message)
    this.name = 'TRAError'
  }
}

/**
 * 基础Resource接口 - 相当于Spring Data JPA的CrudRepository<T, ID>
 * 明确区分：update=全量更新，patch=部分更新，都不包含id
 */
export interface Resource<T> {
  // 查询操作
  findAll(): Promise<T[]>
  findById(id: string): Promise<T | null>
  
  // 创建操作 - Omit<T, 'id'> 表示排除id字段的T类型
  create(entity: Omit<T, 'id'>): Promise<T>
  
  // 更新操作
  update(id: string, entity: Omit<T, 'id'>): Promise<T>           // 全量更新，不包含id
  patch(id: string, partial: Partial<Omit<T, 'id'>>): Promise<T> // 部分更新，排除id后所有字段可选
  
  // 删除操作
  deleteById(id: string): Promise<void>
}

/**
 * 实时资源配置
 */
export interface RealtimeConfig extends ResourceConfig {
  reconnect?: boolean
  reconnectDelay?: number
}

/**
 * 实时资源接口 - 完全屏蔽HTTP层的高级抽象
 * 设计理念：像ORM屏蔽SQL一样，完全屏蔽HTTP/SSE细节
 */
export interface RealtimeResource<T> extends Resource<T> {
  /**
   * 订阅资源变更 - 完全屏蔽底层实现
   * 用户只需要处理业务对象，不需要知道HTTP/SSE的存在
   */
  subscribe(callback: (item: T) => void): () => void
  
  /**
   * 订阅资源变更，支持错误处理
   */
  subscribe(
    callback: (item: T) => void,
    errorCallback: (error: Error) => void
  ): () => void
}

/**
 * 资源代理创建函数类型
 */
export type CreateResourceProxy = <TResource extends Resource<any>>(
  resourceName: string,
  config?: ResourceConfig
) => TResource

/**
 * 实时资源代理创建函数类型
 */
export type CreateRealtimeResourceProxy = <TResource extends RealtimeResource<any>>(
  resourceName: string,
  config?: RealtimeConfig
) => TResource 