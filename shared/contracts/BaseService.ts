/**
 * 前端ORM系统 - 基础服务接口
 * 定义所有服务的通用契约
 */

/**
 * 基础响应类型
 */
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

/**
 * 流式响应块类型
 */
export interface StreamChunk<T = any> {
  type: "data" | "error" | "complete";
  data?: T;
  error?: string;
}

/**
 * 基础服务接口标记
 * 所有ORM服务都应该继承这个接口
 */
export interface BaseService {
  readonly serviceName: string;
}

/**
 * 方法元数据类型
 */
export interface MethodMetadata {
  isStream?: boolean;
  httpMethod?: "GET" | "POST" | "PUT" | "DELETE";
  path?: string;
}

/**
 * 服务元数据注册表
 */
export const ServiceMetadata = new Map<string, Map<string, MethodMetadata>>();

/**
 * 注册方法元数据的辅助函数
 */
export function registerMethodMetadata(
  serviceName: string,
  methodName: string,
  metadata: MethodMetadata,
) {
  if (!ServiceMetadata.has(serviceName)) {
    ServiceMetadata.set(serviceName, new Map());
  }
  ServiceMetadata.get(serviceName)!.set(methodName, metadata);
}
