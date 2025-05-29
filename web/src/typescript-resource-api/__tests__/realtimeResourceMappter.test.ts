/**
 * TRA 聊天实时功能测试 - 完全屏蔽HTTP层
 * 展示用户期待的使用方式：直接操作业务对象，不感知HTTP/SSE
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import type { RealtimeResource } from '../types'

// 聊天业务对象
interface ChatMessage {
  id: string
  content: string
  userId: string
  conversationId: string
  timestamp: number
}

describe('TRA 聊天实时功能 - HTTP层完全屏蔽', () => {
  let mockEventSource: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock EventSource
    mockEventSource = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      close: vi.fn(),
      readyState: 1
    }
    vi.stubGlobal('EventSource', vi.fn(() => mockEventSource))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('聊天消息实时订阅 - 用户期待的使用方式', () => {
    it('ChatResource.subscribe() - 持续接收Chat对象', async () => {
      const { createRealtimeResourceProxy } = await import('../index')
      
      // 创建Chat资源 - 用户不需要知道这是HTTP操作
      const ChatResource: RealtimeResource<ChatMessage> = createRealtimeResourceProxy('ChatMessage')
      
      const receivedChats: ChatMessage[] = []
      
      // 订阅聊天消息 - 完全不感知HTTP/SSE
      const unsubscribe = ChatResource.subscribe((chat: ChatMessage) => {
        // 直接拿到Chat对象，处理业务逻辑
        receivedChats.push(chat)
        console.log(`收到消息: ${chat.content}`)
      })
      
      expect(typeof unsubscribe).toBe('function')
      
      // 框架内部处理SSE连接（用户看不到）
      expect(mockEventSource.addEventListener).toHaveBeenCalled()
      
      // 模拟后端推送消息（框架内部处理）
      const mockSSEEvent = {
        data: JSON.stringify({
          id: 'chat-1',
          content: 'Hello from backend!',
          userId: 'user-123',
          conversationId: 'conv-456',
          timestamp: Date.now()
        })
      }
      
      // 触发SSE事件回调（框架内部）
      const messageHandler = mockEventSource.addEventListener.mock.calls.find(
        (call: any[]) => call[0] === 'message'
      )?.[1]
      messageHandler?.(mockSSEEvent)
      
      // 用户直接拿到Chat对象
      expect(receivedChats).toHaveLength(1)
      expect(receivedChats[0].content).toBe('Hello from backend!')
      expect(receivedChats[0].userId).toBe('user-123')
      
      // 取消订阅 - 框架内部处理连接关闭
      unsubscribe()
      expect(mockEventSource.close).toHaveBeenCalled()
    })

    it('支持错误处理 - 但用户不需要处理HTTP错误', async () => {
      const { createRealtimeResourceProxy } = await import('../index')
      const ChatResource: RealtimeResource<ChatMessage> = createRealtimeResourceProxy('ChatMessage')
      
      let businessError: Error | null = null
      
      const unsubscribe = ChatResource.subscribe(
        (chat: ChatMessage) => {
          // 正常业务处理
        },
        (error: Error) => {
          // 业务级别的错误处理，不是HTTP错误
          businessError = error
        }
      )
      
      expect(typeof unsubscribe).toBe('function')
      unsubscribe()
    })
  })

  describe('实际使用场景演示', () => {
    it('聊天室场景 - 用户只关心聊天逻辑', async () => {
      const { createRealtimeResourceProxy } = await import('../index')
      
      // 用户视角：我要订阅聊天消息
      const ChatResource = createRealtimeResourceProxy<ChatMessage>('ChatMessage')
      
      const chatHistory: ChatMessage[] = []
      
      // 开始监听聊天 - 完全的业务逻辑
      const stopListening = ChatResource.subscribe((newMessage: ChatMessage) => {
        // 添加到聊天历史
        chatHistory.push(newMessage)
        
        // 显示新消息通知
        if (newMessage.userId !== 'current-user') {
          showNotification(`${newMessage.userId}: ${newMessage.content}`)
        }
        
        // 滚动到底部
        scrollToBottom()
      })
      
      // 用户完全不知道这些是HTTP/SSE操作！
      
      function showNotification(message: string) {
        console.log(`💬 ${message}`)
      }
      
      function scrollToBottom() {
        console.log('📜 滚动到底部')
      }
      
      expect(typeof stopListening).toBe('function')
      
      // 离开聊天室时停止监听
      stopListening()
    })

    it('多个资源同时订阅 - 各自独立', async () => {
      const { createRealtimeResourceProxy } = await import('../index')
      
      // 同时订阅消息和用户状态
      const ChatResource = createRealtimeResourceProxy<ChatMessage>('ChatMessage')
      const UserResource = createRealtimeResourceProxy<{id: string, status: string}>('User')
      
      const messages: ChatMessage[] = []
      const userStatuses: any[] = []
      
      const stopChatListening = ChatResource.subscribe((chat: ChatMessage) => {
        messages.push(chat)
      })
      
      const stopUserListening = UserResource.subscribe((user: {id: string, status: string}) => {
        userStatuses.push(user)
      })
      
      // 用户不需要管理复杂的连接状态
      expect(typeof stopChatListening).toBe('function')
      expect(typeof stopUserListening).toBe('function')
      
      stopChatListening()
      stopUserListening()
    })
  })
}) 