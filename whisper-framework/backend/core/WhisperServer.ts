/**
 * 🌟 Whisper 服务器核心类
 * 框架无关的后端实现，自动处理路由和HTTP细节
 */

import type {
  HttpAdapter,
  RequestContext,
  SeekerImplementation,
  WhisperServerConfig,
} from "../types/backend.ts";
import { SeekerRegistry } from "./SeekerRegistry.ts";
import { RequestDispatcher } from "./RequestDispatcher.ts";
import { getDoctrine } from "../../core/doctrine.ts";
import type { Doctrine } from "../../types/core.ts";

/**
 * 🎯 Whisper 服务器主类
 */
export class WhisperServer {
  private registry: SeekerRegistry;
  private dispatcher: RequestDispatcher;
  private config: WhisperServerConfig;
  private adapters: Map<string, HttpAdapter> = new Map();
  private isStarted = false;

  constructor(config: WhisperServerConfig = {}) {
    this.config = {
      port: 8000,
      host: "localhost",
      whisperPath: "/api/whisper",
      ...config,
    };

    this.registry = SeekerRegistry.getInstance();
    this.dispatcher = new RequestDispatcher();
  }

  /**
   * 🔮 注册 Seeker 实现
   */
  registerSeeker(eidolonName: string, implementation: SeekerImplementation): void {
    this.registry.register(eidolonName, implementation);
    console.log(`✨ 已注册 Seeker: ${eidolonName}`);
  }

  /**
   * 🎭 注册 HTTP 框架适配器
   */
  registerAdapter(adapter: HttpAdapter): void {
    this.adapters.set(adapter.name, adapter);
    console.log(`🔌 已注册适配器: ${adapter.name}`);
  }

  /**
   * 🚀 启动服务器
   */
  async start(adapterName: string = "oak", serverInstance?: any): Promise<void> {
    if (this.isStarted) {
      console.warn("⚠️ 服务器已经启动");
      return;
    }

    const adapter = this.adapters.get(adapterName);
    if (!adapter) {
      throw new Error(`未找到适配器: ${adapterName}`);
    }

    // 🔧 合并配置（支持 whisper.config.json）
    const doctrine = await this.loadDoctrine();
    this.mergeConfig(doctrine);

    // 🎯 创建路由处理器
    const handler = this.dispatcher.createHandler();

    // 🌐 挂载到HTTP框架
    await adapter.mount(serverInstance, this.config);

    // 📋 注册 Whisper 路由
    await this.registerWhisperRoutes(adapter, handler);

    this.isStarted = true;

    console.log(`🎉 Whisper 服务器已启动`);
    console.log(`🌐 监听地址: http://${this.config.host}:${this.config.port}`);
    console.log(`🎯 Whisper 路径: ${this.config.whisperPath}`);
    this.printRegisteredRoutes();
  }

  /**
   * 🛑 停止服务器
   */
  async stop(): Promise<void> {
    this.isStarted = false;
    console.log("🛑 Whisper 服务器已停止");
  }

  /**
   * 📊 获取服务器状态
   */
  getStatus() {
    return {
      isStarted: this.isStarted,
      config: this.config,
      stats: this.dispatcher.getStats(),
      adapters: Array.from(this.adapters.keys()),
    };
  }

  /**
   * 📋 获取路由信息
   */
  getRoutes() {
    return this.dispatcher.generateRouteInfo();
  }

  /**
   * 📖 生成 API 文档
   */
  generateApiDocs() {
    return this.dispatcher.generateApiDocs();
  }

  /**
   * 🔧 加载 Doctrine 配置
   */
  private async loadDoctrine(): Promise<Doctrine> {
    try {
      return await getDoctrine();
    } catch (error) {
      console.warn("⚠️ 无法加载 Doctrine 配置，使用默认值");
      return {};
    }
  }

  /**
   * 🔄 合并配置
   */
  private mergeConfig(doctrine: Doctrine): void {
    // 将 Doctrine 配置合并到服务器配置
    if (doctrine.baseUrl) {
      const url = new URL(doctrine.baseUrl);
      this.config.host = url.hostname;
      this.config.port = parseInt(url.port) || (url.protocol === "https:" ? 443 : 80);
    }

    if (doctrine.whisperPath) {
      this.config.whisperPath = doctrine.whisperPath;
    }

    if (doctrine.timeout) {
      this.config.timeout = doctrine.timeout;
    }

    // 认证配置
    if (doctrine.auth) {
      this.config.auth = {
        enabled: true,
        verify: async (token: string) => {
          // 简单的 token 验证示例
          return token === doctrine.auth?.token;
        },
      };
    }

    // 日志配置
    if (doctrine.debug) {
      this.config.logging = {
        enabled: true,
        level: "debug",
        format: "text",
      };
    }
  }

  /**
   * 🎯 注册 Whisper 路由
   */
  private async registerWhisperRoutes(
    adapter: HttpAdapter,
    handler: (context: RequestContext) => Promise<any>,
  ): Promise<void> {
    // 创建通用的 Whisper 路由：POST /whisper/:eidolon/:ritual
    const routePattern = `${this.config.whisperPath}/:eidolon/:ritual`;

    const adaptedHandler = adapter.createRouteHandler(handler);

    // 这里需要适配器实现具体的路由注册逻辑
    // 不同框架的路由注册方式不同，由适配器处理
  }

  /**
   * 📋 打印已注册的路由信息
   */
  private printRegisteredRoutes(): void {
    const routes = this.getRoutes();

    if (routes.length === 0) {
      console.log("⚠️ 没有注册任何 Seeker");
      return;
    }

    console.log("\n📋 已注册的 Whisper 路由:");
    console.log("=".repeat(50));

    const groupedRoutes = new Map<string, string[]>();

    for (const route of routes) {
      if (!groupedRoutes.has(route.eidolon)) {
        groupedRoutes.set(route.eidolon, []);
      }
      groupedRoutes.get(route.eidolon)!.push(route.ritual);
    }

    for (const [eidolon, rituals] of groupedRoutes) {
      console.log(`🔮 ${eidolon}:`);
      for (const ritual of rituals) {
        console.log(`   📍 POST ${this.config.whisperPath}/${eidolon}/${ritual}`);
      }
    }

    console.log("=".repeat(50));
    console.log(`📊 总计: ${routes.length} 个路由\n`);
  }

  /**
   * 🔧 创建请求上下文解析器
   */
  createContextParser() {
    return {
      parseFromHttp: async (req: any): Promise<RequestContext> => {
        // 这个方法会被适配器使用来解析不同框架的请求
        const url = new URL(req.url, `http://${req.headers.host}`);
        const pathParts = url.pathname.split("/").filter(Boolean);

        // 期望路径格式: /api/whisper/{eidolon}/{ritual}
        const whisperPathParts = this.config.whisperPath!.split("/").filter(Boolean);
        const startIndex = whisperPathParts.length;

        if (pathParts.length < startIndex + 2) {
          throw new Error("无效的 Whisper 路径格式");
        }

        const eidolon = pathParts[startIndex];
        const ritual = pathParts[startIndex + 1];

        // 解析请求体
        let spell;
        try {
          const body = await req.json();
          spell = body.spell;
        } catch (error) {
          throw new Error("无法解析请求体");
        }

        return {
          eidolon,
          ritual,
          spell,
          headers: req.headers || {},
          ip: req.ip,
          userAgent: req.headers["user-agent"],
          timestamp: Date.now(),
        };
      },
    };
  }
}
