import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'

// 基础设施层
import { DIContainer } from './infrastructure/config/DIContainer'
import { OpenRouterAdapter } from './infrastructure/adapters/OpenRouterAdapter'
import { SQLiteChatRepository } from './infrastructure/repositories/SQLiteChatRepository'
import { SQLitePresetRepository } from './infrastructure/repositories/SQLitePresetRepository'
import { createDefaultPresets } from './infrastructure/config/DefaultPresets'

// 领域层
import { ChatOrchestrationService } from './domain/services/ChatOrchestrationService'
import { MacroSystem } from './domain/services/MacroSystem'

// 应用层
import { SendMessageUseCase } from './application/usecases/SendMessageUseCase'
import { ChatApplicationService } from './application/services/ChatApplicationService'
import { PresetUseCases } from './application/usecases/PresetUseCases'
import { PresetApplicationService } from './application/services/PresetApplicationService'

// 表现层
import { ChatController } from './presentation/controllers/ChatController'
import { PresetController } from './presentation/controllers/PresetController'
import { createPresetRoutes } from './presentation/routes/presetRoutes'

// 中间件
import { errorHandlingMiddleware } from './presentation/middleware/errorHandling'
import { validationMiddleware } from './presentation/middleware/validation'

// 加载环境变量
dotenv.config()

/**
 * 应用程序主类
 */
class Application {
  private app: express.Application
  private container: DIContainer

  constructor() {
    this.app = express()
    this.container = DIContainer.getInstance()
  }

  /**
   * 初始化应用程序
   */
  async initialize(): Promise<void> {
    // 配置基础中间件
    this.configureBasicMiddleware()
    
    // 注册依赖
    await this.registerDependencies()
    
    // 配置路由
    this.configureRoutes()
    
    // 配置错误处理
    this.configureErrorHandling()
  }

  /**
   * 配置基础中间件
   */
  private configureBasicMiddleware(): void {
    this.app.use(cors())
    this.app.use(express.json())
    this.app.use(validationMiddleware)
  }

  /**
   * 注册依赖
   */
  private async registerDependencies(): Promise<void> {
    // 基础设施层 - LLM适配器
    const openRouterAdapter = new OpenRouterAdapter(
      process.env.OPENROUTER_API_KEY || 'dummy-key',
      'https://openrouter.ai/api/v1',
      process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct:free'
    )
    await openRouterAdapter.initialize()
    this.container.registerInstance('LLMAdapter', openRouterAdapter)

    // 基础设施层 - 聊天存储库
    const chatRepository = new SQLiteChatRepository(
      path.join(process.cwd(), 'data', 'chats.db')
    )
    await chatRepository.initialize()
    this.container.registerInstance('ChatRepository', chatRepository)

    // 基础设施层 - 预设存储库
    const presetRepository = new SQLitePresetRepository(
      path.join(process.cwd(), 'data', 'presets.db')
    )
    await presetRepository.initialize()
    this.container.registerInstance('PresetRepository', presetRepository)

    // 角色存储库占位符 - 需要实现
    this.container.registerInstance('CharacterRepository', {
      findById: async () => null,
      findByName: async () => null,
      findAll: async () => [],
      save: async () => {},
      delete: async () => false,
      exists: async () => false
    })

    // 领域服务
    this.container.registerSingleton('ChatOrchestrationService', () => 
      new ChatOrchestrationService()
    )

    const macroSystem = new MacroSystem()
    this.container.registerInstance('MacroSystem', macroSystem)

    // 应用层用例
    this.container.registerSingleton('SendMessageUseCase', () => 
      new SendMessageUseCase(
        this.container.resolve('ChatRepository'),
        this.container.resolve('CharacterRepository'),
        this.container.resolve('ChatOrchestrationService'),
        this.container.resolve('LLMAdapter')
      )
    )

    this.container.registerSingleton('PresetUseCases', () => 
      new PresetUseCases(this.container.resolve('PresetRepository'))
    )

    // 应用层服务
    this.container.registerSingleton('ChatApplicationService', () => 
      new ChatApplicationService(
        this.container.resolve('SendMessageUseCase'),
        this.container.resolve('ChatRepository'),
        this.container.resolve('CharacterRepository'),
        this.container.resolve('ChatOrchestrationService')
      )
    )

    this.container.registerSingleton('PresetApplicationService', () => 
      new PresetApplicationService(
        this.container.resolve('PresetUseCases'),
        this.container.resolve('MacroSystem')
      )
    )

    // 表现层控制器
    this.container.registerSingleton('ChatController', () => 
      new ChatController(this.container.resolve('ChatApplicationService'))
    )

    this.container.registerSingleton('PresetController', () => 
      new PresetController(this.container.resolve('PresetApplicationService'))
    )

    // 初始化默认预设
    await this.initializeDefaultPresets()
  }

  /**
   * 初始化默认预设
   */
  private async initializeDefaultPresets(): Promise<void> {
    try {
      const presetUseCases = this.container.resolve<PresetUseCases>('PresetUseCases')
      await createDefaultPresets(presetUseCases)
      console.log('默认预设初始化完成')
    } catch (error) {
      console.error('默认预设初始化失败:', error)
    }
  }

  /**
   * 配置路由
   */
  private configureRoutes(): void {
    const chatController = this.container.resolve<ChatController>('ChatController')
    const presetController = this.container.resolve<PresetController>('PresetController')

    // 聊天相关路由
    this.app.post('/api/v1/conversations', (req, res) => 
      chatController.createChat(req, res)
    )
    this.app.get('/api/v1/conversations', (req, res) => 
      chatController.getChats(req, res)
    )
    this.app.post('/api/v1/conversations/:id/messages', (req, res) => 
      chatController.sendMessage(req, res)
    )
    this.app.get('/api/v1/conversations/:id/messages', (req, res) => 
      chatController.getChatHistory(req, res)
    )
    this.app.delete('/api/v1/conversations/:id', (req, res) => 
      chatController.deleteChat(req, res)
    )

    // 预设相关路由
    this.app.use('/api/v1', createPresetRoutes(presetController))

    // 健康检查
    this.app.get('/api/v1/health', (req, res) => { 
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '2.0.0'
      })
    })

    // 兼容旧API路径
    this.app.use('/api', createPresetRoutes(presetController))
  }

  /**
   * 配置错误处理
   */
  private configureErrorHandling(): void {
    this.app.use(errorHandlingMiddleware)
  }

  /**
   * 启动应用程序
   */
  start(): void {
    const PORT = process.env.PORT || 3000
    
    this.app.listen(PORT, () => {
      console.log(`Lady Sion 服务器已启动，端口: ${PORT}`)
      console.log(`健康检查: http://localhost:${PORT}/api/v1/health`)
      console.log('新架构迁移完成 ✅')
    })
  }
}

/**
 * 启动应用程序
 */
async function startApplication(): Promise<void> {
  try {
    const app = new Application()
    await app.initialize()
    app.start()
  } catch (error) {
    console.error('应用程序启动失败:', error)
    process.exit(1)
  }
}

// 启动应用
if (require.main === module) {
  startApplication()
}

export { Application } 