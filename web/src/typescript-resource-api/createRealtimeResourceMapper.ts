/**
 * TRA 实时资源映射器
 * 设计理念：像ORM屏蔽SQL一样，完全屏蔽HTTP/SSE细节
 * 重构版本：使用Vite官方配置管理，消除硬编码
 */

import type { RealtimeResource, RealtimeConfig } from './types'
import { createResourceProxy } from './createResourceMapper'
import { buildRealtimeUrl, getRealtimeConfig } from './config'

/**
 * 订阅者类型定义
 */
interface Subscriber<T> {
  callback: (item: T) => void
  errorCallback?: (error: Error) => void
}

/**
 * SSE连接管理器 - 使用配置管理系统
 */
class SSEConnectionManager<T> {
  private eventSource: EventSource | null = null
  private subscribers: Subscriber<T>[] = []
  private resourceName: string
  private config: Required<RealtimeConfig>
  
  constructor(resourceName: string, config?: RealtimeConfig) {
    this.resourceName = resourceName
    this.config = getRealtimeConfig(config)
  }
  
  /**
   * 获取SSE端点URL - 使用配置管理构建完整URL
   */
  private getSSEUrl(): string {
    return buildRealtimeUrl(this.resourceName, this.config)
  }
  
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
   * 设置事件监听器 - 改进错误处理
   */
  private setupEventListeners(): void {
    if (!this.eventSource) return
    
    this.eventSource.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data) as T
        this.notifySubscribers(data)
      } catch (error) {
        this.notifyError(new Error(`解析SSE数据失败: ${error instanceof Error ? error.message : '未知错误'}`))
      }
    })
    
    this.eventSource.addEventListener('error', (event) => {
      const errorMsg = this.eventSource?.readyState === EventSource.CLOSED 
        ? 'SSE连接已关闭' 
        : 'SSE连接发生错误'
      this.notifyError(new Error(errorMsg))
    })
    
    this.eventSource.addEventListener('open', () => {
      console.log('SSE连接已建立')
    })
  }
  
  /**
   * 确保连接活跃 - 改进连接管理
   */
  ensureConnection(): void {
    if (!this.eventSource || this.eventSource.readyState === EventSource.CLOSED) {
      const sseUrl = this.getSSEUrl()
      this.eventSource = new EventSource(sseUrl)
      this.setupEventListeners()
    }
  }
  
  /**
   * 添加订阅者 - 改进资源管理
   */
  addSubscriber(subscriber: Subscriber<T>): () => void {
    this.ensureConnection()
    this.subscribers.push(subscriber)
    
    // 返回取消订阅函数
    return () => {
      // 移除订阅者
      const index = this.subscribers.indexOf(subscriber)
      if (index > -1) {
        this.subscribers.splice(index, 1)
      }
      
      // 如果没有订阅者了，关闭连接
      if (this.subscribers.length === 0 && this.eventSource) {
        this.eventSource.close()
        this.eventSource = null
      }
    }
  }
  
  /**
   * 手动关闭连接 - 新增方法，便于资源清理
   */
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
    this.subscribers = []
  }
}

/**
 * 实时资源工厂 - 使用配置管理系统
 */
class RealtimeResourceFactory<T> {
  private baseResource: any
  private connectionManager: SSEConnectionManager<T>
  
  constructor(resourceName: string, config?: RealtimeConfig) {
    // 🔄 重用基础CRUD功能 - 组合模式
    this.baseResource = createResourceProxy(resourceName, config)
    
    // 🔧 使用专门的连接管理器 - 职责分离
    this.connectionManager = new SSEConnectionManager<T>(resourceName, config)
  }
  
  /**
   * 创建实时资源代理
   */
  createProxy(): RealtimeResource<T> {
    return {
      // 🔄 委托给基础Resource - 消除重复代码，包含所有CRUD + 分页功能
      findAll: this.baseResource.findAll,
      findById: this.baseResource.findById,
      findAllPaged: this.baseResource.findAllPaged,
      create: this.baseResource.create,
      update: this.baseResource.update,
      patch: this.baseResource.patch,
      deleteById: this.baseResource.deleteById,
      
      // ✨ 实时订阅功能 - 核心新增特性
      subscribe: (callback: (item: T) => void, errorCallback?: (error: Error) => void) => {
        return this.connectionManager.addSubscriber({ callback, errorCallback })
      }
    }
  }
}

/**
 * 创建实时资源代理 - 使用Vite官方配置管理
 * 完全屏蔽HTTP层实现，用户只需要处理业务对象
 */
export function createRealtimeResourceProxy<T extends Record<string, any>>(
  resourceName: string,
  config: RealtimeConfig = {}
): RealtimeResource<T> {
  // 🔧 使用工厂模式创建实时资源代理 - 更好的职责分离
  const factory = new RealtimeResourceFactory<T>(resourceName, config)
  return factory.createProxy()
} 