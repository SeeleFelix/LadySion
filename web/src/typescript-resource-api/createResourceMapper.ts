/**
 * TypeScript Resource API (TRA) - Spring Data JPA风格实现
 * 参考Spring Data JPA的 JpaRepository<T, ID> 模式
 * 提供RESTful CRUD操作：create、update、patch、delete
 * 重构版本：使用Vite官方配置管理，消除硬编码
 */

import {
  CreateResourceProxy,
  Page,
  Pageable,
  Resource,
  ResourceConfig,
} from "./types";
import { HttpClient } from "./httpClient";

/**
 * 资源代理工厂 - 负责创建资源代理实例
 */
class ResourceProxyFactory<T> {
  private httpClient: HttpClient;
  private resourceName: string;

  constructor(resourceName: string, config?: ResourceConfig) {
    this.httpClient = new HttpClient(config);
    this.resourceName = resourceName;
  }

  private whisperCall<R>(method: string, args: any[] = []): Promise<R> {
    return this.httpClient.request<R>({
      method: "POST",
      url: `/api/whisper/${this.resourceName}/${method}`,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ args }),
    });
  }

  /**
   * 创建资源代理对象 - 使用工厂模式，职责更清晰
   */
  createProxy(): Resource<T> {
    return {
      // 查询操作
      findAll: () => this.whisperCall<T[]>("findAll"),

      findById: (id: string) => this.whisperCall<T | null>("findById", [id]),

      // 🆕 分页查询操作 - 使用专用URL构建器
      findAllPaged: (pageable: Pageable) =>
        this.whisperCall<Page<T>>("findAllPaged", [pageable]),

      // 创建操作
      create: (entity: Omit<T, "id">) =>
        this.whisperCall<T>("create", [entity]),

      // 更新操作 - 明确类型约束
      update: (id: string, entity: Omit<T, "id">) =>
        this.whisperCall<T>("update", [id, entity]),

      patch: (id: string, partial: Partial<Omit<T, "id">>) =>
        this.whisperCall<T>("patch", [id, partial]),

      // 删除操作
      deleteById: (id: string) => this.whisperCall<void>("deleteById", [id]),
    };
  }
}

/**
 * 为继承Resource的接口创建动态代理 - 相当于Spring的@Repository动态代理
 * 重构版本：使用Vite官方配置管理，消除硬编码
 */
export const createResourceProxy: CreateResourceProxy = <
  TResource extends Resource<any>,
>(
  resourceName: string,
  config?: ResourceConfig,
): TResource => {
  // 🔧 使用工厂模式创建代理 - 更好的职责分离
  const factory = new ResourceProxyFactory(resourceName, config);
  const resourceProxy = factory.createProxy();

  // 类型断言 - 更清晰的意图表达
  return resourceProxy as TResource;
};
