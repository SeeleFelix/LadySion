/**
 * 🌊 Fresh 框架适配器
 * 将 Whisper 服务器与 Fresh 框架集成（示例实现）
 */

import type {
  HttpAdapter,
  RequestContext,
  RouteHandler,
  WhisperServerConfig,
} from "../types/backend.ts";

/**
 * 🎯 Fresh 适配器实现
 * 注意：这是一个示例实现，展示如何适配不同框架
 */
export class FreshAdapter implements HttpAdapter {
  name = "fresh";

  /**
   * 🌐 挂载到 Fresh 应用
   */
  async mount(app: any, config: WhisperServerConfig): Promise<void> {
    console.log(`🌊 Fresh 适配器: 准备挂载 Whisper 路由`);

    // Fresh 的路由注册方式会有所不同
    // 这里只是示例结构
  }

  /**
   * 🔧 创建 Fresh 处理器
   */
  createRouteHandler(handler: RouteHandler): any {
    // Fresh 的处理器格式
    return async (req: Request, ctx: any) => {
      try {
        // 🔍 解析请求上下文
        const context = await this.parseContext(req, ctx);

        // 🚀 调用 Whisper 处理器
        const grace = await handler(context);

        // ✨ 返回 Fresh 响应
        return new Response(JSON.stringify(grace), {
          status: this.getHttpStatusFromOmen(grace.omen.code),
          headers: {
            "Content-Type": "application/json",
          },
        });
      } catch (error) {
        // 🚨 处理适配器级别的错误
        console.error("Fresh 适配器错误:", error);

        return new Response(
          JSON.stringify({
            eidolon: null,
            omen: {
              code: 500,
              status: "error",
              message: `适配器错误: ${error instanceof Error ? error.message : String(error)}`,
              signal: "adapter_error",
            },
            timestamp: Date.now(),
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    };
  }

  /**
   * 📋 解析 Fresh 请求上下文
   */
  private async parseContext(req: Request, ctx: any): Promise<RequestContext> {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);

    // 从路径中解析 eidolon 和 ritual
    // 假设路径格式: /api/whisper/{eidolon}/{ritual}
    const eidolon = pathParts[pathParts.length - 2];
    const ritual = pathParts[pathParts.length - 1];

    if (!eidolon || !ritual) {
      throw new Error("缺少 eidolon 或 ritual 参数");
    }

    // 解析请求体
    let spell;
    try {
      const body = await req.json();
      spell = body.spell;

      if (!spell) {
        throw new Error("请求体中缺少 spell 参数");
      }
    } catch (error) {
      throw new Error(`解析请求体失败: ${error instanceof Error ? error.message : String(error)}`);
    }

    // 构建请求上下文
    return {
      eidolon,
      ritual,
      spell,
      headers: this.extractHeaders(req),
      ip: this.getClientIP(req, ctx),
      userAgent: req.headers.get("user-agent") || undefined,
      timestamp: Date.now(),
    };
  }

  /**
   * 🔧 提取请求头
   */
  private extractHeaders(req: Request): Record<string, string> {
    const headers: Record<string, string> = {};

    for (const [name, value] of req.headers.entries()) {
      headers[name.toLowerCase()] = value;
    }

    return headers;
  }

  /**
   * 🌍 获取客户端 IP
   */
  private getClientIP(req: Request, ctx: any): string | undefined {
    // Fresh 中获取客户端 IP 的方式
    const possibleHeaders = [
      "x-forwarded-for",
      "x-real-ip",
      "x-client-ip",
    ];

    for (const header of possibleHeaders) {
      const value = req.headers.get(header);
      if (value) {
        return value.split(",")[0].trim();
      }
    }

    // Fresh 特定的IP获取方式
    return ctx?.remoteAddr?.hostname;
  }

  /**
   * 🎯 将 Omen 代码转换为 HTTP 状态码
   */
  private getHttpStatusFromOmen(omenCode: number): number {
    // 与 Oak 适配器相同的逻辑
    if (omenCode >= 100 && omenCode < 600) {
      return omenCode;
    }

    if (omenCode >= 1000) {
      return 200;
    }

    return 500;
  }
}

/**
 * 📋 Fresh 路由工厂函数示例
 */
export function createFreshWhisperRoute(handler: RouteHandler) {
  const adapter = new FreshAdapter();
  return adapter.createRouteHandler(handler);
}

/**
 * 🎯 Fresh 应用集成示例
 */
export function integrateFreshWhisper(app: any, seekers: Record<string, any>) {
  console.log("🌊 正在集成 Fresh Whisper 支持...");

  // 这里会根据 Fresh 的实际 API 进行集成
  // 每个框架的集成方式都不同，这就是适配器模式的价值

  console.log(`📊 已集成 ${Object.keys(seekers).length} 个 Seeker`);
}
