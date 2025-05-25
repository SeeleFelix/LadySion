import express, { Express } from 'express';
import cors from 'cors';
import { CharacterController, ConversationController, createCharacterRoutes, createConversationRoutes } from './infrastructure/adapters/web';
import { AppConfig, DependencyContainer, createDefaultCharacters } from './infrastructure/config';
import { CharacterService, ConversationService } from './domain/ports/input';
import { LLMService } from './domain/ports/output';

/**
 * 应用程序类 - 应用的入口点
 */
export class Application {
  private app: Express;
  private container: DependencyContainer;
  private config: AppConfig;
  
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
    } catch (error) {
      console.error('应用初始化失败:', error);
      throw error;
    }
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