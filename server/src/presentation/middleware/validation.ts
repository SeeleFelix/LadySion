import { Context } from "oak/mod.ts";

/**
 * 验证中间件
 * 基础的请求验证
 */
export async function validationMiddleware(
  context: any,
  next: () => Promise<unknown>,
) {
  // 验证请求体大小
  const body = context.request.hasBody ? await context.request.body.json() : undefined;
  if (body && JSON.stringify(body).length > 1024 * 1024) { // 1MB限制
    context.response.status = 413;
    context.response.body = {
      success: false,
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "请求体过大",
      },
    };
    return;
  }
  await next();
}
