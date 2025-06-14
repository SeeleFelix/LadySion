/**
 * 🧪 Whisper 后端框架核心测试
 * 验证后端框架的请求处理、异常处理和路由生成
 */

import { assert, assertEquals, assertRejects } from "jsr:@std/assert@1";
import { SeekerRegistry } from "../core/SeekerRegistry.ts";
import { RequestDispatcher } from "../core/RequestDispatcher.ts";
import { ResponseFormatter } from "../core/ResponseFormatter.ts";
import { setupWhisperRoutes } from "../core/factory.ts";
import type { RequestContext, SeekerImplementation } from "../types/backend.ts";
import type { Grace, Seeker } from "../../types/core.ts";
import { OmenError, WrathError } from "../../types/core.ts";

// 🔮 测试用的业务实体
interface UserEidolon {
  id?: string;
  name: string;
  email: string;
  age: number;
}

// 🙏 测试用的 Seeker 接口
interface UserSeeker extends Seeker<UserEidolon> {
  findById(id: string): Promise<UserEidolon>;
  create(name: string, email: string, age: number): Promise<UserEidolon>;
  update(id: string, data: Partial<UserEidolon>): Promise<UserEidolon>;
  delete(id: string): Promise<void>;
  getStats(): Promise<{ total: number }>;
  throwOmenError(): Promise<never>;
  throwWrathError(): Promise<never>;
  throwPlainError(): Promise<never>;
}

// 🎯 测试用的 Seeker 实现
class TestUserSeekerService implements UserSeeker, SeekerImplementation {
  private users = new Map<string, UserEidolon>([
    ["1", { id: "1", name: "玲珑", email: "lingling@test.com", age: 25 }],
    ["2", { id: "2", name: "茜", email: "akane@test.com", age: 23 }],
  ]);

  async findById(id: string): Promise<UserEidolon> {
    const user = this.users.get(id);
    if (!user) {
      throw new OmenError("用户不存在", {
        code: 404,
        status: "error",
        message: `用户 ${id} 不存在`,
        signal: "user_not_found",
      });
    }
    return user;
  }

  async create(name: string, email: string, age: number): Promise<UserEidolon> {
    if (age < 0 || age > 150) {
      throw new OmenError("年龄无效", {
        code: 400,
        status: "error",
        message: "年龄必须在 0-150 之间",
        signal: "invalid_age",
      });
    }

    const id = Date.now().toString();
    const user: UserEidolon = { id, name, email, age };
    this.users.set(id, user);
    return user;
  }

  async update(id: string, data: Partial<UserEidolon>): Promise<UserEidolon> {
    const user = await this.findById(id); // 复用查找逻辑
    const updated = { ...user, ...data };
    this.users.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    if (!this.users.has(id)) {
      throw new OmenError("用户不存在", {
        code: 404,
        status: "error",
        message: `用户 ${id} 不存在`,
        signal: "user_not_found",
      });
    }
    this.users.delete(id);
  }

  async getStats(): Promise<{ total: number }> {
    return { total: this.users.size };
  }

  async throwOmenError(): Promise<never> {
    throw new OmenError("业务异常测试", {
      code: 400,
      status: "error",
      message: "这是一个业务层异常",
      signal: "business_error",
    });
  }

  async throwWrathError(): Promise<never> {
    throw new WrathError("系统异常测试", {
      code: 500,
      status: "error",
      message: "这是一个系统层异常",
      signal: "system_error",
    });
  }

  async throwPlainError(): Promise<never> {
    throw new Error("这是一个普通异常");
  }
}

// 📋 辅助函数：创建测试用的请求上下文
function createTestContext(
  eidolon: string,
  ritual: string,
  args: any[] = [],
): RequestContext {
  return {
    eidolon,
    ritual,
    spell: { args },
    headers: { "content-type": "application/json" },
    timestamp: Date.now(),
  };
}

Deno.test("🔍 SeekerRegistry - 注册和发现 Seeker", () => {
  const registry = SeekerRegistry.getInstance();
  registry.clear(); // 清空注册器

  const userSeeker = new TestUserSeekerService();

  // ✅ 注册 Seeker
  registry.register("User", userSeeker);

  // ✅ 验证注册成功
  const registration = registry.getSeeker("User");
  assert(registration, "应该成功获取到注册的 Seeker");
  assertEquals(registration!.name, "User");
  assertEquals(registration!.instance, userSeeker);

  // ✅ 验证方法自动发现
  assert(registration!.methods.has("findById"));
  assert(registration!.methods.has("create"));
  assert(registration!.methods.has("update"));
  assert(registration!.methods.has("delete"));
  assert(registration!.methods.has("getStats"));
  assert(registration!.methods.has("throwOmenError"));
  assert(registration!.methods.has("throwWrathError"));
  assert(registration!.methods.has("throwPlainError"));

  // ✅ 验证方法检查
  assert(registry.hasMethod("User", "findById"));
  assert(!registry.hasMethod("User", "nonExistent"));
  assert(!registry.hasMethod("NonExistent", "findById"));
});

Deno.test("🚀 SeekerRegistry - 方法调用", async () => {
  const registry = SeekerRegistry.getInstance();
  registry.clear();

  const userSeeker = new TestUserSeekerService();
  registry.register("User", userSeeker);

  // ✅ 成功调用方法
  const user = await registry.invoke("User", "findById", ["1"]);
  assertEquals(user.name, "玲珑");
  assertEquals(user.email, "lingling@test.com");

  // ✅ 创建新用户
  const newUser = await registry.invoke("User", "create", ["张三", "zhangsan@test.com", 30]);
  assertEquals(newUser.name, "张三");
  assertEquals(newUser.email, "zhangsan@test.com");
  assertEquals(newUser.age, 30);

  // ❌ 调用不存在的 Seeker
  await assertRejects(
    () => registry.invoke("NonExistent", "findById", ["1"]),
    Error,
    "未找到 Seeker: NonExistent",
  );

  // ❌ 调用不存在的方法
  await assertRejects(
    () => registry.invoke("User", "nonExistent", []),
    Error,
    "User 中未找到方法: nonExistent",
  );
});

Deno.test("✨ ResponseFormatter - 响应格式化", () => {
  const formatter = new ResponseFormatter();

  // ✅ 成功响应格式化
  const successData = { id: "1", name: "test" };
  const successResponse = formatter.formatSuccess(successData);

  assertEquals(successResponse.eidolon, successData);
  assertEquals(successResponse.omen.code, 200);
  assertEquals(successResponse.omen.status, "success");
  assert(successResponse.timestamp > 0);

  // 🚨 业务错误格式化
  const omenError = new OmenError("测试错误", {
    code: 404,
    status: "error",
    message: "测试业务错误",
    signal: "test_error",
  });

  const omenResponse = formatter.formatError(omenError);
  assertEquals(omenResponse.eidolon, null);
  assertEquals(omenResponse.omen.code, 404);
  assertEquals(omenResponse.omen.message, "测试业务错误");
  assertEquals(omenResponse.omen.signal, "test_error");

  // ⚡ 系统错误格式化
  const wrathError = new WrathError("系统错误", {
    code: 500,
    status: "error",
    message: "测试系统错误",
    signal: "system_error",
  });

  const wrathResponse = formatter.formatError(wrathError);
  assertEquals(wrathResponse.eidolon, null);
  assertEquals(wrathResponse.omen.code, 500);
  assertEquals(wrathResponse.omen.message, "测试系统错误");

  // ❓ 未知错误格式化
  const plainError = new Error("普通错误");
  const plainResponse = formatter.formatError(plainError);
  assertEquals(plainResponse.eidolon, null);
  assertEquals(plainResponse.omen.code, 500);
  assert(plainResponse.omen.message.includes("普通错误"));
});

Deno.test("🎯 RequestDispatcher - 请求分发和处理", async () => {
  const registry = SeekerRegistry.getInstance();
  registry.clear();

  const userSeeker = new TestUserSeekerService();
  registry.register("User", userSeeker);

  const dispatcher = new RequestDispatcher();
  const handler = dispatcher.createHandler();

  // ✅ 成功处理请求
  const context = createTestContext("User", "findById", ["1"]);
  const response = await handler(context);

  assertEquals(response.omen.code, 200);
  assertEquals(response.eidolon.name, "玲珑");
  assertEquals(response.eidolon.email, "lingling@test.com");

  // ✅ 处理创建请求
  const createContext = createTestContext("User", "create", ["新用户", "new@test.com", 28]);
  const createResponse = await handler(createContext);

  assertEquals(createResponse.omen.code, 200);
  assertEquals(createResponse.eidolon.name, "新用户");
  assertEquals(createResponse.eidolon.age, 28);

  // ✅ 处理无参数请求
  const statsContext = createTestContext("User", "getStats", []);
  const statsResponse = await handler(statsContext);

  assertEquals(statsResponse.omen.code, 200);
  assert(statsResponse.eidolon.total >= 2); // 至少有初始的2个用户
});

Deno.test("🚨 RequestDispatcher - 异常处理", async () => {
  const registry = SeekerRegistry.getInstance();
  registry.clear();

  const userSeeker = new TestUserSeekerService();
  registry.register("User", userSeeker);

  const dispatcher = new RequestDispatcher();
  const handler = dispatcher.createHandler();

  // 🔍 处理业务异常 (OmenError)
  const omenContext = createTestContext("User", "findById", ["999"]);
  const omenResponse = await handler(omenContext);

  assertEquals(omenResponse.omen.code, 404);
  assertEquals(omenResponse.omen.status, "error");
  assertEquals(omenResponse.omen.signal, "user_not_found");
  assertEquals(omenResponse.eidolon, null);

  // ⚡ 处理系统异常 (WrathError)
  const wrathContext = createTestContext("User", "throwWrathError", []);
  const wrathResponse = await handler(wrathContext);

  assertEquals(wrathResponse.omen.code, 500);
  assertEquals(wrathResponse.omen.status, "error");
  assertEquals(wrathResponse.omen.signal, "system_error");
  assertEquals(wrathResponse.eidolon, null);

  // ❓ 处理普通异常
  const plainContext = createTestContext("User", "throwPlainError", []);
  const plainResponse = await handler(plainContext);

  assertEquals(plainResponse.omen.code, 500);
  assertEquals(plainResponse.omen.status, "error");
  assert(plainResponse.omen.message.includes("这是一个普通异常"));
  assertEquals(plainResponse.eidolon, null);

  // 🔍 处理方法不存在
  const notFoundContext = createTestContext("User", "nonExistent", []);
  const notFoundResponse = await handler(notFoundContext);

  assertEquals(notFoundResponse.omen.code, 404);
  assertEquals(notFoundResponse.omen.status, "error");
  assertEquals(notFoundResponse.omen.signal, "method_not_found");

  // 🔍 处理 Seeker 不存在
  const seekerNotFoundContext = createTestContext("NonExistent", "someMethod", []);
  const seekerNotFoundResponse = await handler(seekerNotFoundContext);

  assertEquals(seekerNotFoundResponse.omen.code, 404);
  assertEquals(seekerNotFoundResponse.omen.status, "error");
  assertEquals(seekerNotFoundResponse.omen.signal, "method_not_found");
});

Deno.test("📋 RequestDispatcher - 请求验证", async () => {
  const dispatcher = new RequestDispatcher();
  const handler = dispatcher.createHandler();

  // ❌ 缺少 eidolon
  const noEidolonContext = {
    eidolon: "",
    ritual: "findById",
    spell: { args: ["1"] },
    headers: {},
    timestamp: Date.now(),
  };

  const noEidolonResponse = await handler(noEidolonContext);
  assertEquals(noEidolonResponse.omen.code, 500);
  assert(noEidolonResponse.omen.message.includes("缺少 eidolon 参数"));

  // ❌ 缺少 ritual
  const noRitualContext = {
    eidolon: "User",
    ritual: "",
    spell: { args: ["1"] },
    headers: {},
    timestamp: Date.now(),
  };

  const noRitualResponse = await handler(noRitualContext);
  assertEquals(noRitualResponse.omen.code, 500);
  assert(noRitualResponse.omen.message.includes("缺少 ritual 参数"));

  // ❌ 缺少 spell
  const noSpellContext = {
    eidolon: "User",
    ritual: "findById",
    spell: undefined as any,
    headers: {},
    timestamp: Date.now(),
  };

  const noSpellResponse = await handler(noSpellContext);
  assertEquals(noSpellResponse.omen.code, 500);
  assert(noSpellResponse.omen.message.includes("缺少 spell 参数"));

  // ❌ spell.args 不是数组
  const invalidArgsContext = {
    eidolon: "User",
    ritual: "findById",
    spell: { args: "not-an-array" as any },
    headers: {},
    timestamp: Date.now(),
  };

  const invalidArgsResponse = await handler(invalidArgsContext);
  assertEquals(invalidArgsResponse.omen.code, 500);
  assert(invalidArgsResponse.omen.message.includes("spell.args 必须是数组"));
});

Deno.test("🎭 RequestDispatcher - 路由信息生成", () => {
  const registry = SeekerRegistry.getInstance();
  registry.clear();

  const userSeeker = new TestUserSeekerService();
  registry.register("User", userSeeker);

  const dispatcher = new RequestDispatcher();
  const routes = dispatcher.generateRouteInfo();

  // ✅ 验证路由生成
  assert(routes.length > 0);

  const findByIdRoute = routes.find((r) => r.eidolon === "User" && r.ritual === "findById");
  assert(findByIdRoute);
  assertEquals(findByIdRoute.path, "/whisper/User/findById");
  assertEquals(findByIdRoute.fullPath, "POST /whisper/User/findById");

  // ✅ 验证所有方法都有对应路由
  const expectedMethods = [
    "findById",
    "create",
    "update",
    "delete",
    "getStats",
    "throwOmenError",
    "throwWrathError",
    "throwPlainError",
  ];
  for (const method of expectedMethods) {
    const route = routes.find((r) => r.eidolon === "User" && r.ritual === method);
    assert(route, `应该有 ${method} 路由`);
  }
});

Deno.test("📊 RequestDispatcher - API 文档生成", () => {
  const registry = SeekerRegistry.getInstance();
  registry.clear();

  const userSeeker = new TestUserSeekerService();
  registry.register("User", userSeeker);

  const dispatcher = new RequestDispatcher();
  const apiDocs = dispatcher.generateApiDocs();

  // ✅ 验证 OpenAPI 格式
  assertEquals(apiDocs.openapi, "3.0.0");
  assert(apiDocs.info);
  assert(apiDocs.paths);

  // ✅ 验证具体路径
  const userFindByIdPath = apiDocs.paths["/whisper/User/findById"];
  assert(userFindByIdPath);
  assert(userFindByIdPath.post);
  assertEquals(userFindByIdPath.post.tags, ["User"]);

  // ✅ 验证请求体结构
  const requestBody = userFindByIdPath.post.requestBody;
  assert(requestBody);
  assert(requestBody.content["application/json"]);
  assert(requestBody.content["application/json"].schema.properties.spell);
});

Deno.test("🎯 综合测试 - 完整的 Whisper 流程", async () => {
  const registry = SeekerRegistry.getInstance();
  registry.clear();

  // 🔮 注册多个 Seeker
  const userSeeker = new TestUserSeekerService();
  registry.register("User", userSeeker);

  const dispatcher = new RequestDispatcher();
  const handler = dispatcher.createHandler();

  // ✅ 测试完整的 CRUD 流程

  // 1. 创建用户
  const createContext = createTestContext("User", "create", ["测试用户", "test@crud.com", 30]);
  const createResponse = await handler(createContext);
  assertEquals(createResponse.omen.code, 200);
  const userId = createResponse.eidolon.id;

  // 2. 查找用户
  const findContext = createTestContext("User", "findById", [userId]);
  const findResponse = await handler(findContext);
  assertEquals(findResponse.omen.code, 200);
  assertEquals(findResponse.eidolon.name, "测试用户");

  // 3. 更新用户
  const updateContext = createTestContext("User", "update", [userId, { name: "更新用户" }]);
  const updateResponse = await handler(updateContext);
  assertEquals(updateResponse.omen.code, 200);
  assertEquals(updateResponse.eidolon.name, "更新用户");

  // 4. 获取统计
  const statsContext = createTestContext("User", "getStats", []);
  const statsResponse = await handler(statsContext);
  assertEquals(statsResponse.omen.code, 200);
  assert(statsResponse.eidolon.total >= 3); // 初始2个 + 新创建1个

  // 5. 删除用户
  const deleteContext = createTestContext("User", "delete", [userId]);
  const deleteResponse = await handler(deleteContext);
  assertEquals(deleteResponse.omen.code, 200);
  assertEquals(deleteResponse.eidolon, undefined); // delete 方法返回 void

  // 6. 验证删除成功
  const findDeletedContext = createTestContext("User", "findById", [userId]);
  const findDeletedResponse = await handler(findDeletedContext);
  assertEquals(findDeletedResponse.omen.code, 404);
  assertEquals(findDeletedResponse.omen.signal, "user_not_found");
});

Deno.test("🔧 参数验证测试", async () => {
  const registry = SeekerRegistry.getInstance();
  registry.clear();

  const userSeeker = new TestUserSeekerService();
  registry.register("User", userSeeker);

  const dispatcher = new RequestDispatcher();
  const handler = dispatcher.createHandler();

  // ✅ 测试业务层验证 - 年龄无效
  const invalidAgeContext = createTestContext("User", "create", ["张三", "test@invalid.com", -1]);
  const invalidAgeResponse = await handler(invalidAgeContext);

  assertEquals(invalidAgeResponse.omen.code, 400);
  assertEquals(invalidAgeResponse.omen.status, "error");
  assertEquals(invalidAgeResponse.omen.signal, "invalid_age");
  assert(invalidAgeResponse.omen.message.includes("年龄必须在 0-150 之间"));

  // ✅ 测试边界值 - 有效年龄
  const validAgeContext = createTestContext("User", "create", ["李四", "test@valid.com", 150]);
  const validAgeResponse = await handler(validAgeContext);

  assertEquals(validAgeResponse.omen.code, 200);
  assertEquals(validAgeResponse.eidolon.age, 150);
});

console.log("🎉 后端 Whisper 框架测试完成！");
