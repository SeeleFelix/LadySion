/**
 * TypeScript Resource API (TRA) - 类型定义
 * 统一管理所有TRA相关的类型定义
 */

/**
 * API路径配置
 */
export interface ApiPaths {
  resources: string; // 资源API路径前缀
  realtime: string; // 实时API路径前缀
}

/**
 * 基础配置接口
 */
export interface ResourceConfig {
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
  // 扩展配置选项
  retries?: number;
  retryDelay?: number;
  // API路径配置
  apiPaths?: Partial<ApiPaths>;
}

/**
 * HTTP请求选项
 */
export interface RequestOptions {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  headers: Record<string, string>;
  body?: string;
  timeout?: number;
}

/**
 * TRA错误类型
 */
export class TRAError extends Error {
  constructor(
    message: string,
    public status?: number,
    public statusText?: string,
    public url?: string,
  ) {
    super(message);
    this.name = "TRAError";
  }
}

/**
 * 排序方向
 */
export type SortDirection = "ASC" | "DESC";

/**
 * 排序字段配置
 */
export interface SortField {
  field: string;
  direction: SortDirection;
}

/**
 * 排序配置 - 相当于Spring Data的Sort
 */
export interface Sort {
  fields: SortField[];
}

/**
 * 分页请求参数 - 相当于Spring Data的Pageable
 */
export interface Pageable {
  page: number; // 页码，从0开始
  size: number; // 每页大小
  sort?: Sort; // 排序配置（可选）
}

/**
 * 分页响应结果 - 相当于Spring Data的Page<T>
 */
export interface Page<T> {
  content: T[]; // 当前页的数据
  totalElements: number; // 总记录数
  totalPages: number; // 总页数
  size: number; // 每页大小
  number: number; // 当前页码（从0开始）
  numberOfElements: number; // 当前页实际记录数
  first: boolean; // 是否第一页
  last: boolean; // 是否最后一页
  empty: boolean; // 是否为空页
}

/**
 * 🚀 完全动态化的Resource接口
 * 设计理念：约定大于配置，支持任意方法名
 * 
 * 特性：
 * 1. 包含标准CRUD方法的类型定义（IDE支持）
 * 2. 通过索引签名支持任意动态方法
 * 3. 无需预定义方法，完全运行时动态
 */
export interface Resource<T> {
  // ==========================================
  // 标准CRUD方法 - 提供类型安全和IDE支持
  // ==========================================
  
  // 查询操作
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  findAllPaged(pageable: Pageable): Promise<Page<T>>;

  // 创建操作
  create(entity: Omit<T, "id">): Promise<T>;

  // 更新操作
  update(id: string, entity: Omit<T, "id">): Promise<T>;
  patch(id: string, partial: Partial<Omit<T, "id">>): Promise<T>;

  // 删除操作
  deleteById(id: string): Promise<void>;

  // ==========================================
  // 🔥 动态方法支持 - 约定大于配置
  // ==========================================
  
  /**
   * 索引签名：支持任意方法名的动态调用
   * 
   * 使用示例：
   * - JPA风格查询：findByUsername(username: string)
   * - 自定义方法：getActiveUsers(), countByStatus(status: string)
   * - 任意方法：customMethod(...args: any[])
   * 
   * 约定：所有动态方法都会转换为 POST /api/whisper/{model}/{methodName}
   */
  [methodName: string]: (...args: any[]) => Promise<any>;
}

/**
 * 🎯 简化的Resource类型 - 纯动态化
 * 如果你不需要标准CRUD方法的类型提示，可以使用这个更简洁的版本
 */
export interface DynamicResource<T = any> {
  /**
   * 支持任意方法名的动态调用
   * 约定：methodName(...args) => POST /api/whisper/{model}/{methodName}
   */
  [methodName: string]: (...args: any[]) => Promise<any>;
}

/**
 * 实时资源配置
 */
export interface RealtimeConfig extends ResourceConfig {
  reconnect?: boolean;
  reconnectDelay?: number;
}

/**
 * 实时资源接口 - 基于DynamicResource，特殊处理subscribe方法
 */
export interface RealtimeResource<T> extends DynamicResource<T> {
  // 标准CRUD方法 - 明确声明
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  findAllPaged(pageable: Pageable): Promise<Page<T>>;
  create(entity: Omit<T, "id">): Promise<T>;
  update(id: string, entity: Omit<T, "id">): Promise<T>;
  patch(id: string, partial: Partial<Omit<T, "id">>): Promise<T>;
  deleteById(id: string): Promise<void>;

  /**
   * 订阅资源变更 - 完全屏蔽底层实现
   * 注意：subscribe方法返回取消函数，不是Promise
   */
  subscribe(callback: (item: T) => void): Promise<() => void>;
  subscribe(
    callback: (item: T) => void,
    errorCallback: (error: Error) => void,
  ): Promise<() => void>;
}

/**
 * 资源代理创建函数类型 - 支持灵活的类型参数和JPA字段验证
 */
export type CreateResourceProxy = {
  // 带字段验证的JPA风格资源
  <TResource extends Resource<any>>(
    resourceName: string,
    entityFields: string[],
    config?: ResourceConfig,
  ): TResource;
  
  // 向后兼容：不带字段验证的资源（仅支持标准CRUD）
  <TResource extends Resource<any>>(
    resourceName: string,
    config?: ResourceConfig,
  ): TResource;
  
  // 纯动态Resource接口（不推荐，仅向后兼容）
  <T = any>(
    resourceName: string,
    entityFields: string[],
    config?: ResourceConfig,
  ): DynamicResource<T>;
};

/**
 * 实时资源代理创建函数类型
 */
export type CreateRealtimeResourceProxy = <
  TResource extends RealtimeResource<any>,
>(
  resourceName: string,
  config?: RealtimeConfig,
) => TResource;
