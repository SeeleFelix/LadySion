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
} from "./types.ts";
import { HttpClient } from "./httpClient.ts";
import { isValidQueryMethod, parseQueryMethodName } from "./utils/queryMethodParser.ts";

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
   * 创建资源代理对象 - 使用Proxy拦截动态方法调用
   */
  createProxy(): Resource<T> {
    const baseResource = {
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

    // 🔥 使用Proxy拦截动态方法调用 - Spring Data JPA风格
    return new Proxy(baseResource, {
      get: (target: any, prop: string | symbol) => {
        // 如果属性存在于基础对象中，直接返回
        if (prop in target) {
          return target[prop];
        }

        // 如果是字符串属性且符合查询方法模式，创建动态方法
        if (typeof prop === 'string' && isValidQueryMethod(prop)) {
          return (...args: any[]) => {
            // 解析方法名获取查询信息
            const queryInfo = parseQueryMethodName(prop);
            
            if (!queryInfo.isValid) {
              throw new Error(`不支持的查询方法: ${prop}`);
            }

            // 使用whisper API调用动态方法
            return this.whisperCall(prop, args);
          };
        }

        // 其他情况返回undefined（会导致"is not a function"错误）
        return undefined;
      },
    });
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
