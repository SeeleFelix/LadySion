import { CharacterRepository, ConversationRepository, LLMService } from '../../domain/ports/output';
import { CharacterService, ConversationService } from '../../domain/ports/input';
import { CharacterServiceImpl, ConversationServiceImpl } from '../../domain/services';
import { OpenAIAdapter, LangGraphAdapter, OpenRouterAdapter } from '../adapters/llm';
import { InMemoryCharacterRepository, InMemoryConversationRepository } from '../repositories';
import { CharacterController, ConversationController } from '../adapters/web';
import { AppConfig } from './AppConfig';

/**
 * 依赖容器 - 管理应用的依赖注入
 */
export class DependencyContainer {
  private static instance: DependencyContainer;
  private container: Map<string, any> = new Map();
  
  private constructor() {
    // 注册默认依赖
    this.registerDefaults();
  }
  
  /**
   * 获取单例实例
   */
  public static getInstance(): DependencyContainer {
    if (!DependencyContainer.instance) {
      DependencyContainer.instance = new DependencyContainer();
    }
    return DependencyContainer.instance;
  }
  
  /**
   * 注册依赖
   */
  public register<T>(key: string, instance: T): void {
    this.container.set(key, instance);
  }
  
  /**
   * 解析依赖
   */
  public resolve<T>(key: string): T {
    const instance = this.container.get(key);
    if (!instance) {
      throw new Error(`依赖未注册: ${key}`);
    }
    return instance as T;
  }
  
  /**
   * 检查依赖是否已注册
   */
  public has(key: string): boolean {
    return this.container.has(key);
  }
  
  /**
   * 注册默认依赖
   */
  private registerDefaults(): void {
    const config = AppConfig.getInstance();
    
    // 注册仓储
    const characterRepository: CharacterRepository = new InMemoryCharacterRepository();
    const conversationRepository: ConversationRepository = new InMemoryConversationRepository();
    
    this.register('CharacterRepository', characterRepository);
    this.register('ConversationRepository', conversationRepository);
    
    // 注册LLM服务
    let llmService: LLMService;
    
    // 根据配置选择LLM提供商
    const llmProvider = config.get('llmProvider');
    if (llmProvider === 'openrouter') {
      // 使用OpenRouter
      llmService = new OpenRouterAdapter(
        config.get('openrouterApiKey'),
        config.get('openrouterModel')
      );
    } else {
      // 默认使用OpenAI
      llmService = new OpenAIAdapter(config.get('openaiApiKey'));
    }
    
    // 根据配置决定是否使用LangGraph
    if (config.get('useLangGraph')) {
      llmService = new LangGraphAdapter(
        llmProvider === 'openrouter' ? config.get('openrouterApiKey') : config.get('openaiApiKey'),
        llmService,
        llmProvider === 'openrouter',
        llmProvider === 'openrouter' ? config.get('openrouterModel') : 'gpt-3.5-turbo'
      );
    }
    
    this.register('LLMService', llmService);
    
    // 注册领域服务
    const characterService: CharacterService = new CharacterServiceImpl(characterRepository);
    const conversationService: ConversationService = new ConversationServiceImpl(
      conversationRepository,
      llmService
    );
    
    this.register('CharacterService', characterService);
    this.register('ConversationService', conversationService);
    
    // 注册控制器
    const characterController = new CharacterController(characterService);
    const conversationController = new ConversationController(
      conversationService,
      characterService
    );
    
    this.register('CharacterController', characterController);
    this.register('ConversationController', conversationController);
  }
} 