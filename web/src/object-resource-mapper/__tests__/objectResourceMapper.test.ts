/**
 * 前端对象资源映射器(Object-Resource Mapper)功能测试
 * TDD方式：先定义期望的API，再实现
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createObjectResourceMapper } from '../createObjectResourceMapper'
import type { BaseService, ServiceResponse } from '@shared/contracts'

// 定义测试服务接口
interface TestService extends BaseService {
  readonly serviceName: 'TestService'
  
  // 普通HTTP方法
  getMessage(id: string): Promise<ServiceResponse<{ content: string }>>
  createItem(data: { name: string }): Promise<ServiceResponse<{ id: string }>>
  
  // 流式方法（以Stream结尾）
  streamMessages(query: string): AsyncIterable<{ chunk: string }>
  generateStream(prompt: string): AsyncIterable<{ token: string }>
}

// 测试服务实现类（用于获取类型信息）
class TestServiceImpl implements TestService {
  readonly serviceName = 'TestService' as const
  
  async getMessage(id: string): Promise<ServiceResponse<{ content: string }>> {
    throw new Error('Should be overridden by mapper')
  }
  
  async createItem(data: { name: string }): Promise<ServiceResponse<{ id: string }>> {
    throw new Error('Should be overridden by mapper')
  }
  
  async *streamMessages(query: string): AsyncIterable<{ chunk: string }> {
    throw new Error('Should be overridden by mapper')
  }
  
  async *generateStream(prompt: string): AsyncIterable<{ token: string }> {
    throw new Error('Should be overridden by mapper')
  }
}

// Mock helpers
function createMockSuccessResponse(data: any) {
  return {
    ok: true,
    json: () => Promise.resolve(data)
  } as Response
}

function createMockErrorResponse(status: number) {
  return {
    ok: false,
    status,
    statusText: 'Error'
  } as Response
}

describe('前端对象资源映射器(Object-Resource Mapper)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
    // @ts-ignore - Mock EventSource for testing
    global.EventSource = vi.fn()
  })

  describe('映射器创建', () => {
    it('应该能够创建基本的对象资源映射器', () => {
      const mapper = createObjectResourceMapper(TestServiceImpl)
      expect(mapper).toBeDefined()
      expect(mapper.serviceName).toBe('TestService')
    })

    it('应该能够使用配置创建映射器', () => {
      const config = { baseUrl: 'https://api.test.com', timeout: 5000 }
      const mapper = createObjectResourceMapper(TestServiceImpl, config)
      expect(mapper).toBeDefined()
    })
  })

  describe('HTTP方法调用', () => {
    it('应该将getMessage映射为GET请求', async () => {
      const mockResponse = createMockSuccessResponse({ content: 'Hello World' })
      global.fetch = vi.fn().mockResolvedValue(mockResponse)
      
      const mapper = createObjectResourceMapper(TestServiceImpl)
      const result = await mapper.getMessage('123')
      
      expect(fetch).toHaveBeenCalledWith('/api/orm/TestService/getMessage', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: '123' })
      })
      expect(result.data?.content).toBe('Hello World')
    })

    it('应该将createItem映射为POST请求', async () => {
      const mockResponse = createMockSuccessResponse({ id: 'new-id' })
      global.fetch = vi.fn().mockResolvedValue(mockResponse)
      
      const mapper = createObjectResourceMapper(TestServiceImpl)
      const result = await mapper.createItem({ name: 'Test Item' })
      
      expect(fetch).toHaveBeenCalledWith('/api/orm/TestService/createItem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { name: 'Test Item' } })
      })
      expect(result.data?.id).toBe('new-id')
    })
  })

  describe('流式方法调用', () => {
    it('应该将streamMessages映射为EventSource连接', async () => {
      const mockEventSource = {
        addEventListener: vi.fn(),
        close: vi.fn(),
        readyState: 1
      }
      // @ts-ignore - Mock EventSource
      global.EventSource = vi.fn().mockReturnValue(mockEventSource)
      
      const mapper = createObjectResourceMapper(TestServiceImpl)
      const stream = mapper.streamMessages('hello')
      
      expect(EventSource).toHaveBeenCalledWith('/api/orm/TestService/streamMessages?query=hello')
      expect(stream).toBeDefined()
    })

    it('应该将generateStream映射为EventSource连接', async () => {
      const mockEventSource = {
        addEventListener: vi.fn(),
        close: vi.fn(),
        readyState: 1
      }
      // @ts-ignore - Mock EventSource
      global.EventSource = vi.fn().mockReturnValue(mockEventSource)
      
      const mapper = createObjectResourceMapper(TestServiceImpl)
      const stream = mapper.generateStream('Generate something')
      
      expect(EventSource).toHaveBeenCalledWith('/api/orm/TestService/generateStream?prompt=Generate%20something')
      expect(stream).toBeDefined()
    })
  })

  describe('错误处理', () => {
    it('应该处理网络错误', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network Error'))
      
      const mapper = createObjectResourceMapper(TestServiceImpl)
      
      await expect(mapper.getMessage('123')).rejects.toThrow('Network Error')
    })

    it('应该处理HTTP错误状态', async () => {
      const mockResponse = createMockErrorResponse(404)
      global.fetch = vi.fn().mockResolvedValue(mockResponse)
      
      const mapper = createObjectResourceMapper(TestServiceImpl)
      
      await expect(mapper.getMessage('123')).rejects.toThrow()
    })
  })

  describe('配置和定制', () => {
    it('应该使用自定义baseUrl', async () => {
      const mockResponse = createMockSuccessResponse({ content: 'Hello' })
      global.fetch = vi.fn().mockResolvedValue(mockResponse)
      
      const mapper = createObjectResourceMapper(TestServiceImpl, { 
        baseUrl: 'https://custom.api.com' 
      })
      await mapper.getMessage('123')
      
      expect(fetch).toHaveBeenCalledWith('https://custom.api.com/api/orm/TestService/getMessage', expect.any(Object))
    })

    it('应该使用自定义headers', async () => {
      const mockResponse = createMockSuccessResponse({ content: 'Hello' })
      global.fetch = vi.fn().mockResolvedValue(mockResponse)
      
      const mapper = createObjectResourceMapper(TestServiceImpl, { 
        headers: { 'Authorization': 'Bearer token123' }
      })
      await mapper.getMessage('123')
      
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer token123'
          })
        })
      )
    })
  })
}) 