/**
 * TypeScript Resource API (TRA) 功能测试
 * TDD方式：先定义期望的API，再实现
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createResourceMapper } from '../createResourceMapper'

// 定义测试资源实体
interface Apple {
  id?: string
  name: string
  color: string
  price: number
}

interface User {
  id?: string
  username: string
  email: string
  age?: number
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

describe('TypeScript Resource API (TRA)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  describe('资源映射器创建', () => {
    it('应该能够创建基本的资源映射器', () => {
      const appleMapper = createResourceMapper<Apple>('Apple')
      expect(appleMapper).toBeDefined()
      expect(typeof appleMapper.findAll).toBe('function')
      expect(typeof appleMapper.findById).toBe('function')
      expect(typeof appleMapper.save).toBe('function')
      expect(typeof appleMapper.deleteById).toBe('function')
    })

    it('应该能够使用配置创建资源映射器', () => {
      const config = { baseUrl: 'https://api.test.com', timeout: 5000 }
      const userMapper = createResourceMapper<User>('User', config)
      expect(userMapper).toBeDefined()
    })
  })

  describe('查询操作 (Read)', () => {
    it('findAll() 应该映射为 GET /api/resources/{ResourceName}', async () => {
      const mockApples = [
        { id: '1', name: 'Red Apple', color: 'red', price: 1.5 },
        { id: '2', name: 'Green Apple', color: 'green', price: 1.8 }
      ]
      global.fetch = vi.fn().mockResolvedValue(createMockSuccessResponse(mockApples))
      
      const appleMapper = createResourceMapper<Apple>('Apple')
      const apples = await appleMapper.findAll()
      
      expect(fetch).toHaveBeenCalledWith('/api/resources/Apple', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      expect(apples).toEqual(mockApples)
    })

    it('findById(id) 应该映射为 GET /api/resources/{ResourceName}/{id}', async () => {
      const mockApple = { id: '123', name: 'Sweet Apple', color: 'red', price: 2.0 }
      global.fetch = vi.fn().mockResolvedValue(createMockSuccessResponse(mockApple))
      
      const appleMapper = createResourceMapper<Apple>('Apple')
      const apple = await appleMapper.findById('123')
      
      expect(fetch).toHaveBeenCalledWith('/api/resources/Apple/123', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      expect(apple).toEqual(mockApple)
    })
  })

  describe('保存操作 (Create/Update)', () => {
    it('save() 无ID时应该映射为 POST /api/resources/{ResourceName}', async () => {
      const newApple = { name: 'New Apple', color: 'yellow', price: 1.2 }
      const savedApple = { id: 'new-id', ...newApple }
      global.fetch = vi.fn().mockResolvedValue(createMockSuccessResponse(savedApple))
      
      const appleMapper = createResourceMapper<Apple>('Apple')
      const result = await appleMapper.save(newApple)
      
      expect(fetch).toHaveBeenCalledWith('/api/resources/Apple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApple)
      })
      expect(result).toEqual(savedApple)
    })

    it('save() 有ID时应该映射为 PUT /api/resources/{ResourceName}/{id}', async () => {
      const existingApple = { id: '123', name: 'Updated Apple', color: 'red', price: 2.5 }
      global.fetch = vi.fn().mockResolvedValue(createMockSuccessResponse(existingApple))
      
      const appleMapper = createResourceMapper<Apple>('Apple')
      const result = await appleMapper.save(existingApple)
      
      expect(fetch).toHaveBeenCalledWith('/api/resources/Apple/123', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(existingApple)
      })
      expect(result).toEqual(existingApple)
    })
  })

  describe('删除操作 (Delete)', () => {
    it('deleteById(id) 应该映射为 DELETE /api/resources/{ResourceName}/{id}', async () => {
      global.fetch = vi.fn().mockResolvedValue(createMockSuccessResponse(null))
      
      const appleMapper = createResourceMapper<Apple>('Apple')
      await appleMapper.deleteById('123')
      
      expect(fetch).toHaveBeenCalledWith('/api/resources/Apple/123', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })
    })
  })

  describe('错误处理', () => {
    it('应该处理网络错误', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network Error'))
      
      const appleMapper = createResourceMapper<Apple>('Apple')
      
      await expect(appleMapper.findAll()).rejects.toThrow('Network Error')
    })

    it('应该处理HTTP错误状态', async () => {
      const mockResponse = createMockErrorResponse(404)
      global.fetch = vi.fn().mockResolvedValue(mockResponse)
      
      const appleMapper = createResourceMapper<Apple>('Apple')
      
      await expect(appleMapper.findById('nonexistent')).rejects.toThrow()
    })
  })

  describe('配置和定制', () => {
    it('应该使用自定义baseUrl', async () => {
      const mockApples = [{ id: '1', name: 'Apple', color: 'red', price: 1.0 }]
      global.fetch = vi.fn().mockResolvedValue(createMockSuccessResponse(mockApples))
      
      const appleMapper = createResourceMapper<Apple>('Apple', { 
        baseUrl: 'https://custom.api.com' 
      })
      await appleMapper.findAll()
      
      expect(fetch).toHaveBeenCalledWith('https://custom.api.com/api/resources/Apple', expect.any(Object))
    })

    it('应该使用自定义headers', async () => {
      const mockApples = []
      global.fetch = vi.fn().mockResolvedValue(createMockSuccessResponse(mockApples))
      
      const appleMapper = createResourceMapper<Apple>('Apple', { 
        headers: { 'Authorization': 'Bearer token123' }
      })
      await appleMapper.findAll()
      
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