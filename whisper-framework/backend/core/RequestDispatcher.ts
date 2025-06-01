/**
 * 🎯 请求分发器
 * 解析 Whisper 请求并分发到对应的 Seeker 方法
 */

import type { RequestContext, RouteHandler } from "../types/backend.ts";
import type { Grace, Spell } from "../../types/core.ts";
import { SeekerRegistry } from "./SeekerRegistry.ts";
import { ResponseFormatter } from "./ResponseFormatter.ts";

/**
 * 🌟 Whisper 请求分发器
 */
export class RequestDispatcher {
  private registry: SeekerRegistry;
  private formatter: ResponseFormatter;

  constructor() {
    this.registry = SeekerRegistry.getInstance();
    this.formatter = new ResponseFormatter();
  }

  /**
   * 🔮 创建 Whisper 路由处理器
   */
  createHandler(): RouteHandler {
    return async (context: RequestContext): Promise<Grace<any>> => {
      try {
        // 🎯 验证请求格式
        this.validateRequest(context);

        // 🔍 检查 Seeker 和方法是否存在
        if (!this.registry.hasMethod(context.eidolon, context.ritual)) {
          return this.formatter.formatNotFoundError(
            context.eidolon,
            context.ritual
          );
        }

        // 📋 解析参数
        const args = this.parseArguments(context.spell);

        // 🚀 调用实际方法
        const result = await this.registry.invoke(
          context.eidolon,
          context.ritual,
          args
        );

        // ✨ 格式化成功响应
        return this.formatter.formatSuccess(result);

      } catch (error) {
        // 🚨 统一错误处理
        return this.formatter.formatError(error);
      }
    };
  }

  /**
   * 🔍 验证请求格式
   */
  private validateRequest(context: RequestContext): void {
    if (!context.eidolon) {
      throw new Error("缺少 eidolon 参数");
    }

    if (!context.ritual) {
      throw new Error("缺少 ritual 参数");
    }

    if (!context.spell) {
      throw new Error("缺少 spell 参数");
    }

    // 验证 spell 格式
    if (!context.spell.args || !Array.isArray(context.spell.args)) {
      throw new Error("spell.args 必须是数组");
    }
  }

  /**
   * 📋 解析 Spell 参数
   */
  private parseArguments(spell: Spell): any[] {
    if (!spell.args) {
      return [];
    }

    // Spell 中的 args 已经是解析好的参数数组
    return spell.args;
  }

  /**
   * 📊 获取分发器统计信息
   */
  getStats() {
    return {
      registryStats: this.registry.getStats(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 🔧 生成路由信息（用于调试和文档）
   */
  generateRouteInfo(): Array<{
    path: string;
    eidolon: string;
    ritual: string;
    fullPath: string;
  }> {
    const routes: Array<{
      path: string;
      eidolon: string;
      ritual: string;
      fullPath: string;
    }> = [];

    const seekers = this.registry.getAllSeekers();
    
    for (const seeker of seekers) {
      for (const method of seeker.methods) {
        routes.push({
          path: `/whisper/${seeker.name}/${method}`,
          eidolon: seeker.name,
          ritual: method,
          fullPath: `POST /whisper/${seeker.name}/${method}`,
        });
      }
    }

    return routes.sort((a, b) => a.path.localeCompare(b.path));
  }

  /**
   * 🎭 生成 OpenAPI 风格的路由文档
   */
  generateApiDocs(): {
    openapi: string;
    info: any;
    paths: Record<string, any>;
  } {
    const routes = this.generateRouteInfo();
    const paths: Record<string, any> = {};

    for (const route of routes) {
      paths[route.path] = {
        post: {
          summary: `调用 ${route.eidolon} 的 ${route.ritual} 方法`,
          description: `Whisper 协议调用: ${route.fullPath}`,
          tags: [route.eidolon],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    spell: {
                      type: 'object',
                      properties: {
                        args: {
                          type: 'array',
                          description: '方法参数列表',
                          items: {}
                        }
                      },
                      required: ['args']
                    }
                  },
                  required: ['spell']
                }
              }
            }
          },
          responses: {
            200: {
              description: '成功响应',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      eidolon: {
                        description: '返回的业务数据'
                      },
                      omen: {
                        type: 'object',
                        properties: {
                          code: { type: 'number' },
                          status: { type: 'string' },
                          message: { type: 'string' }
                        }
                      },
                      timestamp: { type: 'number' }
                    }
                  }
                }
              }
            }
          }
        }
      };
    }

    return {
      openapi: '3.0.0',
      info: {
        title: 'Whisper API',
        version: '1.0.0',
        description: 'Auto-generated API documentation for Whisper services'
      },
      paths
    };
  }
} 