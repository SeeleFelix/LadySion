import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { OpenAI } from 'openai';
import path from 'path';
import { PresetController } from './api/controllers/PresetController';
import { createPresetRoutes } from './api/routes/presetRoutes';
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

// 加载环境变量
dotenv.config();

// 检查必要的环境变量
if (!process.env.OPENAI_API_KEY) {
  console.warn('警告: OPENAI_API_KEY 环境变量未设置');
}

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 初始化OpenAI客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
});

// 预设系统初始化
async function initializePresetSystem() {
  try {
    // 创建SQLite存储库
    const dbPath = path.join(process.cwd(), 'data', 'presets.db');
    const presetRepository = new SQLitePresetRepository(dbPath);
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

    // 创建默认预设服务并初始化默认预设
    const defaultPresetService = new DefaultPresetService();
    await initializeDefaultPresets(presetRepository, defaultPresetService);

    // 注册路由
    app.use('/api', createPresetRoutes(presetController));

    console.log('预设系统已注册');
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
    const { message, character, conversationId } = req.body;

    if (!message) {
      return res.status(400).json({ error: '消息不能为空' });
    }

    // 这里应该使用预设系统来格式化消息
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: '你是一个有帮助的AI助手。' },
        { role: 'user', content: message }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    res.json({
      message: response.choices[0]?.message?.content || '抱歉，我无法生成回复。',
      conversationId: conversationId || 'new'
    });
  } catch (error) {
    console.error('聊天API错误:', error);
    res.status(500).json({ error: '内部服务器错误' });
  }
});

// 角色相关路由
app.get('/api/characters', (req, res) => {
  const characters = [
    { id: '1', name: '小红', avatar: 'https://placekitten.com/100/100', description: '活泼开朗的女孩，喜欢帮助他人。' },
    { id: '2', name: '小明', avatar: 'https://placekitten.com/101/101', description: '聪明好学的男孩，对科学充满好奇心。' },
    { id: '3', name: '阿狸', avatar: 'https://placekitten.com/102/102', description: '九尾狐，古灵精怪，喜欢恶作剧。' }
  ];
  res.json(characters);
});

// 对话相关路由
app.get('/api/conversations', (req, res) => {
  // 模拟对话数据
  const conversations = [
    { id: '1', character: '小红', lastMessage: '下次再聊吧！', updatedAt: '2023-11-01 10:30' },
    { id: '2', character: '阿狸', lastMessage: '你好呀~', updatedAt: '2023-10-31 15:45' }
  ];
  res.json(conversations);
});

// 静态文件服务（生产环境）
app.use(express.static('../client/dist'));

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
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

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