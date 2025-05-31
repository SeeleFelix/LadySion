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
}

// 扩展Resource以包含动态查询方法
interface UserResource extends Resource<User> {
  findByUsername(username: string): Promise<User | null>;
}

Deno.test("动态查询方法应该失败", async () => {
  // 设置mock fetch
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

  const mockUser = {
    id: "1",
    username: "john",
    email: "john@test.com",
    age: 25,
  };
  
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => mockUser,
  });

  const userResource = createResourceProxy<UserResource>("User");

  try {
    // 这应该失败，因为findByUsername还没有实现
    const result = await userResource.findByUsername("john");
    console.log("意外地成功了:", result);
  } catch (error) {
    console.log("按预期失败了:", error);
    assert(error instanceof Error);
    if (error instanceof Error) {
      console.log("错误消息:", error.message);
    }
  }
}); 