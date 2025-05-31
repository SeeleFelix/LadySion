/**
 * 聊天服务契约接口
 * 定义前后端共享的聊天API契约
 */

import type { BaseService, ServiceResponse, StreamChunk } from "./BaseService";

/**
 * 发送消息请求
 */
export interface SendMessageRequest {
  message: string;
  conversationId?: string;
  characterId?: string;
  model?: string;
}

/**
 * 消息对象
 */
export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "system";
  timestamp: Date;
  conversationId: string;
  characterId?: string;
}

/**
 * 发送消息响应
 */
export interface SendMessageResponse {
  message: Message;
  conversationId: string;
}

/**
 * 流式消息块
 */
export interface ChatStreamChunk {
  content: string;
  isComplete: boolean;
  messageId?: string;
}

/**
 * 对话历史查询参数
 */
export interface GetHistoryRequest {
  conversationId: string;
  limit?: number;
  offset?: number;
}

/**
 * 聊天服务接口
 * 包含普通调用和流式调用的方法
 */
export interface ChatService extends BaseService {
  readonly serviceName: "ChatService";

  /**
   * 发送消息 (普通调用)
   */
  sendMessage(
    request: SendMessageRequest,
  ): Promise<ServiceResponse<SendMessageResponse>>;

  /**
   * 流式发送消息 (SSE流式调用)
   * 返回AsyncIterable用于处理流式数据
   */
  sendMessageStream(
    request: SendMessageRequest,
  ): AsyncIterable<StreamChunk<ChatStreamChunk>>;

  /**
   * 获取对话历史
   */
  getHistory(request: GetHistoryRequest): Promise<ServiceResponse<Message[]>>;

  /**
   * 创建新对话
   */
  createConversation(
    characterId?: string,
  ): Promise<ServiceResponse<{ conversationId: string }>>;
}
