/**
 * TypeScript Resource API (TRA) - Spring Data JPA风格实现
 * 参考Spring Data JPA的 JpaRepository<T, ID> 模式
 * 提供RESTful CRUD操作：create、update、patch、delete
 * 重构版本：职责分离，使用URL构建器
 */

import { Resource, ResourceConfig, CreateResourceProxy, Pageable, Page } from './types'
import { HttpClient } from './httpClient'
import { UrlBuilder } from './utils/urlBuilder'

/**
 * 资源代理工厂 - 负责创建资源代理实例
 */
class ResourceProxyFactory<T> {
  private httpClient: HttpClient
  private urlBuilder: UrlBuilder
  
  constructor(resourceName: string, config?: ResourceConfig) {
    this.httpClient = new HttpClient(config)
    this.urlBuilder = new UrlBuilder('', resourceName)
  }
  
  /**
   * 创建资源代理对象 - 使用工厂模式，职责更清晰
   */
  createProxy(): Resource<T> {
    return {
      // 查询操作
      findAll: () => this.httpClient.get<T[]>(this.urlBuilder.getBasePath()),
      
      findById: (id: string) => this.httpClient.get<T | null>(this.urlBuilder.getResourcePath(id)),
      
      // 🆕 分页查询操作 - 使用专用URL构建器
      findAllPaged: (pageable: Pageable) => 
        this.httpClient.get<Page<T>>(this.urlBuilder.getPagedUrl(pageable)),
      
      // 创建操作
      create: (entity: Omit<T, 'id'>) => 
        this.httpClient.post<T>(this.urlBuilder.getBasePath(), entity),
      
      // 更新操作 - 明确类型约束
      update: (id: string, entity: Omit<T, 'id'>) => 
        this.httpClient.put<T>(this.urlBuilder.getResourcePath(id), entity),
      
      patch: (id: string, partial: Partial<Omit<T, 'id'>>) => 
        this.httpClient.patch<T>(this.urlBuilder.getResourcePath(id), partial),
      
      // 删除操作
      deleteById: (id: string) => 
        this.httpClient.delete(this.urlBuilder.getResourcePath(id))
    }
  }
}

/**
 * 为继承Resource的接口创建动态代理 - 相当于Spring的@Repository动态代理
 * 重构版本：使用工厂模式，消除any类型，职责更清晰
 */
export const createResourceProxy: CreateResourceProxy = <TResource extends Resource<any>>(
  resourceName: string,
  config?: ResourceConfig
): TResource => {
  // 🔧 使用工厂模式创建代理 - 更好的职责分离
  const factory = new ResourceProxyFactory(resourceName, config)
  const resourceProxy = factory.createProxy()
  
  // 类型断言 - 更清晰的意图表达
  return resourceProxy as TResource
} 