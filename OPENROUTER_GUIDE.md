# OpenRouter 使用指南 - LadySion

## 简介

[OpenRouter](https://openrouter.ai/) 是一个统一的AI模型API服务，允许您通过单一接口访问多种大型语言模型（LLMs），包括Claude、GPT-4等。OpenRouter提供了与OpenAI兼容的API，因此可以轻松集成到已有的应用中。

## 优势

- **更多模型选择**：访问50+个提供商的300+个模型
- **更好的价格**：对于某些模型，价格更具竞争力
- **更高的可用性**：当一个提供商出现问题时，可以无缝切换到另一个
- **数据隐私策略**：细粒度的数据策略控制，确保提示只发送到您信任的模型和提供商

## 配置步骤

1. 访问 [OpenRouter官网](https://openrouter.ai/) 注册账号
2. 获取API密钥
3. 在项目的`.env`文件中配置以下内容：

```
# OpenRouter API 密钥
OPENROUTER_API_KEY=your_openrouter_api_key_here

# OpenRouter 模型名称 
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# LLM提供商选择
LLM_PROVIDER=openrouter
```

## 可用模型

以下是一些推荐的OpenRouter模型：

| 模型名称 | 提供商 | 特点 |
|---------|------|------|
| anthropic/claude-3.5-sonnet | Anthropic | 高质量、快速的回复，支持多轮对话 |
| anthropic/claude-3-opus | Anthropic | 最强大的Claude版本，适合复杂任务 |
| openai/gpt-4-turbo | OpenAI | 强大的综合能力，支持复杂推理 |
| google/gemini-pro | Google | 谷歌最新的大型语言模型 |
| mistral/mistral-large | Mistral | 出色的推理能力与效率平衡 |

## 故障排除

1. **API密钥无效**：确保您已正确复制API密钥，并且账户中有足够的余额
2. **模型名称错误**：确保使用了正确的模型名称格式（提供商/模型名）
3. **请求失败**：检查网络连接，或者尝试切换到不同的模型

## 更多资源

- [OpenRouter API文档](https://openrouter.ai/docs)
- [模型列表](https://openrouter.ai/docs/models)
- [价格信息](https://openrouter.ai/pricing)

---

如有任何问题，请参考OpenRouter官方文档或联系项目维护者。 