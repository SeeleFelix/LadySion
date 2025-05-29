/**
 * TypeScript Resource API (TRA) - Spring Data JPA风格实现
 * 参考Spring Data JPA的 JpaRepository<T, ID> 模式
 * 提供RESTful CRUD操作：create、update、patch、delete
 */

import { Resource, ResourceConfig, CreateResourceProxy } from './types'
import { HttpClient } from './httpClient'

/**
 * TypeScript Resource API (TRA) - 资源代理创建器
 * 重构版本：使用统一的HTTP客户端，大幅简化代码
 */

/**
 * 为继承Resource的接口创建动态代理 - 相当于Spring的@Repository动态代理
 * 重构后的简洁版本
 */
export const createResourceProxy: CreateResourceProxy = <TResource extends Resource<any>>(
  resourceName: string,
  config?: ResourceConfig
): TResource => {
  const httpClient = new HttpClient(config)
  const basePath = `/api/resources/${resourceName}`

  // 创建动态代理对象，使用统一的HTTP客户端
  const resourceProxy = {
    // 查询操作
    async findAll(): Promise<any[]> {
      return httpClient.get<any[]>(basePath)
    },

    async findById(id: string): Promise<any | null> {
      return httpClient.get<any | null>(`${basePath}/${id}`)
    },

    // 创建操作
    async create(entity: any): Promise<any> {
      return httpClient.post<any>(basePath, entity)
    },

    // 更新操作
    async update(id: string, entity: any): Promise<any> {
      return httpClient.put<any>(`${basePath}/${id}`, entity)
    },

    async patch(id: string, partial: any): Promise<any> {
      return httpClient.patch<any>(`${basePath}/${id}`, partial)
    },

    // 删除操作
    async deleteById(id: string): Promise<void> {
      return httpClient.delete(`${basePath}/${id}`)
    }
  }

  // 返回类型断言为TResource，使其具有正确的类型
  return resourceProxy as TResource
} 