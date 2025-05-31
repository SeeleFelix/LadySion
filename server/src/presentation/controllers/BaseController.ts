import { Context } from "oak/mod.ts";
import { DomainError } from "@/shared/errors/DomainErrors.ts";

/**
 * 基础控制器 - 提供通用的错误处理和请求处理逻辑
 */
export abstract class BaseController {
  /**
   * 统一的请求处理方法
   */
  protected async handleRequest(
    handler: () => Promise<any>,
    ctx: Context,
  ): Promise<void> {
    try {
      const result = await handler();
      this.sendSuccess(ctx, result);
    } catch (error) {
      this.handleError(error, ctx);
    }
  }

  /**
   * 错误处理方法
   */
  private handleError(error: unknown, ctx: Context): void {
    ctx.response.status = 500;
    ctx.response.body = { error: (error as Error).message };
  }

  /**
   * 验证必需参数
   */
  protected validateRequired(
    params: Record<string, any>,
    required: string[],
  ): void {
    for (const field of required) {
      if (
        params[field] === undefined || params[field] === null ||
        params[field] === ""
      ) {
        throw new Error(`缺少必需参数: ${field}`);
      }
    }
  }

  /**
   * 发送成功响应
   */
  protected sendSuccess<T>(
    ctx: Context,
    data: T,
    statusCode: number = 200,
  ): void {
    ctx.response.status = statusCode;
    ctx.response.body = data as any;
  }

  /**
   * 发送错误响应
   */
  protected sendError(
    ctx: Context,
    code: string,
    message: string,
    statusCode: number = 400,
  ): void {
    ctx.response.status = statusCode;
    ctx.response.body = {
      success: false,
      error: {
        code,
        message,
      },
    };
  }
}
