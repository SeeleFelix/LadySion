import { Context } from "oak/mod.ts";
import { DomainError } from "@/shared/errors/DomainErrors.ts";

/**
 * 错误处理中间件
 */
export async function errorHandlingMiddleware(
  context: any,
  next: () => Promise<unknown>,
) {
  try {
    await next();
  } catch (error) {
    console.error("Unhandled error:", error);
    if (error instanceof DomainError) {
      context.response.status = error.statusCode;
      context.response.body = {
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      };
    } else {
      context.response.status = 500;
      context.response.body = {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: Deno.env.get("NODE_ENV") === "production"
            ? "内部服务器错误"
            : error instanceof Error ? error.message : "未知错误",
        },
      };
    }
  }
}
