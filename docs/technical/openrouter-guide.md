# OpenRouter API 集成指南

## 🎯 概述

OpenRouter是一个统一的AI模型接口服务，支持多种大语言模型。Lady
Sion项目通过OpenRouter实现对多种AI模型的统一访问。

## 🔑 API配置

### 环境变量配置

在`.env`文件中配置OpenRouter相关参数：

```bash
# OpenRouter API配置
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# 可选配置
OPENROUTER_HTTP_REFERER=https://your-app-domain.com
OPENROUTER_X_TITLE=Lady Sion Chat App
```

### API密钥获取

1. 访问 [OpenRouter官网](https://openrouter.ai/)
2. 注册账号并登录
3. 前往API Keys页面生成新的API密钥
4. 将密钥添加到环境变量中

## 🛠️ 后端集成

### LLM适配器实现

```typescript
// src/infrastructure/adapters/llm/OpenRouterAdapter.ts
export class OpenRouterAdapter implements LLMAdapter {
  private client: OpenAI;

  constructor(private config: OpenRouterConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
      defaultHeaders: {
        "HTTP-Referer": config.httpReferer,
        "X-Title": config.xTitle,
      },
    });
  }

  async generateResponse(request: LLMRequest): Promise<LLMResponse> {
    try {
      const response = await this.client.chat.completions.create({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        stream: request.stream,
      });

      return {
        content: response.choices[0].message.content,
        usage: response.usage,
        model: response.model,
      };
    } catch (error) {
      throw new LLMError(`OpenRouter API Error: ${error.message}`);
    }
  }

  async getAvailableModels(): Promise<ModelInfo[]> {
    const response = await fetch(`${this.config.baseUrl}/models`, {
      headers: {
        "Authorization": `Bearer ${this.config.apiKey}`,
      },
    });

    const data = await response.json();
    return data.data.map((model) => ({
      id: model.id,
      name: model.name,
      contextLength: model.context_length,
      pricing: model.pricing,
    }));
  }
}
```

### 配置管理

```typescript
// src/infrastructure/config/OpenRouterConfig.ts
export interface OpenRouterConfig {
  apiKey: string;
  baseUrl: string;
  httpReferer?: string;
  xTitle?: string;
}

export const createOpenRouterConfig = (): OpenRouterConfig => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is required");
  }

  return {
    apiKey,
    baseUrl: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    httpReferer: process.env.OPENROUTER_HTTP_REFERER,
    xTitle: process.env.OPENROUTER_X_TITLE,
  };
};
```

## 🎯 支持的模型

### 主要模型类别

**GPT系列**:

- `openai/gpt-4-turbo` - GPT-4 Turbo
- `openai/gpt-4` - GPT-4 标准版
- `openai/gpt-3.5-turbo` - GPT-3.5 Turbo

**Claude系列**:

- `anthropic/claude-3-opus` - Claude 3 Opus
- `anthropic/claude-3-sonnet` - Claude 3 Sonnet
- `anthropic/claude-3-haiku` - Claude 3 Haiku

**开源模型**:

- `mistralai/mixtral-8x7b-instruct` - Mixtral 8x7B
- `meta-llama/llama-2-70b-chat` - Llama 2 70B
- `google/gemma-7b-it` - Gemma 7B

### 模型选择建议

- **对话质量优先**: Claude 3 Opus, GPT-4 Turbo
- **成本效益平衡**: Claude 3 Sonnet, GPT-3.5 Turbo
- **快速响应**: Claude 3 Haiku, Gemma 7B
- **开源方案**: Mixtral 8x7B, Llama 2 70B

## 💰 费用控制

### 请求监控

```typescript
// src/domain/services/UsageTrackingService.ts
export class UsageTrackingService {
  async trackUsage(request: LLMRequest, response: LLMResponse): Promise<void> {
    const usage = {
      timestamp: new Date(),
      model: response.model,
      promptTokens: response.usage.prompt_tokens,
      completionTokens: response.usage.completion_tokens,
      totalTokens: response.usage.total_tokens,
      estimatedCost: this.calculateCost(response.model, response.usage),
    };

    await this.usageRepository.save(usage);
  }

  private calculateCost(model: string, usage: TokenUsage): number {
    const pricing = this.modelPricing[model];
    if (!pricing) return 0;

    const promptCost = (usage.prompt_tokens / 1000) * pricing.promptPrice;
    const completionCost = (usage.completion_tokens / 1000) *
      pricing.completionPrice;

    return promptCost + completionCost;
  }
}
```

### 费用限制

```typescript
// src/domain/services/CostLimitService.ts
export class CostLimitService {
  async checkCostLimit(estimatedCost: number): Promise<boolean> {
    const currentUsage = await this.getCurrentMonthUsage();
    const newTotal = currentUsage.totalCost + estimatedCost;

    return newTotal <= this.config.monthlyLimit;
  }

  async enforceRateLimit(userId: string): Promise<boolean> {
    const recentRequests = await this.getRecentRequests(userId, "1h");
    return recentRequests.length < this.config.hourlyRequestLimit;
  }
}
```

## 🔧 前端集成

### API客户端

```typescript
// src/services/api/openrouter.ts
export class OpenRouterService {
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await httpClient.post("/api/chat", {
      model: request.model,
      messages: request.messages,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
    });

    return response.data;
  }

  async getModels(): Promise<ModelInfo[]> {
    const response = await httpClient.get("/api/models");
    return response.data;
  }

  async streamMessage(request: ChatRequest): Promise<ReadableStream> {
    const response = await fetch("/api/chat/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...request, stream: true }),
    });

    return response.body;
  }
}
```

### 流式响应处理

```typescript
// src/composables/useStreamingChat.ts
export function useStreamingChat() {
  const message = ref("");
  const isStreaming = ref(false);

  const sendStreamingMessage = async (request: ChatRequest) => {
    isStreaming.value = true;
    message.value = "";

    try {
      const stream = await openRouterService.streamMessage(request);
      const reader = stream.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                message.value += content;
              }
            } catch (e) {
              console.warn("Failed to parse stream data:", e);
            }
          }
        }
      }
    } finally {
      isStreaming.value = false;
    }
  };

  return {
    message: readonly(message),
    isStreaming: readonly(isStreaming),
    sendStreamingMessage,
  };
}
```

## 🚨 错误处理

### 常见错误类型

```typescript
export enum OpenRouterErrorType {
  AUTHENTICATION_ERROR = "authentication_error",
  RATE_LIMIT_ERROR = "rate_limit_error",
  MODEL_NOT_FOUND = "model_not_found",
  INSUFFICIENT_CREDITS = "insufficient_credits",
  NETWORK_ERROR = "network_error",
}

export class OpenRouterError extends Error {
  constructor(
    public type: OpenRouterErrorType,
    message: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = "OpenRouterError";
  }
}
```

### 错误处理策略

```typescript
export class ErrorHandler {
  static handleOpenRouterError(error: any): never {
    if (error.status === 401) {
      throw new OpenRouterError(
        OpenRouterErrorType.AUTHENTICATION_ERROR,
        "Invalid API key",
      );
    }

    if (error.status === 429) {
      throw new OpenRouterError(
        OpenRouterErrorType.RATE_LIMIT_ERROR,
        "Rate limit exceeded",
      );
    }

    if (error.status === 404) {
      throw new OpenRouterError(
        OpenRouterErrorType.MODEL_NOT_FOUND,
        "Requested model not found",
      );
    }

    throw new OpenRouterError(
      OpenRouterErrorType.NETWORK_ERROR,
      error.message || "Unknown OpenRouter error",
    );
  }
}
```

## 📊 最佳实践

### 1. 模型选择策略

- 根据用户级别分配不同的模型权限
- 实施智能路由，根据任务类型选择最适合的模型
- 提供模型降级机制，当首选模型不可用时自动切换

### 2. 性能优化

- 实施请求缓存，避免重复的相同请求
- 使用连接池减少连接开销
- 实施智能重试机制，处理临时性错误

### 3. 安全考虑

- 在服务端验证所有用户输入
- 实施内容过滤，避免有害内容生成
- 记录所有API调用，便于审计和问题追踪

这个指南提供了OpenRouter集成的完整实现方案，确保系统能够稳定、安全地使用多种AI模型。
