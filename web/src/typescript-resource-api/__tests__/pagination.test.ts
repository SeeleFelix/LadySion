/**
 * TRA 分页和排序功能测试 - Spring Data JPA风格
 * 验证Pageable和Page的完整功能
 */

/// <reference lib="deno.ns" />

import { assert, assertEquals } from "std/assert/mod.ts";
import type { Page, Pageable, Resource, Sort } from "../types.ts";

// 用户业务对象
type User = {
  id: string;
  name: string;
  email: string;
  age: number;
  createdAt: string;
};

function setupMockFetch() {
  const mockFetch = {
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
  
  return mockFetch;
}

Deno.test("分页-第一页查询", async () => {
  const { createResourceProxy } = await import("../index.ts");
  const UserResource: Resource<User> = createResourceProxy("User");
  const mockPageResponse: Page<User> = {
    content: [
      {
        id: "1",
        name: "Alice",
        email: "alice@test.com",
        age: 25,
        createdAt: "2024-01-01",
      },
      {
        id: "2",
        name: "Bob",
        email: "bob@test.com",
        age: 30,
        createdAt: "2024-01-02",
      },
    ],
    totalElements: 100,
    totalPages: 10,
    size: 10,
    number: 0,
    numberOfElements: 2,
    first: true,
    last: false,
    empty: false,
  };
  const mockFetch = setupMockFetch();
  const pageable: Pageable = { page: 0, size: 10 };
  mockFetch.mockResolvedValue({ ok: true, json: async () => mockPageResponse });
  const result = await UserResource.findAllPaged(pageable);
  
  assert(mockFetch.mock.calls[0][0] === "/api/whisper/User/findAllPaged");
  assert(mockFetch.mock.calls[0][1].method === "POST");
  assert(
    mockFetch.mock.calls[0][1].headers["Content-Type"] === "application/json",
  );
  assert(
    mockFetch.mock.calls[0][1].body === JSON.stringify({ args: [pageable] }),
  );
  assert(result.content.length === 2);
  assert(result.first === true);
  assert(result.last === false);
});

Deno.test("分页-第二页查询", async () => {
  const { createResourceProxy } = await import("../index.ts");
  const UserResource: Resource<User> = createResourceProxy("User");
  const mockPageResponse: Page<User> = {
    content: [
      {
        id: "11",
        name: "Charlie",
        email: "charlie@test.com",
        age: 28,
        createdAt: "2024-01-11",
      },
    ],
    totalElements: 100,
    totalPages: 10,
    size: 10,
    number: 1,
    numberOfElements: 1,
    first: false,
    last: false,
    empty: false,
  };
  const mockFetch = setupMockFetch();
  const pageable: Pageable = { page: 1, size: 10 };
  mockFetch.mockResolvedValue({ ok: true, json: async () => mockPageResponse });
  const result = await UserResource.findAllPaged(pageable);
  assert(mockFetch.mock.calls[0][0] === "/api/whisper/User/findAllPaged");
  assert(mockFetch.mock.calls[0][1].method === "POST");
  assert(
    mockFetch.mock.calls[0][1].headers["Content-Type"] === "application/json",
  );
  assert(
    mockFetch.mock.calls[0][1].body === JSON.stringify({ args: [pageable] }),
  );
  assert(result.number === 1);
  assert(result.first === false);
});

Deno.test("排序-单字段升序", async () => {
  const { createResourceProxy } = await import("../index.ts");
  const UserResource: Resource<User> = createResourceProxy("User");
  const mockPageResponse: Page<User> = {
    content: [
      {
        id: "2",
        name: "Alice",
        email: "alice@test.com",
        age: 25,
        createdAt: "2024-01-02",
      },
      {
        id: "1",
        name: "Bob",
        email: "bob@test.com",
        age: 30,
        createdAt: "2024-01-01",
      },
    ],
    totalElements: 2,
    totalPages: 1,
    size: 10,
    number: 0,
    numberOfElements: 2,
    first: true,
    last: true,
    empty: false,
  };
  const mockFetch = setupMockFetch();
  const sort: Sort = { fields: [{ field: "name", direction: "ASC" }] };
  const pageable: Pageable = { page: 0, size: 10, sort };
  mockFetch.mockResolvedValue({ ok: true, json: async () => mockPageResponse });
  const result = await UserResource.findAllPaged(pageable);
  assert(mockFetch.mock.calls[0][0] === "/api/whisper/User/findAllPaged");
  assert(mockFetch.mock.calls[0][1].method === "POST");
  assert(
    mockFetch.mock.calls[0][1].headers["Content-Type"] === "application/json",
  );
  assert(
    mockFetch.mock.calls[0][1].body === JSON.stringify({ args: [pageable] }),
  );
  assert(result.content[0].name === "Alice");
  assert(result.content[1].name === "Bob");
});

Deno.test("排序-多字段", async () => {
  const { createResourceProxy } = await import("../index.ts");
  const UserResource: Resource<User> = createResourceProxy("User");
  const mockFetch = setupMockFetch();
  const sort: Sort = {
    fields: [
      { field: "age", direction: "DESC" },
      { field: "name", direction: "ASC" },
    ],
  };
  const pageable: Pageable = { page: 0, size: 10, sort };
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: 10,
      number: 0,
      numberOfElements: 0,
      first: true,
      last: true,
      empty: true,
    }),
  });
  const result = await UserResource.findAllPaged(pageable);
  assert(mockFetch.mock.calls[0][0] === "/api/whisper/User/findAllPaged");
  assert(mockFetch.mock.calls[0][1].method === "POST");
  assert(
    mockFetch.mock.calls[0][1].headers["Content-Type"] === "application/json",
  );
  assert(
    mockFetch.mock.calls[0][1].body === JSON.stringify({ args: [pageable] }),
  );
});

Deno.test("边界-空页面", async () => {
  const { createResourceProxy } = await import("../index.ts");
  const UserResource: Resource<User> = createResourceProxy("User");
  const mockFetch = setupMockFetch();
  const mockPageResponse: Page<User> = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 10,
    number: 0,
    numberOfElements: 0,
    first: true,
    last: true,
    empty: true,
  };
  const pageable: Pageable = { page: 0, size: 10 };
  mockFetch.mockResolvedValue({ ok: true, json: async () => mockPageResponse });
  const result = await UserResource.findAllPaged(pageable);
  assert(result.empty === true);
  assert(result.content.length === 0);
  assert(result.totalElements === 0);
});

Deno.test("边界-大页面尺寸", async () => {
  const { createResourceProxy } = await import("../index.ts");
  const UserResource: Resource<User> = createResourceProxy("User");
  const mockFetch = setupMockFetch();
  const mockPageResponse: Page<User> = {
    content: new Array(100).fill(null).map((_, i) => ({
      id: `${i}`,
      name: `User${i}`,
      email: `user${i}@test.com`,
      age: 20 + i,
      createdAt: `2024-01-${(i % 30) + 1}`,
    })),
    totalElements: 1000,
    totalPages: 10,
    size: 100,
    number: 0,
    numberOfElements: 100,
    first: true,
    last: false,
    empty: false,
  };
  const pageable: Pageable = { page: 0, size: 100 };
  mockFetch.mockResolvedValue({ ok: true, json: async () => mockPageResponse });
  const result = await UserResource.findAllPaged(pageable);
  assert(mockFetch.mock.calls[0][0] === "/api/whisper/User/findAllPaged");
  assert(mockFetch.mock.calls[0][1].method === "POST");
  assert(
    mockFetch.mock.calls[0][1].headers["Content-Type"] === "application/json",
  );
  assert(
    mockFetch.mock.calls[0][1].body === JSON.stringify({ args: [pageable] }),
  );
  assert(result.content.length === 100);
  assert(result.size === 100);
});

Deno.test("集成-用户列表分页", async () => {
  const { createResourceProxy } = await import("../index.ts");
  const UserResource: Resource<User> = createResourceProxy("User");
  const mockFetch = setupMockFetch();
  const mockUsers: User[] = [
    {
      id: "1",
      name: "张三",
      email: "zhangsan@example.com",
      age: 25,
      createdAt: "2024-01-15",
    },
    {
      id: "2",
      name: "李四",
      email: "lisi@example.com",
      age: 30,
      createdAt: "2024-01-14",
    },
    {
      id: "3",
      name: "王五",
      email: "wangwu@example.com",
      age: 28,
      createdAt: "2024-01-13",
    },
  ];
  const mockPageResponse: Page<User> = {
    content: mockUsers,
    totalElements: 150,
    totalPages: 8,
    size: 20,
    number: 0,
    numberOfElements: 3,
    first: true,
    last: false,
    empty: false,
  };
  const pageable: Pageable = {
    page: 0,
    size: 20,
    sort: { fields: [{ field: "createdAt", direction: "DESC" }] },
  };
  mockFetch.mockResolvedValue({ ok: true, json: async () => mockPageResponse });
  const result = await UserResource.findAllPaged(pageable);
  assert(result.content.length === 3);
  assert(result.content[0].name === "张三");
  assert(result.totalElements === 150);
  assert(result.totalPages === 8);
  assert(mockFetch.mock.calls[0][0] === "/api/whisper/User/findAllPaged");
  assert(mockFetch.mock.calls[0][1].method === "POST");
  assert(
    mockFetch.mock.calls[0][1].headers["Content-Type"] === "application/json",
  );
  assert(
    mockFetch.mock.calls[0][1].body === JSON.stringify({ args: [pageable] }),
  );
});
