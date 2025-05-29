/**
 * TypeScript Resource API (TRA) 功能测试
 * TDD方式：测试继承Resource的接口自动获得RESTful能力
 * 参考Spring Data JPA的 JpaRepository<T, ID> 模式
 * CRUD操作：create、update、patch、delete
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Resource, createResourceProxy } from '../createResourceMapper'

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

    it('findAll() 应该映射为 GET /api/resources/Apple', async () => {
      const mockApples = [
        { id: '1', name: 'Red Apple', color: 'red', price: 1.5 },
        { id: '2', name: 'Green Apple', color: 'green', price: 1.8 }
      ]
      global.fetch = vi.fn().mockResolvedValue(createMockSuccessResponse(mockApples))
      
      const apples = await appleResource.findAll()
      
      expect(fetch).toHaveBeenCalledWith('/api/resources/Apple', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      expect(apples).toEqual(mockApples)
    })

    it('findById(id) 应该映射为 GET /api/resources/Apple/{id}', async () => {
      const mockApple = { id: '123', name: 'Sweet Apple', color: 'red', price: 2.0 }
      global.fetch = vi.fn().mockResolvedValue(createMockSuccessResponse(mockApple))
      
      const apple = await appleResource.findById('123')
      
      expect(fetch).toHaveBeenCalledWith('/api/resources/Apple/123', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      expect(apple).toEqual(mockApple)
    })
  })

  describe('创建操作 (Create)', () => {
    it('create() 应该映射为 POST /api/resources/Apple', async () => {
      const appleResource = createResourceProxy<AppleResource>('Apple')
      const newApple = { name: 'New Apple', color: 'yellow', price: 1.2 }
      const createdApple = { id: 'new-id', ...newApple }
      global.fetch = vi.fn().mockResolvedValue(createMockSuccessResponse(createdApple))
      
      const result = await appleResource.create(newApple)
      
      expect(fetch).toHaveBeenCalledWith('/api/resources/Apple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApple)
      })
      expect(result).toEqual(createdApple)
    })
  })

  describe('更新操作 (Update)', () => {
    it('update(id, entity) 应该映射为 PUT /api/resources/Apple/{id} - 全量更新', async () => {
      const appleResource = createResourceProxy<AppleResource>('Apple')
      // 全量更新：必须包含所有字段（除了id）
      const fullApple = { name: 'Updated Apple', color: 'red', price: 2.5 }
      const responseApple = { id: '123', ...fullApple }
      global.fetch = vi.fn().mockResolvedValue(createMockSuccessResponse(responseApple))
      
      const result = await appleResource.update('123', fullApple)
      
      expect(fetch).toHaveBeenCalledWith('/api/resources/Apple/123', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullApple)
      })
      expect(result).toEqual(responseApple)
    })

    it('patch(id, partial) 应该映射为 PATCH /api/resources/Apple/{id} - 部分更新', async () => {
      const appleResource = createResourceProxy<AppleResource>('Apple')
      // 部分更新：只更新price字段
      const partialUpdate = { price: 3.0 }
      const responseApple = { id: '123', name: 'Apple', color: 'red', price: 3.0 }
      global.fetch = vi.fn().mockResolvedValue(createMockSuccessResponse(responseApple))
      
      const result = await appleResource.patch('123', partialUpdate)
      
      expect(fetch).toHaveBeenCalledWith('/api/resources/Apple/123', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partialUpdate)
      })
      expect(result).toEqual(responseApple)
    })
  })

  describe('删除操作 (Delete)', () => {
    it('deleteById(id) 应该映射为 DELETE /api/resources/Apple/{id}', async () => {
      const appleResource = createResourceProxy<AppleResource>('Apple')
      global.fetch = vi.fn().mockResolvedValue(createMockSuccessResponse(null))
      
      await appleResource.deleteById('123')
      
      expect(fetch).toHaveBeenCalledWith('/api/resources/Apple/123', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })
    })
  })

  describe('多资源类型测试', () => {
    it('UserResource应该映射到正确的URL路径', async () => {
      const userResource = createResourceProxy<UserResource>('User')
      const newUser = { username: 'john', email: 'john@test.com', age: 25 }
      const createdUser = { id: '1', ...newUser }
      global.fetch = vi.fn().mockResolvedValue(createMockSuccessResponse(createdUser))
      
      await userResource.create(newUser)
      
      expect(fetch).toHaveBeenCalledWith('/api/resources/User', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      })
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
        'https://custom.api.com/api/resources/Apple',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer token123'
          })
        })
      )
    })
  })
}) 