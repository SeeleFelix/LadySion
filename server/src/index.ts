import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { OpenAI } from 'openai';
import path from 'path';
import { PresetController } from './api/controllers/PresetController';
import { createPresetRoutes } from './api/routes/presetRoutes';
import { CharacterController } from './infrastructure/adapters/web/CharacterController';
import { ConversationController } from './infrastructure/adapters/web/ConversationController';
import { createCharacterRoutes, createConversationRoutes } from './infrastructure/adapters/web/routes';
import { PresetUseCases } from './domain/usecases/preset/PresetUseCases';
import { SQLitePresetRepository } from './infrastructure/adapters/SQLitePresetRepository';
import { MacroSystem } from './domain/services/MacroSystem';
import { InstructModeService } from './domain/services/InstructModeService';
import { ContextTemplateService } from './domain/services/ContextTemplateService';
import { SystemPromptService } from './domain/services/SystemPromptService';
import { PostHistoryInstructionsService } from './domain/services/PostHistoryInstructionsService';
import { MasterPresetService } from './domain/services/MasterPresetService';
import { DefaultPresetService } from './domain/services/DefaultPresetService';
import { PresetType } from './domain/models/preset/Preset';
import { dataService } from './services/DataService';

// 加载环境变量
dotenv.config();

// 检查必要的环境变量
if (!process.env.OPENROUTER_API_KEY) {
  console.warn('警告: OPENROUTER_API_KEY 环境变量未设置');
}

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 声明全局变量以便在整个应用中使用
let presetRepository: SQLitePresetRepository;

// 初始化OpenRouter客户端
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || 'dummy-key',
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:3000',
    'X-Title': 'LadySion Chat'
  }
});

// 预设系统初始化
async function initializePresetSystem() {
  try {
    // 初始化数据服务
    await dataService.initialize();
    console.log('数据服务初始化完成');

    // 创建SQLite存储库
    const dbPath = path.join(process.cwd(), 'data', 'presets.db');
    presetRepository = new SQLitePresetRepository(dbPath);
    await presetRepository.initialize();

    // 创建用例层
    const presetUseCases = new PresetUseCases(presetRepository);

    // 创建服务层
    const macroSystem = new MacroSystem();
    const instructModeService = new InstructModeService(presetUseCases, macroSystem);
    const contextTemplateService = new ContextTemplateService(presetUseCases, macroSystem);
    const systemPromptService = new SystemPromptService(presetUseCases, macroSystem);
    const postHistoryInstructionsService = new PostHistoryInstructionsService(presetRepository, macroSystem);
    
    // 创建主预设服务
    const masterPresetService = new MasterPresetService(
      presetUseCases,
      instructModeService,
      contextTemplateService,
      systemPromptService
    );

    // 创建控制器
    const presetController = new PresetController(
      presetUseCases,
      instructModeService,
      contextTemplateService,
      systemPromptService,
      masterPresetService
    );

    // 创建角色和会话控制器
    // const characterController = new CharacterController();
    // const conversationController = new ConversationController();

    // 创建默认预设服务并初始化默认预设
    const defaultPresetService = new DefaultPresetService();
    await initializeDefaultPresets(presetRepository, defaultPresetService);

    // 注册路由
    app.use('/api', createPresetRoutes(presetController));
    // app.use('/api/characters', createCharacterRoutes(characterController));
    // app.use('/api/conversations', createConversationRoutes(conversationController));

    console.log('预设系统已注册');
    // console.log('角色和会话系统已注册');
    return presetRepository;
  } catch (error) {
    console.error('预设系统初始化失败:', error);
    throw error;
  }
}

// 初始化默认预设
async function initializeDefaultPresets(repository: SQLitePresetRepository, defaultService: DefaultPresetService) {
  try {
    const defaultPresets = defaultService.getAllDefaultPresets();

    // 检查并添加默认指令模式预设
    for (const preset of defaultPresets.instruct) {
      const existing = await repository.getPresetById(PresetType.INSTRUCT, preset.id);
      if (!existing) {
        await repository.savePreset(PresetType.INSTRUCT, preset);
        console.log(`已添加默认指令预设: ${preset.name}`);
      }
    }

    // 检查并添加默认上下文模板预设
    for (const preset of defaultPresets.context) {
      const existing = await repository.getPresetById(PresetType.CONTEXT, preset.id);
      if (!existing) {
        await repository.savePreset(PresetType.CONTEXT, preset);
        console.log(`已添加默认上下文预设: ${preset.name}`);
      }
    }

    // 检查并添加默认系统提示词预设
    for (const preset of defaultPresets.systemPrompt) {
      const existing = await repository.getPresetById(PresetType.SYSTEM_PROMPT, preset.id);
      if (!existing) {
        await repository.savePreset(PresetType.SYSTEM_PROMPT, preset);
        console.log(`已添加默认系统提示词预设: ${preset.name}`);
      }
    }

    // 检查并添加默认后历史指令预设
    for (const preset of defaultPresets.postHistoryInstructions) {
      const existing = await repository.getPresetById(PresetType.POST_HISTORY_INSTRUCTIONS, preset.id);
      if (!existing) {
        await repository.savePreset(PresetType.POST_HISTORY_INSTRUCTIONS, preset);
        console.log(`已添加默认后历史指令预设: ${preset.name}`);
      }
    }

    console.log('默认预设初始化完成');
  } catch (error) {
    console.error('初始化默认预设失败:', error);
  }
}

// 聊天相关路由
app.post('/api/chat', async (req, res) => {
  try {
    const { message, character, conversationId, model, usePresets = true } = req.body;

    if (!message) {
      return res.status(400).json({ error: '消息不能为空' });
    }

    if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === 'dummy-key') {
      return res.status(500).json({ 
        error: 'OpenRouter API密钥未配置，请设置OPENROUTER_API_KEY环境变量',
        setupGuide: '请查看 OPENROUTER_SETUP.md 了解配置说明'
      });
    }

    // 选择模型
    const selectedModel = model || process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct:free';
    
    console.log(`聊天请求 - 模型: ${selectedModel}, 角色: ${character || '无'}, 对话ID: ${conversationId || '新对话'}`);

    // 使用预设系统构建消息
    let messages: any[] = [];
    
    if (usePresets) {
      try {
        // 获取当前选中的系统提示词预设
        const systemPromptConfig = await presetRepository.getConfiguration('system_prompt_config');
        if (systemPromptConfig?.selectedPresetId) {
          const systemPromptPreset = await presetRepository.getPresetById(
            PresetType.SYSTEM_PROMPT, 
            systemPromptConfig.selectedPresetId
          );
          if (systemPromptPreset && (systemPromptPreset as any).enabled) {
            messages.push({ role: 'system', content: (systemPromptPreset as any).content });
          }
        }

        // 获取当前选中的指令模式预设
        const instructConfig = await presetRepository.getConfiguration('instruct_mode_config');
        if (instructConfig?.selectedPresetId) {
          const instructPreset = await presetRepository.getPresetById(
            PresetType.INSTRUCT, 
            instructConfig.selectedPresetId
          );
          if (instructPreset) {
            // 使用指令预设格式化用户消息
            const formattedMessage = `${(instructPreset as any).inputSequence}${message}${(instructPreset as any).inputSuffix}`;
            messages.push({ role: 'user', content: formattedMessage });
          } else {
            messages.push({ role: 'user', content: message });
          }
        } else {
          messages.push({ role: 'user', content: message });
        }
      } catch (presetError) {
        console.warn('预设系统错误，使用默认配置:', presetError);
        // 降级到默认配置
        messages = [
          { role: 'system', content: '你是一个有帮助的AI助手。' },
          { role: 'user', content: message }
        ];
      }
    } else {
      // 不使用预设时的简单配置
      let systemPrompt = '你是一个有帮助的AI助手。';
      if (character) {
        systemPrompt = `你是${character}，请保持角色特征进行对话。`;
      }
      messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ];
    }

    // 使用OpenRouter API进行聊天
    const response = await openai.chat.completions.create({
      model: selectedModel,
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const reply = response.choices[0]?.message?.content || '抱歉，我无法生成回复。';
    
    console.log(`聊天回复成功 - 长度: ${reply.length} 字符`);

    res.json({
      message: reply,
      conversationId: conversationId || 'new',
      model: selectedModel,
      tokens: response.usage?.total_tokens || 0,
      usedPresets: usePresets
    });
  } catch (error: any) {
    console.error('聊天API错误:', error);
    
    // 提供更详细的错误信息
    if (error.status === 401) {
      res.status(401).json({ 
        error: 'OpenRouter API密钥无效',
        details: '请检查OPENROUTER_API_KEY是否正确'
      });
    } else if (error.status === 429) {
      res.status(429).json({ 
        error: '请求频率过高',
        details: '请稍后再试'
      });
    } else if (error.status === 400) {
      res.status(400).json({ 
        error: '请求参数错误',
        details: error.message || '模型可能不支持或参数格式错误'
      });
    } else {
      res.status(500).json({ 
        error: '内部服务器错误',
        details: error.message || '未知错误'
      });
    }
  }
});

// 获取可用模型列表
app.get('/api/models', (req, res) => {
  const models = [
    {
      id: 'meta-llama/llama-3.1-8b-instruct:free',
      name: 'Llama 3.1 8B (免费)',
      description: '高质量的开源模型，支持中英文对话',
      free: true,
      provider: 'Meta'
    },
    {
      id: 'meta-llama/llama-3.1-70b-instruct',
      name: 'Llama 3.1 70B',
      description: '更强大的Llama模型，理解能力更强',
      free: false,
      provider: 'Meta'
    },
    {
      id: 'openai/gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      description: 'OpenAI的经典对话模型',
      free: false,
      provider: 'OpenAI'
    },
    {
      id: 'openai/gpt-4',
      name: 'GPT-4',
      description: 'OpenAI最强的对话模型',
      free: false,
      provider: 'OpenAI'
    },
    {
      id: 'anthropic/claude-3-haiku',
      name: 'Claude 3 Haiku',
      description: 'Anthropic快速响应模型',
      free: false,
      provider: 'Anthropic'
    },
    {
      id: 'anthropic/claude-3-sonnet',
      name: 'Claude 3 Sonnet',
      description: 'Anthropic平衡性能的模型',
      free: false,
      provider: 'Anthropic'
    }
  ];
  
  res.json({
    models,
    currentDefault: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct:free'
  });
});

// 角色相关路由
app.get('/api/characters', async (req, res) => {
  try {
    const characters = await dataService.getAllCharacters();
    res.json(characters);
  } catch (error) {
    console.error('获取角色失败:', error);
    res.status(500).json({ error: '获取角色失败' });
  }
});

app.get('/api/characters/:id', async (req, res) => {
  try {
    const character = await dataService.getCharacterById(req.params.id);
    if (!character) {
      return res.status(404).json({ error: '角色未找到' });
    }
    res.json(character);
  } catch (error) {
    console.error('获取角色失败:', error);
    res.status(500).json({ error: '获取角色失败' });
  }
});

app.post('/api/characters', async (req, res) => {
  try {
    const character = await dataService.createCharacter(req.body);
    res.status(201).json(character);
  } catch (error) {
    console.error('创建角色失败:', error);
    res.status(500).json({ error: '创建角色失败' });
  }
});

app.put('/api/characters/:id', async (req, res) => {
  try {
    const character = await dataService.updateCharacter(req.params.id, req.body);
    if (!character) {
      return res.status(404).json({ error: '角色未找到' });
    }
    res.json(character);
  } catch (error) {
    console.error('更新角色失败:', error);
    res.status(500).json({ error: '更新角色失败' });
  }
});

app.delete('/api/characters/:id', async (req, res) => {
  try {
    const success = await dataService.deleteCharacter(req.params.id);
    if (!success) {
      return res.status(404).json({ error: '角色未找到' });
    }
    res.status(204).end();
  } catch (error) {
    console.error('删除角色失败:', error);
    res.status(500).json({ error: '删除角色失败' });
  }
});

// 对话相关路由
app.get('/api/conversations', async (req, res) => {
  try {
    const conversations = await dataService.getAllConversations();
    // 为每个会话附加角色信息
    const conversationsWithCharacters = await Promise.all(conversations.map(async (conv) => {
      const character = await dataService.getCharacterById(conv.characterId);
      return {
        ...conv,
        character: character || { id: conv.characterId, name: '未知角色' }
      };
    }));
    res.json(conversationsWithCharacters);
  } catch (error) {
    console.error('获取会话失败:', error);
    res.status(500).json({ error: '获取会话失败' });
  }
});

app.get('/api/conversations/:id', async (req, res) => {
  try {
    const conversation = await dataService.getConversationById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: '会话未找到' });
    }
    
    // 附加角色信息
    const character = await dataService.getCharacterById(conversation.characterId);
    const conversationWithCharacter = {
      ...conversation,
      character: character || { id: conversation.characterId, name: '未知角色' }
    };
    
    res.json(conversationWithCharacter);
  } catch (error) {
    console.error('获取会话失败:', error);
    res.status(500).json({ error: '获取会话失败' });
  }
});

app.post('/api/conversations', async (req, res) => {
  try {
    const { characterId } = req.body;
    if (!characterId) {
      return res.status(400).json({ error: '缺少角色ID' });
    }
    
    const conversation = await dataService.createConversation(characterId);
    const character = await dataService.getCharacterById(characterId);
    
    res.status(201).json({
      ...conversation,
      character: character || { id: characterId, name: '未知角色' }
    });
  } catch (error) {
    console.error('创建会话失败:', error);
    res.status(500).json({ error: '创建会话失败' });
  }
});

app.post('/api/conversations/:id/messages', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: '消息内容不能为空' });
    }

    // 添加用户消息
    const userMessage = await dataService.addMessageToConversation(req.params.id, {
      role: 'user',
      content,
      timestamp: Date.now()
    });

    // 获取会话和角色信息以生成AI回复
    const conversation = await dataService.getConversationById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: '会话未找到' });
    }

    const character = await dataService.getCharacterById(conversation.characterId);
    
    // 生成AI回复
    try {
      const messages: any[] = [
        { role: 'system', content: character?.systemPrompt || '你是一个有帮助的AI助手。' },
        ...conversation.messages.slice(-5).map(m => ({ // 只取最近5条消息作为上下文
          role: m.role,
          content: m.content
        }))
      ];

      const response = await openai.chat.completions.create({
        model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct:free',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      const reply = response.choices[0]?.message?.content || '抱歉，我无法生成回复。';
      
      // 添加AI回复
      const aiMessage = await dataService.addMessageToConversation(req.params.id, {
        role: 'assistant',
        content: reply,
        timestamp: Date.now()
      });

      res.json(aiMessage);
    } catch (aiError) {
      console.error('AI回复生成失败:', aiError);
      // 即使AI回复失败，也要返回用户消息
      res.json(userMessage);
    }
  } catch (error) {
    console.error('发送消息失败:', error);
    res.status(500).json({ error: '发送消息失败' });
  }
});

app.delete('/api/conversations/:id', async (req, res) => {
  try {
    const success = await dataService.deleteConversation(req.params.id);
    if (!success) {
      return res.status(404).json({ error: '会话未找到' });
    }
    res.status(204).end();
  } catch (error) {
    console.error('删除会话失败:', error);
    res.status(500).json({ error: '删除会话失败' });
  }
});

// 静态文件服务（生产环境）
// app.use(express.static('../client/dist'));

// 添加调试路由
app.get('/api/debug/routes', (req, res) => {
  const routes: Array<{ path: string; methods: string[] }> = [];
  app._router.stack.forEach((middleware: any) => {
    if(middleware.route) { // 路由
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if(middleware.name === 'router') { // 路由器
      middleware.handle.stack.forEach((handler: any) => {
        if(handler.route) {
          routes.push({
            path: handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  res.json(routes);
});

// 处理SPA路由（开发环境）
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
// });

// 错误处理中间件
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('服务器错误:', error);
  res.status(500).json({ error: '内部服务器错误' });
});

// 启动服务器
async function startServer() {
  try {
    // 初始化预设系统
    const presetRepository = await initializePresetSystem();

    const server = createServer(app);

    server.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
    });

    // 优雅关闭
    process.on('SIGTERM', async () => {
      console.log('收到SIGTERM信号，正在关闭服务器...');
      await presetRepository.close();
      server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('收到SIGINT信号，正在关闭服务器...');
      await presetRepository.close();
      server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
}

startServer(); 