/**
 * 🌳 Oak 框架适配器
 * 将 Whisper 服务器与 Oak 框架集成
 */

import type { Context, Router } from "oak/mod.ts";
import type {
  HttpAdapter,
  RequestContext,
  RouteHandler,
  WhisperServerConfig,
} from "../types/backend.ts";

/**
 * 🎯 Oak 适配器实现
 */
export class OakAdapter implements HttpAdapter {
  name = "oak";
  private router?: Router;

  /**
   * 🌐 挂载到 Oak 服务器
   */
  async mount(router: Router, config: WhisperServerConfig): Promise<void> {
    this.router = router;

    // 注册通用的 Whisper 路由模式
    const whisperPath = config.whisperPath || "/api/whisper";
    const routePattern = `${whisperPath}/:eidolon/:ritual`;

    console.log(`🌳 Oak 适配器: 注册路由模式 ${routePattern}`);
  }

  /**
   * 🔧 创建 Oak 路由处理器
   */
  createRouteHandler(handler: RouteHandler): (ctx: Context) => Promise<void> {
    return async (ctx: Context) => {
      try {
        // 🔍 解析请求上下文
        const context = await this.parseContext(ctx);

        // 🚀 调用 Whisper 处理器
        const grace = await handler(context);

        // ✨ 设置响应
        ctx.response.status = this.getHttpStatusFromOmen(grace.omen.code);
        ctx.response.headers.set("Content-Type", "application/json");
        ctx.response.body = JSON.stringify(grace);
      } catch (error) {
        // 🚨 处理适配器级别的错误
        console.error("Oak 适配器错误:", error);

        ctx.response.status = 500;
        ctx.response.headers.set("Content-Type", "application/json");
        ctx.response.body = JSON.stringify({
          eidolon: null,
          omen: {
            code: 500,
            status: "error",
            message: `适配器错误: ${error instanceof Error ? error.message : String(error)}`,
            signal: "adapter_error",
          },
          timestamp: Date.now(),
        });
      }
    };
  }

  /**
   * 📋 解析 Oak 请求上下文
   */
  private async parseContext(ctx: Context): Promise<RequestContext> {
    // 🔍 从路径参数获取 eidolon 和 ritual
    const eidolon = (ctx as any).params?.eidolon;
    const ritual = (ctx as any).params?.ritual;

    if (!eidolon || !ritual) {
      throw new Error("缺少 eidolon 或 ritual 参数");
    }

    // 📋 解析请求体
    let spell;
    try {
      if (!ctx.request.hasBody) {
        throw new Error("请求体为空");
      }

      const body = await ctx.request.body.json();
      spell = body.spell;

      if (!spell) {
        throw new Error("请求体中缺少 spell 参数");
      }
    } catch (error) {
      throw new Error(`解析请求体失败: ${error instanceof Error ? error.message : String(error)}`);
    }

    // 🌐 构建请求上下文
    return {
      eidolon,
      ritual,
      spell,
      headers: this.extractHeaders(ctx),
      ip: this.getClientIP(ctx),
      userAgent: ctx.request.headers.get("user-agent") || undefined,
      timestamp: Date.now(),
    };
  }

  /**
   * 🔧 提取请求头
   */
  private extractHeaders(ctx: Context): Record<string, string> {
    const headers: Record<string, string> = {};

    // 使用 forEach 替代 entries()，这在 Deno 环境中更兼容
    ctx.request.headers.forEach((value, name) => {
      headers[name.toLowerCase()] = value;
    });

    return headers;
  }

  /**
   * 🌍 获取客户端 IP
   */
  private getClientIP(ctx: Context): string | undefined {
    // 尝试从各种可能的头部获取真实 IP
    const possibleHeaders = [
      "x-forwarded-for",
      "x-real-ip",
      "x-client-ip",
      "cf-connecting-ip", // Cloudflare
      "true-client-ip", // Cloudflare Enterprise
    ];

    for (const header of possibleHeaders) {
      const value = ctx.request.headers.get(header);
      if (value) {
        // X-Forwarded-For 可能包含多个 IP，取第一个
        return value.split(",")[0].trim();
      }
    }

    // fallback 到连接 IP
    try {
      return ctx.request.ip;
    } catch {
      return undefined;
    }
  }

  /**
   * 🎯 将 Omen 代码转换为 HTTP 状态码
   */
  private getHttpStatusFromOmen(omenCode: number): number {
    // 🌟 Omen 代码直接对应 HTTP 状态码
    // 这是 Whisper 协议的设计：简化映射关系

    // 标准 HTTP 状态码直接使用
    if (omenCode >= 100 && omenCode < 600) {
      return omenCode;
    }

    // 业务状态码映射到 200（HTTP 层面成功，业务层面由 Omen 表示）
    if (omenCode >= 1000) {
      return 200;
    }

    // 默认 500
    return 500;
  }

  /**
   * 📊 注册 Whisper 路由到 Oak Router
   */
  registerWhisperRoute(routePattern: string, handler: (ctx: Context) => Promise<void>): void {
    if (!this.router) {
      throw new Error("Router 未初始化，请先调用 mount()");
    }

    // 注册 POST 路由
    this.router.post(routePattern, handler);
    console.log(`🌳 已注册 Oak 路由: POST ${routePattern}`);
  }

  /**
   * 🔧 创建中间件
   */
  createMiddleware() {
    return {
      // 🚨 错误处理中间件
      errorHandler: () => {
        return async (ctx: Context, next: () => Promise<unknown>) => {
          try {
            await next();
          } catch (error) {
            console.error("Whisper 中间件错误:", error);

            ctx.response.status = 500;
            ctx.response.headers.set("Content-Type", "application/json");
            ctx.response.body = JSON.stringify({
              eidolon: null,
              omen: {
                code: 500,
                status: "error",
                message: "服务器内部错误",
                signal: "middleware_error",
              },
              timestamp: Date.now(),
            });
          }
        };
      },

      // 📊 请求日志中间件
      logger: (config: { enabled?: boolean; level?: string } = {}) => {
        return async (ctx: Context, next: () => Promise<unknown>) => {
          if (!config.enabled) {
            await next();
            return;
          }

          const start = Date.now();
          const method = ctx.request.method;
          const url = ctx.request.url.pathname;

          await next();

          const duration = Date.now() - start;
          const status = ctx.response.status;

          console.log(`🌳 ${method} ${url} - ${status} (${duration}ms)`);
        };
      },

      // 🔐 认证中间件
      auth: (verifyToken: (token: string) => Promise<boolean>) => {
        return async (ctx: Context, next: () => Promise<unknown>) => {
          const authHeader = ctx.request.headers.get("authorization");

          if (!authHeader) {
            ctx.response.status = 401;
            ctx.response.headers.set("Content-Type", "application/json");
            ctx.response.body = JSON.stringify({
              eidolon: null,
              omen: {
                code: 401,
                status: "error",
                message: "缺少认证信息",
                signal: "auth_required",
              },
              timestamp: Date.now(),
            });
            return;
          }

          const token = authHeader.replace(/^Bearer\s+/, "");
          const isValid = await verifyToken(token);

          if (!isValid) {
            ctx.response.status = 401;
            ctx.response.headers.set("Content-Type", "application/json");
            ctx.response.body = JSON.stringify({
              eidolon: null,
              omen: {
                code: 401,
                status: "error",
                message: "认证失败",
                signal: "auth_failed",
              },
              timestamp: Date.now(),
            });
            return;
          }

          await next();
        };
      },
    };
  }
}
