import express, { Express } from 'express';
import cors from 'cors';
import { CharacterController, ConversationController, createCharacterRoutes, createConversationRoutes } from './infrastructure/adapters/web';
import { AppConfig, DependencyContainer, createDefaultCharacters } from './infrastructure/config';
import { CharacterService, ConversationService } from './domain/ports/input';
import { LLMService } from './domain/ports/output';
import { PresetUseCases } from './domain/usecases/preset/PresetUseCases';
import { FileSystemPresetRepository } from './infrastructure/adapters/FileSystemPresetRepository';
import { MacroSystem } from './domain/services/MacroSystem';
import { InstructModeService } from './domain/services/InstructModeService';
import { ContextTemplateService } from './domain/services/ContextTemplateService';
import { SystemPromptService } from './domain/services/SystemPromptService';
import { MasterPresetService } from './domain/services/MasterPresetService';
import { PresetController } from './api/controllers/PresetController';
import { createPresetRoutes } from './api/routes/presetRoutes';
import path from 'path';
import { createDefaultPresets } from './data/defaultPresets';

/**
 * 应用程序类 - 应用的入口点
 */
export class Application {
  private app: Express;
  private container: DependencyContainer;
  private config: AppConfig;
  private context: {
    presetUseCases?: PresetUseCases;
    macroSystem?: MacroSystem;
    instructModeService?: InstructModeService;
    contextTemplateService?: ContextTemplateService;
    systemPromptService?: SystemPromptService;
    masterPresetService?: MasterPresetService;
  } = {};
  
  constructor() {
    this.app = express();
    this.container = DependencyContainer.getInstance();
    this.config = AppConfig.getInstance();
    
    this.configureMiddleware();
    this.configureRoutes();
  }
  
  /**
   * 配置中间件
   */
  private configureMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
    
    // 静态文件（前端资源）
    this.app.use(express.static('dist/client'));
  }
  
  /**
   * 配置路由
   */
  private configureRoutes(): void {
    // 获取控制器
    const characterController = this.container.resolve<CharacterController>('CharacterController');
    const conversationController = this.container.resolve<ConversationController>('ConversationController');
    
    // 配置路由
    this.app.use('/api/characters', createCharacterRoutes(characterController));
    this.app.use('/api/conversations', createConversationRoutes(conversationController));
    
    // 健康检查
    this.app.get('/health', (req, res) => {
      res.status(200).json({ status: 'ok' });
    });
    
    // 所有其他路由都指向前端应用（单页应用支持）
    this.app.get('*', (req, res) => {
      if (req.url.startsWith('/api')) {
        res.status(404).json({ message: '未找到API端点' });
      } else {
        res.sendFile('index.html', { root: 'dist/client' });
      }
    });
  }
  
  /**
   * 初始化应用
   */
  public async initialize(): Promise<void> {
    // 验证配置
    if (!this.config.validate()) {
      throw new Error('配置验证失败');
    }
    
    try {
      // 初始化LLM服务
      const llmService = this.container.resolve<LLMService>('LLMService');
      await llmService.initialize();
      
      // 创建默认角色
      const characterService = this.container.resolve<CharacterService>('CharacterService');
      await createDefaultCharacters(characterService);
      
      // 注册预设系统
      this.registerPresetSystem();
      
      // 创建默认预设
      if (this.context.presetUseCases) {
        await createDefaultPresets(this.context.presetUseCases);
      }
    } catch (error) {
      console.error('应用初始化失败:', error);
      throw error;
    }
  }
  
  /**
   * 添加预设系统注册方法
   */
  private registerPresetSystem() {
    // 创建预设存储库
    const presetRepository = new FileSystemPresetRepository(path.join(process.cwd(), 'data/presets'));
    
    // 创建预设用例
    const presetUseCases = new PresetUseCases(presetRepository);
    
    // 创建宏系统
    const macroSystem = new MacroSystem();
    macroSystem.registerDefaultMacros();
    
    // 创建服务
    const instructModeService = new InstructModeService(presetUseCases, macroSystem);
    const contextTemplateService = new ContextTemplateService(presetUseCases, macroSystem);
    const systemPromptService = new SystemPromptService(presetUseCases, macroSystem);
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
    
    // 注册路由
    const presetRoutes = createPresetRoutes(presetController);
    this.app.use('/api', presetRoutes);
    
    // 将服务添加到应用程序上下文
    this.context.presetUseCases = presetUseCases;
    this.context.macroSystem = macroSystem;
    this.context.instructModeService = instructModeService;
    this.context.contextTemplateService = contextTemplateService;
    this.context.systemPromptService = systemPromptService;
    this.context.masterPresetService = masterPresetService;
  }
  
  /**
   * 启动应用
   */
  public start(): void {
    const port = this.config.get('port');
    
    this.app.listen(port, () => {
      console.log(`服务器已启动，监听端口 ${port}`);
    });
  }
} 