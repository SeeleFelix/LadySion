/**
 * 🎯 Whisper Framework 业务需求测试
 * 从用户角度描述框架应该提供什么功能
 */

/// <reference lib="deno.ns" />

import { assertEquals, assert } from "std/assert/mod.ts";
import { createSeeker } from "../index.ts";
import type { Eidolon, Seeker } from "../index.ts";

// 🔮 业务场景：用户管理系统
interface User extends Eidolon {
  id?: string;
  name: string;
  email: string;
  age: number;
}

interface UserSeeker extends Seeker<User> {
  // 根据ID查找用户
  findById(id: string): Promise<User>;
  
  // 创建新用户
  create(name: string, email: string, age: number): Promise<User>;
  
  // 更新用户信息
  update(id: string, data: Partial<User>): Promise<User>;
  
  // 获取所有用户
  findAll(): Promise<User[]>;
  
  // 删除用户
  delete(id: string): Promise<void>;
  
  // 搜索用户
  search(keyword: string, filters?: { minAge?: number; maxAge?: number }): Promise<User[]>;
}

// 🎭 Mock 后端响应
let mockResponses: any[] = [];
let fetchCalls: any[] = [];

function mockBackend() {
  fetchCalls = [];
  globalThis.fetch = (async (url: string, options: any) => {
    fetchCalls.push({ url, options });
    
    const response = mockResponses.shift() || {
      eidolon: null,
      omen: { code: 200, status: "success", message: "OK" },
      timestamp: Date.now()
    };
    
    return {
      ok: true,
      json: async () => response
    };
  }) as any;
}

Deno.test("📋 需求1：框架应该让前端调用API像调用普通函数一样简单", async () => {
  mockBackend();
  
  // Given: 我有一个UserSeeker
  const userSeeker = createSeeker<UserSeeker>("User");
  
  // When: 我像调用普通函数一样调用API
  mockResponses.push({
    eidolon: { id: "123", name: "玲珑", email: "test@example.com", age: 25 },
    omen: { code: 200, status: "success", message: "找到用户" },
    timestamp: Date.now()
  });
  
  const user = await userSeeker.findById("123");
  
  // Then: 我应该得到用户数据，就像普通函数返回值一样
  assertEquals(user.name, "玲珑");
  assertEquals(user.email, "test@example.com");
  assertEquals(user.age, 25);
});

Deno.test("🎯 需求2：框架应该支持多参数函数调用", async () => {
  mockBackend();
  
  const userSeeker = createSeeker<UserSeeker>("User");
  
  // When: 我调用多参数方法
  mockResponses.push({
    eidolon: { id: "456", name: "茜", email: "akane@example.com", age: 28 },
    omen: { code: 201, status: "success", message: "用户创建成功" },
    timestamp: Date.now()
  });
  
  const newUser = await userSeeker.create("茜", "akane@example.com", 28);
  
  // Then: 参数应该正确传递到后端
  assertEquals(newUser.name, "茜");
  assertEquals(fetchCalls.length, 1);
  
  const requestBody = JSON.parse(fetchCalls[0].options.body);
  assertEquals(requestBody.spell.args, ["茜", "akane@example.com", 28]);
});

Deno.test("🔧 需求3：框架应该支持对象参数", async () => {
  mockBackend();
  
  const userSeeker = createSeeker<UserSeeker>("User");
  
  // When: 我传递对象参数
  mockResponses.push({
    eidolon: { id: "789", name: "更新后的名字", email: "new@example.com", age: 30 },
    omen: { code: 200, status: "success", message: "更新成功" },
    timestamp: Date.now()
  });
  
  const updatedUser = await userSeeker.update("789", { 
    name: "更新后的名字", 
    email: "new@example.com" 
  });
  
  // Then: 对象参数应该正确传递
  assertEquals(updatedUser.name, "更新后的名字");
  
  const requestBody = JSON.parse(fetchCalls[0].options.body);
  assertEquals(requestBody.spell.args[0], "789");
  assertEquals(requestBody.spell.args[1].name, "更新后的名字");
  assertEquals(requestBody.spell.args[1].email, "new@example.com");
});

Deno.test("📋 需求4：框架应该支持无参数方法", async () => {
  mockBackend();
  
  const userSeeker = createSeeker<UserSeeker>("User");
  
  // When: 我调用无参数方法
  mockResponses.push({
    eidolon: [
      { id: "1", name: "用户1", email: "user1@example.com", age: 20 },
      { id: "2", name: "用户2", email: "user2@example.com", age: 25 }
    ],
    omen: { code: 200, status: "success", message: "获取成功" },
    timestamp: Date.now()
  });
  
  const users = await userSeeker.findAll();
  
  // Then: 应该返回所有用户
  assertEquals(users.length, 2);
  assertEquals(users[0].name, "用户1");
  
  const requestBody = JSON.parse(fetchCalls[0].options.body);
  assertEquals(requestBody.spell.args, []);
});

Deno.test("🗑️ 需求5：框架应该支持返回void的方法", async () => {
  mockBackend();
  
  const userSeeker = createSeeker<UserSeeker>("User");
  
  // When: 我调用删除方法
  mockResponses.push({
    eidolon: null,
    omen: { code: 200, status: "success", message: "删除成功" },
    timestamp: Date.now()
  });
  
  const result = await userSeeker.delete("123");
  
  // Then: 应该返回null（表示void）
  assertEquals(result, null);
});

Deno.test("🌐 需求6：框架应该遵循Whisper协议", async () => {
  mockBackend();
  
  const userSeeker = createSeeker<UserSeeker>("User");
  
  // When: 我调用任何方法
  mockResponses.push({
    eidolon: { id: "test", name: "test", email: "test@example.com", age: 20 },
    omen: { code: 200, status: "success", message: "OK" },
    timestamp: Date.now()
  });
  
  await userSeeker.findById("test");
  
  // Then: 请求应该符合Whisper协议
  assertEquals(fetchCalls.length, 1);
  
  const call = fetchCalls[0];
  
  // URL应该是 /whisper/{eidolon}/{ritual} 格式
  assert(call.url.endsWith("/whisper/User/findById"));
  
  // 方法应该是POST
  assertEquals(call.options.method, "POST");
  
  // Content-Type应该是JSON
  assert(call.options.headers["Content-Type"].includes("application/json"));
  
  // 请求体应该包含spell
  const body = JSON.parse(call.options.body);
  assert(body.spell);
  assert(Array.isArray(body.spell.args));
});

Deno.test("⚡ 需求7：框架应该自动处理错误", async () => {
  mockBackend();
  
  const userSeeker = createSeeker<UserSeeker>("User");
  
  // When: 后端返回错误
  mockResponses.push({
    eidolon: null,
    omen: { code: 404, status: "error", message: "用户不存在" },
    timestamp: Date.now()
  });
  
  // Then: 应该抛出异常
  try {
    await userSeeker.findById("nonexistent");
    assert(false, "应该抛出异常");
  } catch (error: any) {
    assertEquals(error.name, "WhisperError");
    assertEquals(error.message, "用户不存在");
    assertEquals(error.omen.code, 404);
  }
});

Deno.test("🔧 需求8：框架应该支持自定义配置", async () => {
  mockBackend();
  
  // When: 我创建带自定义配置的seeker
  const userSeeker = createSeeker<UserSeeker>("User", {
    baseUrl: "https://my-api.com",
    timeout: 60000,
    headers: {
      "Authorization": "Bearer my-token",
      "X-App": "my-app"
    }
  });
  
  mockResponses.push({
    eidolon: { id: "test", name: "test", email: "test@example.com", age: 20 },
    omen: { code: 200, status: "success", message: "OK" },
    timestamp: Date.now()
  });
  
  await userSeeker.findById("test");
  
  // Then: 应该使用我的配置
  const call = fetchCalls[0];
  assert(call.url.startsWith("https://my-api.com"));
  assertEquals(call.options.headers["Authorization"], "Bearer my-token");
  assertEquals(call.options.headers["X-App"], "my-app");
});

Deno.test("🎯 需求9：框架应该提供TypeScript类型安全", () => {
  // Given: 我创建了一个UserSeeker
  const userSeeker = createSeeker<UserSeeker>("User");
  
  // Then: TypeScript应该知道有哪些方法可以调用
  assert(typeof userSeeker.findById === "function");
  assert(typeof userSeeker.create === "function");
  assert(typeof userSeeker.update === "function");
  assert(typeof userSeeker.findAll === "function");
  assert(typeof userSeeker.delete === "function");
  assert(typeof userSeeker.search === "function");
  
  // TypeScript编译器会在编译时检查：
  // ✅ userSeeker.findById("123")  // 正确
  // ❌ userSeeker.wrongMethod()   // 编译错误
  // ❌ userSeeker.findById()      // 编译错误，缺少参数
});

Deno.test("🌟 需求10：框架应该让前端代码超级干净", async () => {
  mockBackend();
  
  // Given: 我在scripture包中已经创建好了seeker
  const userSeeker = createSeeker<UserSeeker>("User");
  
  // When: 我在业务代码中使用
  mockResponses.push(
    // findById响应
    {
      eidolon: { id: "1", name: "玲珑", email: "lingling@example.com", age: 25 },
      omen: { code: 200, status: "success", message: "OK" },
      timestamp: Date.now()
    },
    // create响应
    {
      eidolon: { id: "2", name: "茜", email: "akane@example.com", age: 28 },
      omen: { code: 201, status: "success", message: "创建成功" },
      timestamp: Date.now()
    },
    // update响应
    {
      eidolon: { id: "2", name: "茜酱", email: "akane@example.com", age: 28 },
      omen: { code: 200, status: "success", message: "更新成功" },
      timestamp: Date.now()
    }
  );
  
  // 业务逻辑代码应该超级干净：
  const user = await userSeeker.findById("1");
  const newUser = await userSeeker.create("茜", "akane@example.com", 28);
  const updatedUser = await userSeeker.update(newUser.id!, { name: "茜酱" });
  
  // Then: 代码读起来就像调用普通函数
  assertEquals(user.name, "玲珑");
  assertEquals(newUser.name, "茜");
  assertEquals(updatedUser.name, "茜酱");
  
  // 所有复杂的网络请求、错误处理、配置管理都被框架隐藏了
  assertEquals(fetchCalls.length, 3);
}); 