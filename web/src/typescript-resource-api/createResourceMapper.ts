/**
 * TypeScript Resource API (TRA) - 最简实现
 * TDD: 让测试编译通过，但功能暂未实现
 */

export interface ResourceMapperConfig {
  baseUrl?: string
  timeout?: number
  headers?: Record<string, string>
}

export interface ResourceMapper<T> {
  findAll(): Promise<T[]>
  findById(id: string): Promise<T | null>
  save(entity: Partial<T>): Promise<T>
  deleteById(id: string): Promise<void>
}

/**
 * 创建资源映射器（占位实现）
 */
export function createResourceMapper<T>(
  resourceName: string,
  config?: ResourceMapperConfig
): ResourceMapper<T> {
  // 暂时返回空实现，让测试失败（TDD Red阶段）
  return {
    async findAll(): Promise<T[]> {
      throw new Error('Not implemented')
    },
    async findById(id: string): Promise<T | null> {
      throw new Error('Not implemented')
    },
    async save(entity: Partial<T>): Promise<T> {
      throw new Error('Not implemented')
    },
    async deleteById(id: string): Promise<void> {
      throw new Error('Not implemented')
    }
  }
} 