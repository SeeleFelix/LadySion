/**
 * 应用配置 - 管理应用的配置参数
 */
export class AppConfig {
  private static instance: AppConfig;
  private config: Record<string, any> = {};
  
  private constructor() {
    // 初始化默认配置
    this.config = {
      port: process.env.PORT || 3000,
      openaiApiKey: process.env.OPENAI_API_KEY || '',
      openrouterApiKey: process.env.OPENROUTER_API_KEY || '',
      openrouterModel: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
      useLangGraph: process.env.USE_LANGGRAPH === 'true',
      llmProvider: process.env.LLM_PROVIDER || 'openai', // 可选值: 'openai' 或 'openrouter'
    };
  }
  
  /**
   * 获取单例实例
   */
  public static getInstance(): AppConfig {
    if (!AppConfig.instance) {
      AppConfig.instance = new AppConfig();
    }
    return AppConfig.instance;
  }
  
  /**
   * 获取配置项
   */
  public get(key: string): any {
    return this.config[key];
  }
  
  /**
   * 设置配置项
   */
  public set(key: string, value: any): void {
    this.config[key] = value;
  }
  
  /**
   * 获取所有配置
   */
  public getAll(): Record<string, any> {
    return { ...this.config };
  }
  
  /**
   * 验证配置是否有效
   */
  public validate(): boolean {
    // 验证必要的配置是否存在
    const provider = this.config.llmProvider;
    
    if (provider === 'openai' && !this.config.openaiApiKey) {
      console.warn('警告: 使用OpenAI但缺少OPENAI_API_KEY配置，LLM功能将不可用');
      // 不返回false，允许应用启动
    }
    
    if (provider === 'openrouter' && !this.config.openrouterApiKey) {
      console.warn('警告: 使用OpenRouter但缺少OPENROUTER_API_KEY配置，LLM功能将不可用');
      // 不返回false，允许应用启动
    }
    
    return true;
  }
} 