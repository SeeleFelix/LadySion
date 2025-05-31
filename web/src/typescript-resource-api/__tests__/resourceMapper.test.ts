/**
 * 参考Spring Data JPA的 JpaRepository<T, ID> 模式
 * CRUD操作：create、update、patch、delete
 */

/// <reference lib="deno.ns" />

import { Resource } from "../types.ts";
import { createResourceProxy } from "../createResourceMapper.ts";
import { assert, assertEquals, assertRejects } from "std/assert/mod.ts";

// 定义测试资源实体
interface Apple {
  id?: string;
  name: string;
  color: string;
  price: number;
}

interface User {
  id?: string;
  username: string;
  email: string;
  age: number;
}

// 定义扩展Resource的接口 - Spring Data JPA风格
interface AppleResource extends Resource<Apple> {}
interface UserResource extends Resource<User> {}

function setupMockFetch() {
  const mockFetch = {
    mock: {
      calls: [] as any[],
    },
    mockResolvedValue: function(value: any) {
      this.mockValue = value;
      return this;
    },
    mockRejectedValue: function(error: any) {
      this.mockError = error;
      return this;
    },
    mockValue: undefined as any,
    mockError: undefined as any,
  };
  
  globalThis.fetch = ((...args: any[]) => {
    mockFetch.mock.calls.push(args);
    if (mockFetch.mockError) {
      return Promise.reject(mockFetch.mockError);
    }
    return Promise.resolve(mockFetch.mockValue);
  }) as any;
  
  return mockFetch;
}

function createMockSuccessResponse(data: any) {
  return {
    ok: true,
    status: 200,
    json: async () => data,
  };
}

function createMockErrorResponse(status: number) {
  return {
    ok: false,
    status: status,
    json: async () => ({ error: "HTTP Error" }),
  };
}

Deno.test("Resource接口继承 - 应该为继承Resource的接口创建动态代理", () => {
  const appleResource = createResourceProxy<AppleResource>("Apple");

  assert(appleResource !== undefined);
  assert(typeof appleResource.findAll === "function");
  assert(typeof appleResource.findById === "function");
  assert(typeof appleResource.create === "function");
  assert(typeof appleResource.update === "function");
  assert(typeof appleResource.patch === "function");
  assert(typeof appleResource.deleteById === "function");
});

Deno.test("Resource接口继承 - 应该支持多个不同的资源类型", () => {
  const appleResource = createResourceProxy<AppleResource>("Apple");
  const userResource = createResourceProxy<UserResource>("User");

  assert(appleResource !== undefined);
  assert(userResource !== undefined);
  // 验证它们都有相同的方法
  assert(typeof appleResource.findAll === "function");
  assert(typeof userResource.findAll === "function");
});

Deno.test("查询操作 - findAll() 应该映射为 POST /api/whisper/Apple/findAll", async () => {
  const appleResource = createResourceProxy<AppleResource>("Apple");
  const mockFetch = setupMockFetch();
  mockFetch.mockResolvedValue(createMockSuccessResponse([]));
  
  await appleResource.findAll();
  
  assertEquals(mockFetch.mock.calls[0][0], "/api/whisper/Apple/findAll");
  assertEquals(mockFetch.mock.calls[0][1].method, "POST");
  assertEquals(mockFetch.mock.calls[0][1].headers["Content-Type"], "application/json");
  assertEquals(mockFetch.mock.calls[0][1].body, JSON.stringify({ args: [] }));
});

Deno.test("查询操作 - findById(id) 应该映射为 POST /api/whisper/Apple/findById", async () => {
  const appleResource = createResourceProxy<AppleResource>("Apple");
  const mockFetch = setupMockFetch();
  mockFetch.mockResolvedValue(createMockSuccessResponse({}));
  
  await appleResource.findById("123");
  
  assertEquals(mockFetch.mock.calls[0][0], "/api/whisper/Apple/findById");
  assertEquals(mockFetch.mock.calls[0][1].method, "POST");
  assertEquals(mockFetch.mock.calls[0][1].headers["Content-Type"], "application/json");
  assertEquals(mockFetch.mock.calls[0][1].body, JSON.stringify({ args: ["123"] }));
});

Deno.test("创建操作 - create() 应该映射为 POST /api/whisper/Apple/create", async () => {
  const appleResource = createResourceProxy<AppleResource>("Apple");
  const newApple = { name: "New Apple", color: "yellow", price: 1.2 };
  const mockFetch = setupMockFetch();
  mockFetch.mockResolvedValue(createMockSuccessResponse({}));
  
  await appleResource.create(newApple);
  
  assertEquals(mockFetch.mock.calls[0][0], "/api/whisper/Apple/create");
  assertEquals(mockFetch.mock.calls[0][1].method, "POST");
  assertEquals(mockFetch.mock.calls[0][1].headers["Content-Type"], "application/json");
  assertEquals(mockFetch.mock.calls[0][1].body, JSON.stringify({ args: [newApple] }));
});

Deno.test("更新操作 - update() 应该映射为 POST /api/whisper/Apple/update", async () => {
  const appleResource = createResourceProxy<AppleResource>("Apple");
  const updatedApple = { name: "Updated Apple", color: "green", price: 1.5 };
  const mockFetch = setupMockFetch();
  mockFetch.mockResolvedValue(createMockSuccessResponse({}));
  
  await appleResource.update("123", updatedApple);
  
  assertEquals(mockFetch.mock.calls[0][0], "/api/whisper/Apple/update");
  assertEquals(mockFetch.mock.calls[0][1].method, "POST");
  assertEquals(mockFetch.mock.calls[0][1].headers["Content-Type"], "application/json");
  assertEquals(mockFetch.mock.calls[0][1].body, JSON.stringify({ args: ["123", updatedApple] }));
});

Deno.test("更新操作 - patch() 应该映射为 POST /api/whisper/Apple/patch", async () => {
  const appleResource = createResourceProxy<AppleResource>("Apple");
  const patchData = { price: 2.0 };
  const mockFetch = setupMockFetch();
  mockFetch.mockResolvedValue(createMockSuccessResponse({}));
  
  await appleResource.patch("123", patchData);
  
  assertEquals(mockFetch.mock.calls[0][0], "/api/whisper/Apple/patch");
  assertEquals(mockFetch.mock.calls[0][1].method, "POST");
  assertEquals(mockFetch.mock.calls[0][1].headers["Content-Type"], "application/json");
  assertEquals(mockFetch.mock.calls[0][1].body, JSON.stringify({ args: ["123", patchData] }));
});

Deno.test("删除操作 - deleteById(id) 应该映射为 POST /api/whisper/Apple/deleteById", async () => {
  const appleResource = createResourceProxy<AppleResource>("Apple");
  const mockFetch = setupMockFetch();
  mockFetch.mockResolvedValue(createMockSuccessResponse(null));
  
  await appleResource.deleteById("123");
  
  assertEquals(mockFetch.mock.calls[0][0], "/api/whisper/Apple/deleteById");
  assertEquals(mockFetch.mock.calls[0][1].method, "POST");
  assertEquals(mockFetch.mock.calls[0][1].headers["Content-Type"], "application/json");
  assertEquals(mockFetch.mock.calls[0][1].body, JSON.stringify({ args: ["123"] }));
});

Deno.test("多资源类型 - UserResource应该映射到正确的URL路径", async () => {
  const userResource = createResourceProxy<UserResource>("User");
  const newUser = { username: "john", email: "john@test.com", age: 25 };
  const mockFetch = setupMockFetch();
  mockFetch.mockResolvedValue(createMockSuccessResponse({ id: "1", ...newUser }));
  
  await userResource.create(newUser);
  
  assertEquals(mockFetch.mock.calls[0][0], "/api/whisper/User/create");
  assertEquals(mockFetch.mock.calls[0][1].method, "POST");
  assertEquals(mockFetch.mock.calls[0][1].headers["Content-Type"], "application/json");
  assertEquals(mockFetch.mock.calls[0][1].body, JSON.stringify({ args: [newUser] }));
});

Deno.test("错误处理 - 应该处理网络错误", async () => {
  const appleResource = createResourceProxy<AppleResource>("Apple");
  const mockFetch = setupMockFetch();
  mockFetch.mockRejectedValue(new Error("Network Error"));

  await assertRejects(
    () => appleResource.findAll(),
    Error,
    "Network Error"
  );
});

Deno.test("错误处理 - 应该处理HTTP错误状态", async () => {
  const appleResource = createResourceProxy<AppleResource>("Apple");
  const mockFetch = setupMockFetch();
  const mockResponse = createMockErrorResponse(404);
  mockFetch.mockResolvedValue(mockResponse);

  await assertRejects(
    () => appleResource.findById("nonexistent"),
    Error
  );
});

Deno.test("配置 - 应该支持自定义配置", async () => {
  const appleResource = createResourceProxy<AppleResource>("Apple", {
    baseUrl: "https://custom.api.com",
    headers: { "Authorization": "Bearer token123" },
  });
  const mockApples = [{ id: "1", name: "Apple", color: "red", price: 1.0 }];
  const mockFetch = setupMockFetch();
  mockFetch.mockResolvedValue(createMockSuccessResponse(mockApples));
  
  await appleResource.findAll();
  
  assertEquals(mockFetch.mock.calls[0][0], "/api/whisper/Apple/findAll");
  assertEquals(mockFetch.mock.calls[0][1].method, "POST");
  assertEquals(mockFetch.mock.calls[0][1].headers["Authorization"], "Bearer token123");
  assertEquals(mockFetch.mock.calls[0][1].headers["Content-Type"], "application/json");
  assertEquals(mockFetch.mock.calls[0][1].body, JSON.stringify({ args: [] }));
});
