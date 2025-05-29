/**
 * TRA 分页和排序功能测试 - Spring Data JPA风格
 * 验证Pageable和Page的完整功能
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import type { Resource, Pageable, Page, Sort } from '../types'

// 用户业务对象
interface User {
  id: string
  name: string
  email: string
  age: number
  createdAt: string
}

describe('TRA 分页和排序功能 - Spring Data JPA风格', () => {
  let mockFetch: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock fetch
    mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('基础分页功能', () => {
    it('findAllPaged() - 第一页查询', async () => {
      const { createResourceProxy } = await import('../index')
      
      // 创建User资源
      const UserResource: Resource<User> = createResourceProxy('User')
      
      // Mock服务器分页响应
      const mockPageResponse: Page<User> = {
        content: [
          { id: '1', name: 'Alice', email: 'alice@test.com', age: 25, createdAt: '2024-01-01' },
          { id: '2', name: 'Bob', email: 'bob@test.com', age: 30, createdAt: '2024-01-02' }
        ],
        totalElements: 100,
        totalPages: 10,
        size: 10,
        number: 0,
        numberOfElements: 2,
        first: true,
        last: false,
        empty: false
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockPageResponse
      })

      // 执行分页查询
      const pageable: Pageable = { page: 0, size: 10 }
      const result = await UserResource.findAllPaged(pageable)
      
      // 验证请求URL和参数
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/resources/User?page=0&size=10',
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
      )
      
      // 验证返回的Page对象
      expect(result).toEqual(mockPageResponse)
      expect(result.content).toHaveLength(2)
      expect(result.first).toBe(true)
      expect(result.last).toBe(false)
    })

    it('findAllPaged() - 第二页查询', async () => {
      const { createResourceProxy } = await import('../index')
      const UserResource: Resource<User> = createResourceProxy('User')
      
      const mockPageResponse: Page<User> = {
        content: [
          { id: '11', name: 'Charlie', email: 'charlie@test.com', age: 28, createdAt: '2024-01-11' }
        ],
        totalElements: 100,
        totalPages: 10,
        size: 10,
        number: 1,
        numberOfElements: 1,
        first: false,
        last: false,
        empty: false
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockPageResponse
      })

      const pageable: Pageable = { page: 1, size: 10 }
      const result = await UserResource.findAllPaged(pageable)
      
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/resources/User?page=1&size=10',
        expect.objectContaining({ method: 'GET' })
      )
      
      expect(result.number).toBe(1)
      expect(result.first).toBe(false)
    })
  })

  describe('排序功能', () => {
    it('findAllPaged() - 单字段升序排序', async () => {
      const { createResourceProxy } = await import('../index')
      const UserResource: Resource<User> = createResourceProxy('User')
      
      const mockPageResponse: Page<User> = {
        content: [
          { id: '2', name: 'Alice', email: 'alice@test.com', age: 25, createdAt: '2024-01-02' },
          { id: '1', name: 'Bob', email: 'bob@test.com', age: 30, createdAt: '2024-01-01' }
        ],
        totalElements: 2,
        totalPages: 1,
        size: 10,
        number: 0,
        numberOfElements: 2,
        first: true,
        last: true,
        empty: false
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockPageResponse
      })

      const sort: Sort = {
        fields: [{ field: 'name', direction: 'ASC' }]
      }
      const pageable: Pageable = { page: 0, size: 10, sort }
      const result = await UserResource.findAllPaged(pageable)
      
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/resources/User?page=0&size=10&sort=name,ASC',
        expect.objectContaining({ method: 'GET' })
      )
      
      expect(result.content[0].name).toBe('Alice')
      expect(result.content[1].name).toBe('Bob')
    })

    it('findAllPaged() - 多字段排序', async () => {
      const { createResourceProxy } = await import('../index')
      const UserResource: Resource<User> = createResourceProxy('User')
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: 10,
          number: 0,
          numberOfElements: 0,
          first: true,
          last: true,
          empty: true
        })
      })

      const sort: Sort = {
        fields: [
          { field: 'age', direction: 'DESC' },
          { field: 'name', direction: 'ASC' }
        ]
      }
      const pageable: Pageable = { page: 0, size: 10, sort }
      await UserResource.findAllPaged(pageable)
      
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/resources/User?page=0&size=10&sort=age,DESC&sort=name,ASC',
        expect.objectContaining({ method: 'GET' })
      )
    })
  })

  describe('边界情况处理', () => {
    it('findAllPaged() - 空页面', async () => {
      const { createResourceProxy } = await import('../index')
      const UserResource: Resource<User> = createResourceProxy('User')
      
      const emptyPageResponse: Page<User> = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0,
        numberOfElements: 0,
        first: true,
        last: true,
        empty: true
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => emptyPageResponse
      })

      const pageable: Pageable = { page: 0, size: 10 }
      const result = await UserResource.findAllPaged(pageable)
      
      expect(result.empty).toBe(true)
      expect(result.content).toHaveLength(0)
      expect(result.totalElements).toBe(0)
    })

    it('findAllPaged() - 大页面尺寸', async () => {
      const { createResourceProxy } = await import('../index')
      const UserResource: Resource<User> = createResourceProxy('User')
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          content: new Array(100).fill(null).map((_, i) => ({
            id: `${i}`,
            name: `User${i}`,
            email: `user${i}@test.com`,
            age: 20 + i,
            createdAt: `2024-01-${(i % 30) + 1}`
          })),
          totalElements: 1000,
          totalPages: 10,
          size: 100,
          number: 0,
          numberOfElements: 100,
          first: true,
          last: false,
          empty: false
        })
      })

      const pageable: Pageable = { page: 0, size: 100 }
      const result = await UserResource.findAllPaged(pageable)
      
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/resources/User?page=0&size=100',
        expect.objectContaining({ method: 'GET' })
      )
      
      expect(result.content).toHaveLength(100)
      expect(result.size).toBe(100)
    })
  })

  describe('集成测试场景', () => {
    it('用户列表分页 - 实际业务场景', async () => {
      const { createResourceProxy } = await import('../index')
      
      // 管理员查看用户列表，按创建时间倒序，每页20条
      const UserResource: Resource<User> = createResourceProxy('User')
      
      const mockUsers: User[] = [
        { id: '1', name: '张三', email: 'zhangsan@example.com', age: 25, createdAt: '2024-01-15' },
        { id: '2', name: '李四', email: 'lisi@example.com', age: 30, createdAt: '2024-01-14' },
        { id: '3', name: '王五', email: 'wangwu@example.com', age: 28, createdAt: '2024-01-13' }
      ]

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          content: mockUsers,
          totalElements: 150,
          totalPages: 8,
          size: 20,
          number: 0,
          numberOfElements: 3,
          first: true,
          last: false,
          empty: false
        })
      })

      const pageable: Pageable = {
        page: 0,
        size: 20,
        sort: {
          fields: [{ field: 'createdAt', direction: 'DESC' }]
        }
      }

      const userPage = await UserResource.findAllPaged(pageable)
      
      // 业务验证
      expect(userPage.content).toHaveLength(3)
      expect(userPage.content[0].name).toBe('张三')
      expect(userPage.totalElements).toBe(150)
      expect(userPage.totalPages).toBe(8)
      
      // URL参数验证
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/resources/User?page=0&size=20&sort=createdAt,DESC',
        expect.objectContaining({ method: 'GET' })
      )
    })
  })
}) 