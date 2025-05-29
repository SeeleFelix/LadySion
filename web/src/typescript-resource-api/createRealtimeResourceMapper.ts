/**
 * TRA 实时资源映射器
 * 设计理念：像ORM屏蔽SQL一样，完全屏蔽HTTP/SSE细节
 * 重构：使用组合模式，复用基础CRUD功能
 */

import type { RealtimeResource, RealtimeConfig } from './types'
import { createResourceProxy } from './createResourceMapper'

/**
 * 订阅者类型定义
 */
interface Subscriber<T> {
  callback: (item: T) => void
  errorCallback?: (error: Error) => void
}

/**
 * SSE连接管理器 - 单一职责原则
 */
class SSEConnectionManager<T> {
  private eventSource: EventSource | null = null
  private subscribers: Subscriber<T>[] = []
  
  constructor(private sseUrl: string) {}
  
  /**
   * 通知所有订阅者数据
   */
  private notifySubscribers(data: T): void {
    this.subscribers.forEach(({ callback }) => {
      try {
        callback(data)
      } catch (error) {
        console.error('订阅者回调执行失败:', error)
      }
    })
  }
  
  /**
   * 通知所有订阅者错误
   */
  private notifyError(error: Error): void {
    this.subscribers.forEach(({ errorCallback }) => {
      if (errorCallback) {
        try {
          errorCallback(error)
        } catch (callbackError) {
          console.error('错误回调执行失败:', callbackError)
        }
      }
    })
  }
  
  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    if (!this.eventSource) return
    
    this.eventSource.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data) as T
        this.notifySubscribers(data)
      } catch (error) {
        this.notifyError(error instanceof Error ? error : new Error('解析SSE数据失败'))
      }
    })
    
    this.eventSource.addEventListener('error', () => {
      this.notifyError(new Error('SSE连接错误'))
    })
  }
  
  /**
   * 确保连接活跃
   */
  ensureConnection(): void {
    if (!this.eventSource || this.eventSource.readyState === EventSource.CLOSED) {
      this.eventSource = new EventSource(this.sseUrl)
      this.setupEventListeners()
    }
  }
  
  /**
   * 添加订阅者
   */
  addSubscriber(subscriber: Subscriber<T>): () => void {
    this.ensureConnection()
    this.subscribers.push(subscriber)
    
    // 返回取消订阅函数
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== subscriber)
      
      // 如果没有订阅者了，关闭连接
      if (this.subscribers.length === 0 && this.eventSource) {
        this.eventSource.close()
        this.eventSource = null
      }
    }
  }
}

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
  
  // 🔧 使用专门的连接管理器 - 职责分离
  const connectionManager = new SSEConnectionManager<T>(sseUrl)
  
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
      return connectionManager.addSubscriber({ callback, errorCallback })
    }
  }
  
  return realtimeProxy
} 