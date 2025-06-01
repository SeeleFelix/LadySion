/**
 * 🌳 Oak 框架集成测试
 * 验证 Whisper 后端与 Oak 框架的完整集成
 */

import { assertEquals, assert } from "jsr:@std/assert@1";
import { Router } from "oak/mod.ts";
import { OakAdapter } from "../adapters/OakAdapter.ts";
import { setupWhisperRoutes } from "../core/factory.ts";
import type { SeekerImplementation } from "../types/backend.ts";
import type { Seeker } from "../../types/core.ts";
import { OmenError } from "../../types/core.ts";

// 🔮 测试用的业务实体
interface TestEidolon {
  id: string;
  name: string;
  value: number;
}

// 🙏 测试用的 Seeker 接口
interface TestSeeker extends Seeker<TestEidolon> {
  echo(message: string): Promise<string>;
  add(a: number, b: number): Promise<number>;
  getItem(id: string): Promise<TestEidolon>;
  createItem(name: string, value: number): Promise<TestEidolon>;
  throwError(): Promise<never>;
}

// 🎯 简单的测试 Seeker 实现
class TestSeekerService implements TestSeeker, SeekerImplementation {
  private items = new Map<string, TestEidolon>([
    ["1", { id: "1", name: "测试项目", value: 100 }],
  ]);

  async echo(message: string): Promise<string> {
    return `回显: ${message}`;
  }

  async add(a: number, b: number): Promise<number> {
    return a + b;
  }

  async getItem(id: string): Promise<TestEidolon> {
    const item = this.items.get(id);
    if (!item) {
      throw new OmenError("项目不存在", {
        code: 404,
        status: "error",
        message: `项目 ${id} 不存在`,
        signal: "item_not_found"
      });
    }
    return item;
  }

  async createItem(name: string, value: number): Promise<TestEidolon> {
    const id = Date.now().toString();
    const item: TestEidolon = { id, name, value };
    this.items.set(id, item);
    return item;
  }

  async throwError(): Promise<never> {
    throw new OmenError("测试错误", {
      code: 400,
      status: "error",
      message: "这是一个测试错误",
      signal: "test_error"
    });
  }
}

// 📋 Mock 上下文创建器
function createMockOakContext(
  eidolon: string,
  ritual: string,
  args: any[] = [],
  headers: Record<string, string> = {}
): any {
  const mockBody = {
    spell: { args }
  };

  return {
    params: { eidolon, ritual },
    request: {
      hasBody: true,
      body: {
        json: async () => mockBody
      },
      headers: new Map(Object.entries({
        "content-type": "application/json",
        "user-agent": "test-agent",
        ...headers
      })),
      ip: "127.0.0.1"
    },
    response: {
      status: 200,
      headers: new Map() as any,
      body: null as any
    }
  };
}

Deno.test("🌳 OakAdapter - 创建路由处理器", async () => {
  const adapter = new OakAdapter();
  
  // 创建一个简单的处理器
  const mockHandler = async (context: any) => ({
    eidolon: { message: "测试成功" },
    omen: { code: 200, status: "success" as const, message: "OK", signal: "success" },
    timestamp: Date.now()
  });

  const oakHandler = adapter.createRouteHandler(mockHandler);
  
  // 模拟 Oak 上下文
  const ctx = createMockOakContext("Test", "echo", ["hello"]);
  
  // 调用处理器
  await oakHandler(ctx);
  
  // 验证响应
  assertEquals(ctx.response.status, 200);
  assert(ctx.response.headers.has("Content-Type"));
  assertEquals(ctx.response.headers.get("Content-Type"), "application/json");
  
  // 验证响应体
  const responseBody = JSON.parse(ctx.response.body);
  assertEquals(responseBody.omen.code, 200);
  assertEquals(responseBody.eidolon.message, "测试成功");
});

Deno.test("🔮 setupWhisperRoutes - 完整集成测试", () => {
  const router = new Router();
  const testSeeker = new TestSeekerService();
  
  // 设置 Whisper 路由
  setupWhisperRoutes(router, {
    "Test": testSeeker
  }, {
    whisperPath: "/api/whisper"
  });
  
  // 验证路由是否正确注册
  // 注意：这里我们主要验证设置过程没有抛出异常
  // 实际的路由验证需要 Oak 服务器运行
  
  console.log("✅ Whisper 路由设置成功");
});

Deno.test("🎯 OakAdapter - 错误处理", async () => {
  const adapter = new OakAdapter();
  
  // 创建一个会抛出异常的处理器
  const errorHandler = async () => {
    throw new Error("测试异常");
  };

  const oakHandler = adapter.createRouteHandler(errorHandler);
  
  // 模拟 Oak 上下文
  const ctx = createMockOakContext("Test", "error", []);
  
  // 调用处理器（应该不会抛出异常，而是返回错误响应）
  await oakHandler(ctx);
  
  // 验证错误响应
  assertEquals(ctx.response.status, 500);
  
  const responseBody = JSON.parse(ctx.response.body);
  assertEquals(responseBody.omen.code, 500);
  assertEquals(responseBody.omen.status, "error");
  assertEquals(responseBody.omen.signal, "adapter_error");
  assertEquals(responseBody.eidolon, null);
});

Deno.test("📋 OakAdapter - 请求解析", async () => {
  const adapter = new OakAdapter();
  
  // 创建一个记录请求上下文的处理器
  let capturedContext: any = null;
  const captureHandler = async (context: any) => {
    capturedContext = context;
    return {
      eidolon: { received: true },
      omen: { code: 200, status: "success" as const, message: "OK", signal: "success" },
      timestamp: Date.now()
    };
  };

  const oakHandler = adapter.createRouteHandler(captureHandler);
  
  // 模拟复杂的请求上下文
  const ctx = createMockOakContext("User", "create", ["张三", "test@example.com", 25], {
    "authorization": "Bearer test-token",
    "x-custom-header": "custom-value"
  });
  
  // 调用处理器
  await oakHandler(ctx);
  
  // 验证解析的请求上下文
  assert(capturedContext, "应该捕获到请求上下文");
  assertEquals(capturedContext.eidolon, "User");
  assertEquals(capturedContext.ritual, "create");
  assertEquals(capturedContext.spell.args, ["张三", "test@example.com", 25]);
  
  // 验证请求头解析
  assertEquals(capturedContext.headers["authorization"], "Bearer test-token");
  assertEquals(capturedContext.headers["x-custom-header"], "custom-value");
  assertEquals(capturedContext.headers["content-type"], "application/json");
  
  // 验证其他字段
  assertEquals(capturedContext.ip, "127.0.0.1");
  assertEquals(capturedContext.userAgent, "test-agent");
  assert(capturedContext.timestamp > 0);
});

Deno.test("🚨 OakAdapter - 请求解析错误", async () => {
  const adapter = new OakAdapter();
  
  const mockHandler = async () => ({
    eidolon: null,
    omen: { code: 200, status: "success" as const, message: "OK", signal: "success" },
    timestamp: Date.now()
  });

  const oakHandler = adapter.createRouteHandler(mockHandler);
  
  // 测试缺少请求体的情况
  const ctxNoBody = {
    params: { eidolon: "User", ritual: "test" },
    request: {
      hasBody: false,
      headers: new Map(),
      ip: "127.0.0.1"
    },
    response: {
      status: 200,
      headers: new Map() as any,
      body: null as any
    }
  };
  
  await oakHandler(ctxNoBody as any);
  
  // 验证错误响应
  assertEquals(ctxNoBody.response.status, 500);
  
  const responseBody = JSON.parse(ctxNoBody.response.body);
  assertEquals(responseBody.omen.code, 500);
  assert(responseBody.omen.message.includes("请求体为空"));
});

Deno.test("🎭 HTTP 状态码映射", async () => {
  const adapter = new OakAdapter();
  
  // 测试不同的 Omen 状态码映射
  const testCases = [
    { omenCode: 200, expectedHttpStatus: 200 },
    { omenCode: 404, expectedHttpStatus: 404 },
    { omenCode: 500, expectedHttpStatus: 500 },
    { omenCode: 1001, expectedHttpStatus: 200 }, // 业务状态码映射到 200
    { omenCode: 999, expectedHttpStatus: 500 },  // 未知状态码映射到 500
  ];

  for (const testCase of testCases) {
    const mockHandler = async () => ({
      eidolon: { test: true },
      omen: { 
        code: testCase.omenCode, 
        status: "success" as const, 
        message: "test",
        signal: "test" 
      },
      timestamp: Date.now()
    });

    const oakHandler = adapter.createRouteHandler(mockHandler);
    const ctx = createMockOakContext("Test", "status", []);
    
    await oakHandler(ctx);
    
    assertEquals(
      ctx.response.status, 
      testCase.expectedHttpStatus,
      `Omen 码 ${testCase.omenCode} 应该映射到 HTTP ${testCase.expectedHttpStatus}`
    );
  }
});

console.log("🌳 Oak 集成测试完成！"); 