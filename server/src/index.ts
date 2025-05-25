import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { OpenAI } from 'openai';

// 加载环境变量
dotenv.config();

// 检查必要的环境变量
if (!process.env.OPENROUTER_API_KEY) {
  console.error('错误: 未设置OPENROUTER_API_KEY环境变量');
  process.exit(1);
}

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

// 创建OpenAI客户端(用于OpenRouter)
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:3000', // 替换为您的网站URL
    'X-Title': 'SimpleChat'                  // 使用ASCII字符
  }
});

// 中间件
app.use(cors());
app.use(express.json());

// 聊天API端点 - 支持流式响应
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: '消息不能为空' });
    }

    // 设置流式响应头
    res.setHeader('Content-Type', 'text/plain');
    // 删除Content-Length头，只使用Transfer-Encoding
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Transfer-Encoding', 'chunked');

    // 创建流式响应
    const stream = await openai.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
      messages: [{ role: 'user', content: message }],
      stream: true,
    });

    // 处理流式响应
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(content);
      }
    }

    res.end();
  } catch (error) {
    console.error('聊天API错误:', error);
    // 如果还没有开始发送响应
    if (!res.headersSent) {
      res.status(500).json({ error: '处理请求时出错' });
    } else {
      // 如果已经开始发送响应，尝试结束流
      res.end();
    }
  }
});

// 静态文件服务（生产环境）
app.use(express.static('../client/dist'));

// 所有未匹配的路由都重定向到index.html
app.get('*', (req, res) => {
  res.sendFile('index.html', { root: '../client/dist' });
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
}); 