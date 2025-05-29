/**
 * 前端对象资源映射器(Object-Resource Mapper) - 最简实现
 * TDD: 让测试编译通过，但功能暂未实现
 */

import type { BaseService } from '@shared/contracts'

export interface ObjectResourceMapperConfig {
  baseUrl?: string
  timeout?: number
  headers?: Record<string, string>
}

/**
 * 创建对象资源映射器（占位实现）
 */
export function createObjectResourceMapper<T extends BaseService>(
  ServiceClass: new() => T,
  config?: ObjectResourceMapperConfig
): T {
  // 暂时返回原始实例，不做任何代理
  // 这会让所有测试失败，正是TDD的Red阶段
  return new ServiceClass()
} 