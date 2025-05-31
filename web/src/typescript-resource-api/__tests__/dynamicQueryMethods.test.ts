/**
 * TRA 动态查询方法测试 - Spring Data JPA风格
 * 测试类似 findByNameAndAge、findByEmailOrUsername 的动态方法名解析
 */

/// <reference lib="deno.ns" />

import { assert, assertEquals } from "std/assert/mod.ts";
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
}

// 扩展Resource以包含动态查询方法的类型定义
interface UserResource extends Resource<User> {
  // Spring Data JPA风格的动态查询方法
  findByUsername(username: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByAge(age: number): Promise<User[]>;
  findByUsernameAndEmail(username: string, email: string): Promise<User | null>;
  findByAgeAndStatus(age: number, status: string): Promise<User[]>;
  findByUsernameOrEmail(username: string, email: string): Promise<User[]>;
  findByAgeGreaterThan(age: number): Promise<User[]>;
  findByAgeLessThan(age: number): Promise<User[]>;
  findByStatusIn(statuses: string[]): Promise<User[]>;
  findByUsernameContaining(username: string): Promise<User[]>;
  findByCreatedAtBetween(start: string, end: string): Promise<User[]>;
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

Deno.test("findByUsername - 应该解析为单参数查询", async () => {
  setupMockFetch();
  userResource = createResourceProxy<UserResource>("User");

  const mockUser = {
    id: "1",
    username: "john",
    email: "john@test.com",
    age: 25,
    status: "active",
    createdAt: "2024-01-01",
  };
  mockFetch.mockResolvedValue(createMockResponse(mockUser));

  const result = await userResource.findByUsername("john");

  // 验证whisper API调用格式
  assert(mockFetch.mock.calls[0][0] === "/api/whisper/User/findByUsername");
  assert(mockFetch.mock.calls[0][1].method === "POST");
  assert(
    mockFetch.mock.calls[0][1].headers["Content-Type"] === "application/json",
  );
  assert(
    JSON.parse(mockFetch.mock.calls[0][1].body).args[0] === "john",
  );
  assertEquals(result?.username, "john");
});

Deno.test("findByAge - 应该解析为数字参数查询", async () => {
  setupMockFetch();
  userResource = createResourceProxy<UserResource>("User");

  const mockUsers = [
    {
      id: "1",
      username: "john",
      email: "john@test.com",
      age: 25,
      status: "active",
      createdAt: "2024-01-01",
    },
    {
      id: "2",
      username: "jane",
      email: "jane@test.com",
      age: 25,
      status: "active",
      createdAt: "2024-01-02",
    },
  ];
  mockFetch.mockResolvedValue(createMockResponse(mockUsers));

  const result = await userResource.findByAge(25);

  assert(mockFetch.mock.calls[0][0] === "/api/whisper/User/findByAge");
  assert(JSON.parse(mockFetch.mock.calls[0][1].body).args[0] === 25);
  assertEquals(result.length, 2);
});

Deno.test("findByUsernameAndEmail - 应该解析为双参数AND查询", async () => {
  setupMockFetch();
  userResource = createResourceProxy<UserResource>("User");

  const mockUser = {
    id: "1",
    username: "john",
    email: "john@test.com",
    age: 25,
    status: "active",
    createdAt: "2024-01-01",
  };
  mockFetch.mockResolvedValue(createMockResponse(mockUser));

  const result = await userResource.findByUsernameAndEmail(
    "john",
    "john@test.com",
  );

  assert(
    mockFetch.mock.calls[0][0] === "/api/whisper/User/findByUsernameAndEmail",
  );
  const args = JSON.parse(mockFetch.mock.calls[0][1].body).args;
  assertEquals(args[0], "john");
  assertEquals(args[1], "john@test.com");
  assertEquals(result?.username, "john");
});

Deno.test("findByAgeAndStatus - 应该解析为混合类型AND查询", async () => {
  setupMockFetch();
  userResource = createResourceProxy<UserResource>("User");

  const mockUsers = [
    {
      id: "1",
      username: "john",
      email: "john@test.com",
      age: 25,
      status: "active",
      createdAt: "2024-01-01",
    },
  ];
  mockFetch.mockResolvedValue(createMockResponse(mockUsers));

  const result = await userResource.findByAgeAndStatus(25, "active");

  assert(
    mockFetch.mock.calls[0][0] === "/api/whisper/User/findByAgeAndStatus",
  );
  const args = JSON.parse(mockFetch.mock.calls[0][1].body).args;
  assertEquals(args[0], 25);
  assertEquals(args[1], "active");
  assertEquals(result.length, 1);
});

Deno.test("findByUsernameOrEmail - 应该解析为OR查询", async () => {
  setupMockFetch();
  userResource = createResourceProxy<UserResource>("User");

  const mockUsers = [
    {
      id: "1",
      username: "john",
      email: "john@test.com",
      age: 25,
      status: "active",
      createdAt: "2024-01-01",
    },
    {
      id: "2",
      username: "jane",
      email: "john@test.com",
      age: 30,
      status: "active",
      createdAt: "2024-01-02",
    },
  ];
  mockFetch.mockResolvedValue(createMockResponse(mockUsers));

  const result = await userResource.findByUsernameOrEmail(
    "john",
    "john@test.com",
  );

  assert(
    mockFetch.mock.calls[0][0] === "/api/whisper/User/findByUsernameOrEmail",
  );
  const args = JSON.parse(mockFetch.mock.calls[0][1].body).args;
  assertEquals(args[0], "john");
  assertEquals(args[1], "john@test.com");
  assertEquals(result.length, 2);
});

Deno.test("findByAgeGreaterThan - 应该解析为大于比较", async () => {
  setupMockFetch();
  userResource = createResourceProxy<UserResource>("User");

  const mockUsers = [
    {
      id: "1",
      username: "senior",
      email: "senior@test.com",
      age: 35,
      status: "active",
      createdAt: "2024-01-01",
    },
  ];
  mockFetch.mockResolvedValue(createMockResponse(mockUsers));

  const result = await userResource.findByAgeGreaterThan(30);

  assert(
    mockFetch.mock.calls[0][0] === "/api/whisper/User/findByAgeGreaterThan",
  );
  assertEquals(JSON.parse(mockFetch.mock.calls[0][1].body).args[0], 30);
  assertEquals(result[0].age, 35);
});

Deno.test("findByAgeLessThan - 应该解析为小于比较", async () => {
  setupMockFetch();
  userResource = createResourceProxy<UserResource>("User");

  const mockUsers = [
    {
      id: "1",
      username: "young",
      email: "young@test.com",
      age: 20,
      status: "active",
      createdAt: "2024-01-01",
    },
  ];
  mockFetch.mockResolvedValue(createMockResponse(mockUsers));

  const result = await userResource.findByAgeLessThan(25);

  assert(
    mockFetch.mock.calls[0][0] === "/api/whisper/User/findByAgeLessThan",
  );
  assertEquals(JSON.parse(mockFetch.mock.calls[0][1].body).args[0], 25);
  assertEquals(result[0].age, 20);
});

Deno.test("findByStatusIn - 应该解析为IN查询", async () => {
  setupMockFetch();
  userResource = createResourceProxy<UserResource>("User");

  const mockUsers = [
    {
      id: "1",
      username: "user1",
      email: "user1@test.com",
      age: 25,
      status: "active",
      createdAt: "2024-01-01",
    },
    {
      id: "2",
      username: "user2",
      email: "user2@test.com",
      age: 30,
      status: "pending",
      createdAt: "2024-01-02",
    },
  ];
  mockFetch.mockResolvedValue(createMockResponse(mockUsers));

  const result = await userResource.findByStatusIn(["active", "pending"]);

  assert(mockFetch.mock.calls[0][0] === "/api/whisper/User/findByStatusIn");
  const args = JSON.parse(mockFetch.mock.calls[0][1].body).args;
  assertEquals(args[0], ["active", "pending"]);
  assertEquals(result.length, 2);
});

Deno.test("findByUsernameContaining - 应该解析为LIKE查询", async () => {
  setupMockFetch();
  userResource = createResourceProxy<UserResource>("User");

  const mockUsers = [
    {
      id: "1",
      username: "john_doe",
      email: "john@test.com",
      age: 25,
      status: "active",
      createdAt: "2024-01-01",
    },
    {
      id: "2",
      username: "john_smith",
      email: "smith@test.com",
      age: 30,
      status: "active",
      createdAt: "2024-01-02",
    },
  ];
  mockFetch.mockResolvedValue(createMockResponse(mockUsers));

  const result = await userResource.findByUsernameContaining("john");

  assert(
    mockFetch.mock.calls[0][0] === "/api/whisper/User/findByUsernameContaining",
  );
  assertEquals(JSON.parse(mockFetch.mock.calls[0][1].body).args[0], "john");
  assertEquals(result.length, 2);
});

Deno.test("findByCreatedAtBetween - 应该解析为BETWEEN查询", async () => {
  setupMockFetch();
  userResource = createResourceProxy<UserResource>("User");

  const mockUsers = [
    {
      id: "1",
      username: "user1",
      email: "user1@test.com",
      age: 25,
      status: "active",
      createdAt: "2024-01-15",
    },
  ];
  mockFetch.mockResolvedValue(createMockResponse(mockUsers));

  const result = await userResource.findByCreatedAtBetween(
    "2024-01-01",
    "2024-01-31",
  );

  assert(
    mockFetch.mock.calls[0][0] === "/api/whisper/User/findByCreatedAtBetween",
  );
  const args = JSON.parse(mockFetch.mock.calls[0][1].body).args;
  assertEquals(args[0], "2024-01-01");
  assertEquals(args[1], "2024-01-31");
  assertEquals(result.length, 1);
});

Deno.test("无效方法名应该返回undefined", async () => {
  setupMockFetch();
  userResource = createResourceProxy<UserResource>("User");

  // 访问不存在且不符合JPA模式的方法应该返回undefined
  // @ts-expect-error 故意调用不存在的方法
  const invalidMethod = userResource.invalidMethodName;
  assertEquals(invalidMethod, undefined);
}); 