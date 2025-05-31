/**
 * 依赖注入容器 - 管理应用程序依赖关系
 */
export class DIContainer {
  private static instance: DIContainer;
  private dependencies = new Map<string, any>();
  private singletons = new Map<string, any>();
  private factories = new Map<string, () => any>();

  private constructor() {}

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  /**
   * 注册瞬态依赖
   */
  register<T>(token: string, factory: () => T): void {
    this.factories.set(token, factory);
  }

  /**
   * 注册单例依赖
   */
  registerSingleton<T>(token: string, factory: () => T): void {
    this.factories.set(token, factory);
    // 标记为单例
    this.singletons.set(token, null);
  }

  /**
   * 注册实例
   */
  registerInstance<T>(token: string, instance: T): void {
    this.dependencies.set(token, instance);
  }

  /**
   * 解析依赖
   */
  resolve<T>(token: string): T {
    // 检查是否有直接注册的实例
    if (this.dependencies.has(token)) {
      return this.dependencies.get(token) as T;
    }

    // 检查是否为单例
    if (this.singletons.has(token)) {
      let instance = this.singletons.get(token);
      if (instance === null) {
        // 首次创建单例
        const factory = this.factories.get(token);
        if (!factory) {
          throw new Error(`依赖未注册: ${token}`);
        }
        instance = factory();
        this.singletons.set(token, instance);
      }
      return instance as T;
    }

    // 检查是否有工厂方法
    const factory = this.factories.get(token);
    if (factory) {
      return factory() as T;
    }

    throw new Error(`依赖未注册: ${token}`);
  }

  /**
   * 检查依赖是否已注册
   */
  has(token: string): boolean {
    return this.dependencies.has(token) ||
      this.factories.has(token) ||
      this.singletons.has(token);
  }

  /**
   * 清空容器
   */
  clear(): void {
    this.dependencies.clear();
    this.singletons.clear();
    this.factories.clear();
  }

  /**
   * 创建作用域容器
   */
  createScope(): DIContainer {
    const scopedContainer = new DIContainer();

    // 复制工厂方法，但不复制单例实例
    this.factories.forEach((factory, token) => {
      scopedContainer.factories.set(token, factory);
    });

    return scopedContainer;
  }
}
