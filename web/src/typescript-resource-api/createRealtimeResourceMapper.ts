/**
 * TRA 实时资源映射器
 * 设计理念：像ORM屏蔽SQL一样，完全屏蔽HTTP/SSE细节
 * 重构：使用组合模式，复用基础CRUD功能
 */

import type { RealtimeResource, RealtimeConfig } from './types'
import { createResourceProxy } from './createResourceMapper'

/**
 * 创建实时资源代理 - 完全屏蔽HTTP层实现
 * 用户只需要处理业务对象，不需要知道SSE的存在
 */
export function createRealtimeResourceProxy<T extends Record<string, any>>(
  resourceName: string,
  config: RealtimeConfig = {}
): RealtimeResource<T> {
  
  // 🔄 重用基础CRUD功能 - 组合模式
  const baseResource = createResourceProxy(resourceName, config)
  
  // 构建SSE端点URL
  const baseUrl = config.baseUrl || 'http://localhost:3000'
  const sseUrl = `${baseUrl}/api/realtime/${resourceName.toLowerCase()}`
  
  // 存储活跃的EventSource连接
  let eventSource: EventSource | null = null
  let subscribers: Array<{
    callback: (item: T) => void
    errorCallback?: (error: Error) => void
  }> = []
  
  /**
   * 确保SSE连接活跃
   */
  function ensureConnection(): EventSource {
    if (!eventSource || eventSource.readyState === EventSource.CLOSED) {
      eventSource = new EventSource(sseUrl)
      
      eventSource.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data) as T
          // 通知所有订阅者
          subscribers.forEach(({ callback }) => {
            callback(data)
          })
        } catch (error) {
          // 通知错误处理回调
          subscribers.forEach(({ errorCallback }) => {
            if (errorCallback) {
              errorCallback(error instanceof Error ? error : new Error('解析SSE数据失败'))
            }
          })
        }
      })
      
      eventSource.addEventListener('error', (event) => {
        const error = new Error('SSE连接错误')
        subscribers.forEach(({ errorCallback }) => {
          if (errorCallback) {
            errorCallback(error)
          }
        })
      })
    }
    
    return eventSource
  }
  
  /**
   * 实时资源代理对象 - 组合基础Resource + 实时功能
   */
  const realtimeProxy: RealtimeResource<T> = {
    // 🔄 委托给基础Resource - 消除重复代码
    findAll: baseResource.findAll,
    findById: baseResource.findById,
    create: baseResource.create,
    update: baseResource.update,
    patch: baseResource.patch,
    deleteById: baseResource.deleteById,
    
    // ✨ 实时订阅功能 - 核心新增特性
    subscribe(
      callback: (item: T) => void,
      errorCallback?: (error: Error) => void
    ): () => void {
      // 确保SSE连接存在
      ensureConnection()
      
      // 添加订阅者
      const subscriber = { callback, errorCallback }
      subscribers.push(subscriber)
      
      // 返回取消订阅函数
      return () => {
        // 移除订阅者
        subscribers = subscribers.filter(s => s !== subscriber)
        
        // 如果没有订阅者了，关闭连接
        if (subscribers.length === 0 && eventSource) {
          eventSource.close()
          eventSource = null
        }
      }
    }
  }
  
  return realtimeProxy
} 