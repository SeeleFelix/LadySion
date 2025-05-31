import { OpenAI } from "openai/mod.ts";
import {
  CompletionRequest,
  CompletionResponse,
  LLMAdapter,
} from "./LLMAdapter.ts";
import type { ModelInfo } from "@/shared/types/index.ts";
import {
  ConfigurationError,
  ExternalServiceError,
} from "@/shared/errors/DomainErrors.ts";

/**
 * OpenRouter适配器实现
 */
export class OpenRouterAdapter implements LLMAdapter {
  private client: OpenAI | null = null;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel: string;

  constructor(
    apiKey: string,
    baseUrl: string = "https://openrouter.ai/api/v1",
    defaultModel: string = "meta-llama/llama-3.1-8b-instruct:free",
  ) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.defaultModel = defaultModel;
  }

  async initialize(): Promise<void> {
    if (!this.apiKey) {
      throw new ConfigurationError("OpenRouter API密钥未配置");
    }

    this.client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: this.baseUrl,
      defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "LadySion Chat",
      },
    });

    // 验证连接
    await this.validateApiKey();
  }

  async generateCompletion(
    request: CompletionRequest,
  ): Promise<CompletionResponse> {
    if (!this.client) {
      throw new ExternalServiceError("OpenRouter客户端未初始化");
    }

    try {
      const response = await this.client.chat.completions.create({
        model: request.model || this.defaultModel,
        messages: request.messages,
        max_tokens: request.maxTokens || 1000,
        temperature: request.temperature || 0.7,
        top_p: request.topP || 1,
        stream: false,
      });

      const choice = response.choices[0];
      if (!choice || !choice.message) {
        throw new ExternalServiceError("LLM响应格式无效");
      }

      return {
        content: choice.message.content || "",
        model: response.model,
        tokens: response.usage?.total_tokens || 0,
        finishReason: choice.finish_reason || "unknown",
      };
    } catch (error: any) {
      if (error.status === 401) {
        throw new ExternalServiceError("OpenRouter API密钥无效");
      } else if (error.status === 429) {
        throw new ExternalServiceError("请求频率过高，请稍后再试");
      } else if (error.status === 400) {
        throw new ExternalServiceError(`请求参数错误: ${error.message}`);
      } else {
        throw new ExternalServiceError(`OpenRouter API错误: ${error.message}`);
      }
    }
  }

  async validateApiKey(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      await this.client.models.list();
      return true;
    } catch (error) {
      return false;
    }
  }

  async getAvailableModels(): Promise<ModelInfo[]> {
    if (!this.client) {
      throw new ExternalServiceError("OpenRouter客户端未初始化");
    }

    try {
      const response = await this.client.models.list();

      return response.data.map((model) => ({
        id: model.id,
        name: model.id,
        provider: "openrouter",
        maxTokens: (model as any).context_length || undefined,
      }));
    } catch (error: any) {
      throw new ExternalServiceError(`获取模型列表失败: ${error.message}`);
    }
  }

  estimateTokens(text: string): number {
    // 简单的token估算：大约4字符=1token (对于英文)
    // 对于中文，大约1.5字符=1token
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const otherChars = text.length - chineseChars;

    return Math.ceil(chineseChars * 0.67 + otherChars * 0.25);
  }

  async isHealthy(): Promise<boolean> {
    try {
      return await this.validateApiKey();
    } catch (error) {
      return false;
    }
  }
}
