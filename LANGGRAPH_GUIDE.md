# LangGraph与OpenRouter集成指南 - LadySion

## 简介

LangGraph是一个强大的框架，用于构建基于大型语言模型（LLM）的复杂应用程序。通过将LangGraph与OpenRouter结合使用，您可以构建具有工具使用能力的智能代理，同时利用多种先进的LLM模型。

## 优势

- **工具使用能力**：LangGraph让AI能够使用工具完成复杂任务
- **强大的代理框架**：构建能够规划和执行多步骤任务的AI代理
- **灵活的模型选择**：通过OpenRouter访问多种LLM模型

## 配置步骤

1. 在`.env`文件中设置以下配置：

```
# OpenRouter API 密钥
OPENROUTER_API_KEY=your_openrouter_api_key_here

# OpenRouter 模型名称（推荐使用支持工具调用的模型）
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# LLM提供商选择
LLM_PROVIDER=openrouter

# 启用LangGraph
USE_LANGGRAPH=true
```

## 工具示例

LadySion目前包含以下示例工具：

1. **天气查询工具** (`getWeather`): 获取指定城市的天气信息
2. **搜索工具** (`search`): 搜索特定主题的信息

这些工具仅作为示例。在实际应用中，您可以添加连接到真实API的自定义工具。

## 添加自定义工具

要添加新的工具，请在`server/src/infrastructure/adapters/llm/tools/index.ts`文件中定义：

```typescript
export const myNewTool = new DynamicStructuredTool({
  name: 'toolName',
  description: '工具描述',
  schema: z.object({
    // 定义工具输入参数
    param1: z.string().describe('参数描述'),
  }),
  func: async ({ param1 }) => {
    // 实现工具功能
    return `结果`;
  },
});

// 将新工具添加到工具数组
export const tools = [weatherTool, searchTool, myNewTool];
```

## 工具调用示例

以下是一些可以测试工具功能的示例问题：

1. "北京今天的天气怎么样？"
2. "帮我搜索一下人工智能的最新发展"
3. "上海和广州哪个城市今天更热？"

## 模型推荐

对于工具调用功能，推荐使用以下模型：

| 模型名称 | 提供商 | 特点 |
|---------|------|------|
| anthropic/claude-3.5-sonnet | Anthropic | 支持工具调用，反应速度快 |
| anthropic/claude-3-opus | Anthropic | 最强大的Claude版本，工具调用能力强 |
| openai/gpt-4-turbo | OpenAI | 出色的工具使用能力和推理能力 |

## 故障排除

1. **工具不被调用**：确保使用支持工具调用的模型，如Claude 3或GPT-4
2. **报错"Unexpected token"**：检查工具函数的返回格式是否正确
3. **工具执行超时**：如果工具需要访问外部API，检查网络连接

## 更多资源

- [LangGraph官方文档](https://langchain-ai.github.io/langgraph/)
- [OpenRouter文档](https://openrouter.ai/docs)
- [LangChain工具文档](https://js.langchain.com/docs/modules/tools/)

---

如有任何问题，请参考官方文档或联系项目维护者。 