/**
 * JPA风格资源代理集成测试
 * 验证严格的字段验证、方法重载和错误处理
 */

/// <reference lib="deno.ns" />

import { assert, assertEquals, assertThrows } from "std/assert/mod.ts";
import type { Resource } from "../types.ts";
import { createResourceProxy } from "../createResourceMapper.ts";

// 测试用户实体
interface User {
  id?: string;
  username: string;
  email: string;
  age: number;
  status: string;
  createdAt: string;
  isActive: boolean;
}

// 用户实体的字段列表
const USER_FIELDS = ["id", "username", "email", "age", "status", "createdAt", "isActive"];

// 扩展Resource以包含JPA风格查询方法
interface UserResource extends Resource<User> {
  findByUsername(username: string): Promise<User | null>;
  findByAgeGreaterThan(age: number): Promise<User[]>;
  findByUsernameAndEmail(username: string, email: string): Promise<User | null>;
  findByStatusIn(statuses: string[]): Promise<User[]>;
  countByStatus(status: string): Promise<number>;
}

let userResource: UserResource;
let mockFetch: any;

function setupMockFetch() {
  mockFetch = {
    mock: {
      calls: [] as any[],
    },
    mockResolvedValue: function(value: any) {
      this.mockValue = value;
      return this;
    },
    mockValue: undefined as any,
  };
  
  globalThis.fetch = ((...args: any[]) => {
    mockFetch.mock.calls.push(args);
    return Promise.resolve(mockFetch.mockValue);
  }) as any;
}

function createMockResponse(data: any) {
  return {
    ok: true,
    json: async () => data,
  } as Response;
}

Deno.test("JPA资源代理 - 创建带字段验证的资源", () => {
  userResource = createResourceProxy<UserResource>("User", USER_FIELDS);
  assert(userResource);
  
  // 验证标准方法存在
  assert(typeof userResource.findAll === "function");
  assert(typeof userResource.create === "function");
});

Deno.test("JPA资源代理 - 有效的JPA查询方法调用", async () => {
  setupMockFetch();
  userResource = createResourceProxy<UserResource>("User", USER_FIELDS);

  const mockUser = {
    id: "1",
    username: "john",
    email: "john@test.com",
    age: 25,
    status: "active",
    createdAt: "2024-01-01",
    isActive: true
  };
  mockFetch.mockResolvedValue(createMockResponse(mockUser));

  const result = await userResource.findByUsername("john");

  // 验证whisper API调用
  assert(mockFetch.mock.calls[0][0] === "/api/whisper/User/findByUsername");
  assert(mockFetch.mock.calls[0][1].method === "POST");
  
  // 验证包含解析后的查询结构
  const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
  assert(requestBody.parsedQuery);
  assertEquals(requestBody.parsedQuery.prefix, "findBy");
  assertEquals(requestBody.parsedQuery.conditions[0].field, "username");
  assertEquals(requestBody.parsedQuery.conditions[0].operator, "eq");
  assertEquals(requestBody.args, ["john"]);
});

Deno.test("JPA资源代理 - 复杂查询方法", async () => {
  setupMockFetch();
  userResource = createResourceProxy<UserResource>("User", USER_FIELDS);

  const mockUsers = [
    { id: "1", username: "john", email: "john@test.com", age: 25, status: "active", createdAt: "2024-01-01", isActive: true }
  ];
  mockFetch.mockResolvedValue(createMockResponse(mockUsers));

  await userResource.findByUsernameAndEmail("john", "john@test.com");

  const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
  assertEquals(requestBody.parsedQuery.conditions.length, 2);
  assertEquals(requestBody.parsedQuery.conditions[0].field, "username");
  assertEquals(requestBody.parsedQuery.conditions[1].field, "email");
  assertEquals(requestBody.parsedQuery.logicalOperators[0], "And");
  assertEquals(requestBody.args, ["john", "john@test.com"]);
});

Deno.test("JPA资源代理 - 标准CRUD方法不需要解析", async () => {
  setupMockFetch();
  userResource = createResourceProxy<UserResource>("User", USER_FIELDS);

  const mockUsers = [
    { id: "1", username: "john", email: "john@test.com", age: 25, status: "active", createdAt: "2024-01-01", isActive: true }
  ];
  mockFetch.mockResolvedValue(createMockResponse(mockUsers));

  await userResource.findAll();

  // 标准方法不应该包含parsedQuery
  const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
  assert(!requestBody.parsedQuery);
  assertEquals(requestBody.args, []);
});

Deno.test("JPA资源代理 - 错误：不存在的字段", async () => {
  userResource = createResourceProxy<UserResource>("User", USER_FIELDS);

  // 直接使用try-catch验证
  try {
    await (userResource as any).findByInvalidField("value");
    throw new Error("Expected method to throw");
  } catch (error) {
    assert((error as Error).message.includes("字段 'invalidField' 不存在于实体中"));
  }
});

Deno.test("JPA资源代理 - 错误：不支持的方法前缀", async () => {
  userResource = createResourceProxy<UserResource>("User", USER_FIELDS);

  try {
    await (userResource as any).getByUsername("john");
    throw new Error("Expected method to throw");
  } catch (error) {
    assert((error as Error).message.includes("不支持的查询方法"));
  }
});

Deno.test("JPA资源代理 - 错误：参数个数不匹配", async () => {
  userResource = createResourceProxy<UserResource>("User", USER_FIELDS);

  try {
    await (userResource as any).findByUsername();
    throw new Error("Expected method to throw");
  } catch (error) {
    assert((error as Error).message.includes("参数个数不匹配"));
  }
});

Deno.test("JPA资源代理 - 错误：Between操作参数不足", async () => {
  userResource = createResourceProxy<UserResource>("User", USER_FIELDS);

  try {
    await (userResource as any).findByAgeBetween(20);
    throw new Error("Expected method to throw");
  } catch (error) {
    assert((error as Error).message.includes("参数个数不匹配: 期望 2 个，实际 1 个"));
  }
});

Deno.test("JPA资源代理 - 向后兼容：不提供字段列表", () => {
  // 不提供字段列表时应该有警告，但仍能创建
  const basicResource = createResourceProxy<Resource<User>>("User");
  assert(basicResource);
  assert(typeof basicResource.findAll === "function");
});

Deno.test("JPA资源代理 - has方法检查", () => {
  userResource = createResourceProxy<UserResource>("User", USER_FIELDS);

  // 标准方法always存在
  assert('findAll' in userResource);
  assert('create' in userResource);
  
  // 有效的JPA方法存在
  assert('findByUsername' in userResource);
  assert('findByAgeGreaterThan' in userResource);
  
  // 无效的方法不存在
  assert(!('findByInvalidField' in userResource));
  assert(!('customMethod' in userResource));
});

Deno.test("JPA资源代理 - 复杂操作符测试", async () => {
  setupMockFetch();
  userResource = createResourceProxy<UserResource>("User", USER_FIELDS);

  const mockUsers = [
    { id: "1", username: "john", email: "john@test.com", age: 30, status: "active", createdAt: "2024-01-01", isActive: true }
  ];
  mockFetch.mockResolvedValue(createMockResponse(mockUsers));

  // Between操作
  await (userResource as any).findByAgeBetween(20, 40);
  let requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
  assertEquals(requestBody.parsedQuery.conditions[0].operator, "between");
  assertEquals(requestBody.args, [20, 40]);

  // In操作  
  await userResource.findByStatusIn(["active", "pending"]);
  requestBody = JSON.parse(mockFetch.mock.calls[1][1].body);
  assertEquals(requestBody.parsedQuery.conditions[0].operator, "in");
  assertEquals(requestBody.args, [["active", "pending"]]);

  // 无参数操作
  await (userResource as any).findByIsActiveTrue();
  requestBody = JSON.parse(mockFetch.mock.calls[2][1].body);
  assertEquals(requestBody.parsedQuery.conditions[0].operator, "true");
  assertEquals(requestBody.parsedQuery.expectedParameterCount, 0);
});

Deno.test("JPA资源代理 - 不同查询前缀", async () => {
  setupMockFetch();
  userResource = createResourceProxy<UserResource>("User", USER_FIELDS);

  mockFetch.mockResolvedValue(createMockResponse(5));

  await userResource.countByStatus("active");

  assert(mockFetch.mock.calls[0][0] === "/api/whisper/User/countByStatus");
  const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
  assertEquals(requestBody.parsedQuery.prefix, "countBy");
  assertEquals(requestBody.parsedQuery.conditions[0].field, "status");
}); 