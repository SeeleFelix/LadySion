/**
 * 参考Spring Data JPA的 JpaRepository<T, ID> 模式
 * CRUD操作：create、update、patch、delete
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Resource } from '../types'
import { createResourceProxy } from '../createResourceMapper'

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

// 业务接口继承Resource - 参考Spring Data JPA
interface AppleResource extends Resource<Apple> {
  // 自动继承RESTful CRUD方法
}

interface UserResource extends Resource<User> {
  // 自动继承RESTful CRUD方法
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

describe('TypeScript Resource API (TRA) - RESTful CRUD接口', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  describe('Resource接口继承', () => {
    it('应该为继承Resource的接口创建动态代理，包含CRUD方法', () => {
      const appleResource = createResourceProxy<AppleResource>('Apple')
      
      expect(appleResource).toBeDefined()
      // 查询方法
      expect(typeof appleResource.findAll).toBe('function')
      expect(typeof appleResource.findById).toBe('function')
      // 创建方法
      expect(typeof appleResource.create).toBe('function')
      // 更新方法
      expect(typeof appleResource.update).toBe('function')
      expect(typeof appleResource.patch).toBe('function')
      // 删除方法
      expect(typeof appleResource.deleteById).toBe('function')
    })

    it('应该支持多个不同的资源类型', () => {
      const appleResource = createResourceProxy<AppleResource>('Apple')
      const userResource = createResourceProxy<UserResource>('User')
      
      expect(appleResource).toBeDefined()
      expect(userResource).toBeDefined()
      expect(appleResource).not.toBe(userResource)
    })
  })

  describe('查询操作 (Read)', () => {
    let appleResource: AppleResource

    beforeEach(() => {
      appleResource = createResourceProxy<AppleResource>('Apple')
    })

    it('findAll() 应该映射为 POST /api/whisper/Apple/findAll', async () => {
      global.fetch = vi.fn().mockResolvedValue(createMockSuccessResponse([]))
      await appleResource.findAll()
      expect(fetch).toHaveBeenCalledWith(
        '/api/whisper/Apple/findAll',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ args: [] })
        })
      )
    })

    it('findById(id) 应该映射为 POST /api/whisper/Apple/findById', async () => {
      global.fetch = vi.fn().mockResolvedValue(createMockSuccessResponse({}))
      await appleResource.findById('123')
      expect(fetch).toHaveBeenCalledWith(
        '/api/whisper/Apple/findById',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ args: ['123'] })
        })
      )
    })
  })

  describe('创建操作 (Create)', () => {
    let appleResource: AppleResource
    beforeEach(() => {
      appleResource = createResourceProxy<AppleResource>('Apple')
    })
    it('create() 应该映射为 POST /api/whisper/Apple/create', async () => {
      const newApple = { name: 'New Apple', color: 'yellow', price: 1.2 }
      global.fetch = vi.fn().mockResolvedValue(createMockSuccessResponse({}))
      await appleResource.create(newApple)
      expect(fetch).toHaveBeenCalledWith(
        '/api/whisper/Apple/create',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ args: [newApple] })
        })
      )
    })
  })

  describe('更新操作 (Update)', () => {
    let appleResource: AppleResource
    beforeEach(() => {
      appleResource = createResourceProxy<AppleResource>('Apple')
    })
    it('update(id, entity) 应该映射为 POST /api/whisper/Apple/update', async () => {
      const fullApple = { name: 'Updated Apple', color: 'red', price: 2.5 }
      global.fetch = vi.fn().mockResolvedValue(createMockSuccessResponse({}))
      await appleResource.update('123', fullApple)
      expect(fetch).toHaveBeenCalledWith(
        '/api/whisper/Apple/update',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ args: ['123', fullApple] })
        })
      )
    })
    it('patch(id, partial) 应该映射为 POST /api/whisper/Apple/patch', async () => {
      const partialUpdate = { price: 3.0 }
      global.fetch = vi.fn().mockResolvedValue(createMockSuccessResponse({}))
      await appleResource.patch('123', partialUpdate)
      expect(fetch).toHaveBeenCalledWith(
        '/api/whisper/Apple/patch',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ args: ['123', partialUpdate] })
        })
      )
    })
  })

  describe('删除操作 (Delete)', () => {
    let appleResource: AppleResource
    beforeEach(() => {
      appleResource = createResourceProxy<AppleResource>('Apple')
    })
    it('deleteById(id) 应该映射为 POST /api/whisper/Apple/deleteById', async () => {
      global.fetch = vi.fn().mockResolvedValue(createMockSuccessResponse(null))
      await appleResource.deleteById('123')
      expect(fetch).toHaveBeenCalledWith(
        '/api/whisper/Apple/deleteById',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ args: ['123'] })
        })
      )
    })
  })

  describe('多资源类型测试', () => {
    it('UserResource应该映射到正确的URL路径', async () => {
      const userResource = createResourceProxy<UserResource>('User')
      const newUser = { username: 'john', email: 'john@test.com', age: 25 }
      global.fetch = vi.fn().mockResolvedValue(createMockSuccessResponse({ id: '1', ...newUser }))
      await userResource.create(newUser)
      expect(fetch).toHaveBeenCalledWith(
        '/api/whisper/User/create',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ args: [newUser] })
        })
      )
    })
  })

  describe('错误处理', () => {
    it('应该处理网络错误', async () => {
      const appleResource = createResourceProxy<AppleResource>('Apple')
      global.fetch = vi.fn().mockRejectedValue(new Error('Network Error'))
      
      await expect(appleResource.findAll()).rejects.toThrow('Network Error')
    })

    it('应该处理HTTP错误状态', async () => {
      const appleResource = createResourceProxy<AppleResource>('Apple')
      const mockResponse = createMockErrorResponse(404)
      global.fetch = vi.fn().mockResolvedValue(mockResponse)
      
      await expect(appleResource.findById('nonexistent')).rejects.toThrow()
    })
  })

  describe('配置和定制', () => {
    it('应该支持自定义配置', async () => {
      const appleResource = createResourceProxy<AppleResource>('Apple', {
        baseUrl: 'https://custom.api.com',
        headers: { 'Authorization': 'Bearer token123' }
      })
      const mockApples = [{ id: '1', name: 'Apple', color: 'red', price: 1.0 }]
      global.fetch = vi.fn().mockResolvedValue(createMockSuccessResponse(mockApples))
      await appleResource.findAll()
      expect(fetch).toHaveBeenCalledWith(
        '/api/whisper/Apple/findAll',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer token123',
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ args: [] })
        })
      )
    })
  })
}) 