import type { ModelInfo } from "@/shared/types/index.ts";

// LLM请求接口
export interface CompletionRequest {
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }>;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stream?: boolean;
}

// LLM响应接口
export interface CompletionResponse {
  content: string;
  model: string;
  tokens: number;
  finishReason: string;
}

/**
 * LLM适配器接口 - 统一不同LLM提供商的接口
 */
export interface LLMAdapter {
  /**
   * 初始化适配器
   */
  initialize(): Promise<void>;

  /**
   * 生成文本完成
   */
  generateCompletion(request: CompletionRequest): Promise<CompletionResponse>;

  /**
   * 验证API密钥
   */
  validateApiKey(): Promise<boolean>;

  /**
   * 获取可用模型
   */
  getAvailableModels(): Promise<ModelInfo[]>;

  /**
   * 估算token数量
   */
  estimateTokens(text: string): number;

  /**
   * 检查服务状态
   */
  isHealthy(): Promise<boolean>;
}
