/**
 * TypeScript Resource API (TRA) - Spring Data JPA风格实现
 * 参考Spring Data JPA的 JpaRepository<T, ID> 模式
 * 提供RESTful CRUD操作：create、update、patch、delete
 */

export interface ResourceConfig {
  baseUrl?: string
  timeout?: number
  headers?: Record<string, string>
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
 * 为继承Resource的接口创建动态代理 - 相当于Spring的@Repository动态代理
 */
export function createResourceProxy<TResource extends Resource<any>>(
  resourceName: string,
  config?: ResourceConfig
): TResource {
  // 默认配置
  const finalConfig = {
    baseUrl: '',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json'
    },
    ...config
  }

  // 创建动态代理对象，自动实现Resource接口的所有方法
  const resourceProxy = {
    // 查询操作
    async findAll(): Promise<any[]> {
      const url = `${finalConfig.baseUrl}/api/resources/${resourceName}`
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: finalConfig.headers
        })
        
        if (!response || !response.ok) {
          throw new Error(`HTTP ${response?.status || 'Unknown'}: ${response?.statusText || 'Network Error'}`)
        }
        
        return await response.json()
      } catch (error) {
        throw error
      }
    },

    async findById(id: string): Promise<any | null> {
      const url = `${finalConfig.baseUrl}/api/resources/${resourceName}/${id}`
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: finalConfig.headers
        })
        
        if (!response || !response.ok) {
          throw new Error(`HTTP ${response?.status || 'Unknown'}: ${response?.statusText || 'Network Error'}`)
        }
        
        return await response.json()
      } catch (error) {
        throw error
      }
    },

    // 创建操作
    async create(entity: any): Promise<any> {
      const url = `${finalConfig.baseUrl}/api/resources/${resourceName}`
      
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: finalConfig.headers,
          body: JSON.stringify(entity)
        })
        
        if (!response || !response.ok) {
          throw new Error(`HTTP ${response?.status || 'Unknown'}: ${response?.statusText || 'Network Error'}`)
        }
        
        return await response.json()
      } catch (error) {
        throw error
      }
    },

    // 更新操作 - 全量更新
    async update(id: string, entity: any): Promise<any> {
      const url = `${finalConfig.baseUrl}/api/resources/${resourceName}/${id}`
      
      try {
        const response = await fetch(url, {
          method: 'PUT',
          headers: finalConfig.headers,
          body: JSON.stringify(entity)
        })
        
        if (!response || !response.ok) {
          throw new Error(`HTTP ${response?.status || 'Unknown'}: ${response?.statusText || 'Network Error'}`)
        }
        
        return await response.json()
      } catch (error) {
        throw error
      }
    },

    // 部分更新
    async patch(id: string, partial: any): Promise<any> {
      const url = `${finalConfig.baseUrl}/api/resources/${resourceName}/${id}`
      
      try {
        const response = await fetch(url, {
          method: 'PATCH',
          headers: finalConfig.headers,
          body: JSON.stringify(partial)
        })
        
        if (!response || !response.ok) {
          throw new Error(`HTTP ${response?.status || 'Unknown'}: ${response?.statusText || 'Network Error'}`)
        }
        
        return await response.json()
      } catch (error) {
        throw error
      }
    },

    // 删除操作
    async deleteById(id: string): Promise<void> {
      const url = `${finalConfig.baseUrl}/api/resources/${resourceName}/${id}`
      
      try {
        const response = await fetch(url, {
          method: 'DELETE',
          headers: finalConfig.headers
        })
        
        if (!response || !response.ok) {
          throw new Error(`HTTP ${response?.status || 'Unknown'}: ${response?.statusText || 'Network Error'}`)
        }
        
        // DELETE操作不需要返回内容
      } catch (error) {
        throw error
      }
    }
  }

  // 返回类型断言为TResource，使其具有正确的类型
  return resourceProxy as TResource
} 