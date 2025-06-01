/**
 * 🎯 正确的错误处理架构测试
 * 明确区分 OmenError（业务异常）和 WrathError（系统异常）
 */

/// <reference lib="deno.ns" />

import { assertEquals, assert } from "std/assert/mod.ts";
import { createSeeker } from "../index.ts";
import type { Eidolon, Seeker } from "../index.ts";
import { OmenError, WrathError } from "../index.ts";

interface User extends Eidolon {
  id?: string;
  name: string;
  email: string;
}

interface UserSeeker extends Seeker<User> {
  findById(id: string): Promise<User>;
  create(name: string, email: string): Promise<User>;
  delete(id: string): Promise<void>;
}

// 🎭 Mock工具
let fetchMock: any;

function setupFetchMock() {
  fetchMock = {
    calls: [] as any[],
    response: undefined as any,
    
    mockHttpSuccess(grace: any) {
      this.response = {
        ok: true,
        status: 200,
        json: async () => grace,
      };
      return this;
    },
    
    mockHttpError(status: number, message: string) {
      this.response = {
        ok: false,
        status: status,
        statusText: message,
        json: async () => ({ error: message }),
      };
      return this;
    },
    
    mockNetworkError() {
      this.response = Promise.reject(new Error("Network connection failed"));
      return this;
    }
  };
  
  globalThis.fetch = ((...args: any[]) => {
    fetchMock.calls.push(args);
    return Promise.resolve(fetchMock.response);
  }) as any;
}

Deno.test("🌟 成功场景：HTTP 200 + omen.code 200", async () => {
  setupFetchMock();
  const userSeeker = createSeeker<UserSeeker>("User");
  
  // When: 业务操作成功
  fetchMock.mockHttpSuccess({
    eidolon: { id: "123", name: "玲珑", email: "test@example.com" },
    omen: { code: 200, status: "success", message: "查找成功" },
    timestamp: Date.now()
  });
  
  const user = await userSeeker.findById("123");
  
  // Then: 应该正常返回数据
  assertEquals(user.name, "玲珑");
  assertEquals(user.email, "test@example.com");
});

Deno.test("📋 OmenError：HTTP 200 + omen.code 404 - 应该抛出OmenError", async () => {
  setupFetchMock();
  const userSeeker = createSeeker<UserSeeker>("User");
  
  // When: 业务层面的错误（用户不存在）
  fetchMock.mockHttpSuccess({
    eidolon: null,
    omen: { code: 404, status: "error", message: "用户不存在" },
    timestamp: Date.now()
  });
  
  // Then: 应该抛出OmenError，业务代码可以处理
  try {
    await userSeeker.findById("nonexistent");
    assert(false, "应该抛出OmenError");
  } catch (error: any) {
    assertEquals(error.name, "OmenError");
    assertEquals(error.message, "用户不存在");
    assertEquals(error.omen.code, 404);
    assertEquals(error.omen.status, "error");
  }
});

Deno.test("📋 OmenError：HTTP 200 + omen.code 401 - 权限错误", async () => {
  setupFetchMock();
  const userSeeker = createSeeker<UserSeeker>("User");
  
  // When: 权限不足
  fetchMock.mockHttpSuccess({
    eidolon: null,
    omen: { code: 401, status: "error", message: "权限不足" },
    timestamp: Date.now()
  });
  
  // Then: 应该抛出OmenError
  try {
    await userSeeker.findById("secret");
    assert(false, "应该抛出OmenError");
  } catch (error: any) {
    assertEquals(error.name, "OmenError");
    assertEquals(error.message, "权限不足");
    assertEquals(error.omen.code, 401);
  }
});

Deno.test("📋 OmenError：HTTP 200 + omen.code 422 - 验证错误", async () => {
  setupFetchMock();
  const userSeeker = createSeeker<UserSeeker>("User");
  
  // When: 数据验证失败
  fetchMock.mockHttpSuccess({
    eidolon: null,
    omen: { code: 422, status: "error", message: "邮箱格式不正确" },
    timestamp: Date.now()
  });
  
  // Then: 应该抛出OmenError
  try {
    await userSeeker.create("测试", "invalid-email");
    assert(false, "应该抛出OmenError");
  } catch (error: any) {
    assertEquals(error.name, "OmenError");
    assertEquals(error.message, "邮箱格式不正确");
    assertEquals(error.omen.code, 422);
  }
});

Deno.test("🔥 WrathError：HTTP 400错误 - 应该抛出WrathError", async () => {
  setupFetchMock();
  const userSeeker = createSeeker<UserSeeker>("User");
  
  // When: HTTP 400错误（系统层面错误）
  fetchMock.mockHttpError(400, "Bad Request");
  
  // Then: 应该抛出WrathError
  try {
    await userSeeker.findById("123");
    assert(false, "应该抛出WrathError");
  } catch (error: any) {
    assertEquals(error.name, "WrathError");
    assert(error.message.includes("Bad Request"));
    assertEquals(error.omen.code, 400);
    assertEquals(error.omen.signal, "http_error");
  }
});

Deno.test("🔥 WrathError：HTTP 500错误 - 应该抛出WrathError", async () => {
  setupFetchMock();
  const userSeeker = createSeeker<UserSeeker>("User");
  
  // When: HTTP 500错误（服务器错误）
  fetchMock.mockHttpError(500, "Internal Server Error");
  
  // Then: 应该抛出WrathError
  try {
    await userSeeker.findById("123");
    assert(false, "应该抛出WrathError");
  } catch (error: any) {
    assertEquals(error.name, "WrathError");
    assert(error.message.includes("Internal Server Error"));
    assertEquals(error.omen.code, 500);
    assertEquals(error.omen.signal, "http_error");
  }
});

Deno.test("🌐 WrathError：网络错误 - 应该抛出WrathError", async () => {
  setupFetchMock();
  const userSeeker = createSeeker<UserSeeker>("User");
  
  // When: 网络连接失败
  fetchMock.mockNetworkError();
  
  // Then: 应该抛出WrathError
  try {
    await userSeeker.findById("123");
    assert(false, "应该抛出WrathError");
  } catch (error: any) {
    assertEquals(error.name, "WrathError");
    assert(error.message.includes("Network connection failed"));
    assertEquals(error.omen.signal, "network_error");
  }
});

Deno.test("🔧 WrathError：JSON解析错误 - 应该抛出WrathError", async () => {
  setupFetchMock();
  const userSeeker = createSeeker<UserSeeker>("User");
  
  // When: 服务器返回无效JSON
  fetchMock.response = {
    ok: true,
    status: 200,
    json: async () => { throw new Error("Invalid JSON"); }
  };
  
  // Then: 应该抛出WrathError
  try {
    await userSeeker.findById("123");
    assert(false, "应该抛出WrathError");
  } catch (error: any) {
    assertEquals(error.name, "WrathError");
    assert(error.message.includes("Invalid JSON"));
    assertEquals(error.omen.signal, "parse_error");
  }
});

Deno.test("⏰ WrathError：请求超时 - 应该抛出WrathError", async () => {
  setupFetchMock();
  const userSeeker = createSeeker<UserSeeker>("User", {
    timeout: 50 // 很短的超时时间
  });
  
  // When: 模拟AbortError
  globalThis.fetch = ((...args: any[]) => {
    fetchMock.calls.push(args);
    const error = new Error("This operation was aborted");
    error.name = "AbortError";
    return Promise.reject(error);
  }) as any;
  
  // Then: 应该抛出WrathError
  try {
    await userSeeker.findById("123");
    assert(false, "应该抛出WrathError");
  } catch (error: any) {
    assertEquals(error.name, "WrathError");
    assert(error.message.includes("aborted"));
    assertEquals(error.omen.signal, "timeout_error");
  }
});

Deno.test("💼 业务代码异常处理示例", async () => {
  setupFetchMock();
  const userSeeker = createSeeker<UserSeeker>("User");
  
  // 模拟用户不存在的场景
  fetchMock.mockHttpSuccess({
    eidolon: null,
    omen: { code: 404, status: "error", message: "用户不存在" },
    timestamp: Date.now()
  });
  
  // When: 业务代码处理OmenError
  let user = null;
  try {
    user = await userSeeker.findById("123");
  } catch (error: any) {
    if (error instanceof OmenError) {
      // 业务代码可以根据omen.code处理不同错误
      if (error.omen.code === 404) {
        console.log("用户不存在，可以提示创建新用户");
        user = null; // 设置默认值
      } else if (error.omen.code === 401) {
        console.log("需要重新登录");
      }
    } else {
      // WrathError是系统异常，不应该在这里处理
      throw error;
    }
  }
  
  // Then: 业务逻辑正常继续
  assertEquals(user, null);
});

Deno.test("🎯 架构验证：错误类型分类正确", async () => {
  setupFetchMock();
  const userSeeker = createSeeker<UserSeeker>("User");
  
  // 测试所有业务错误都抛出OmenError
  const businessErrorCodes = [404, 401, 403, 422, 409, 429];
  
  for (const code of businessErrorCodes) {
    fetchMock.mockHttpSuccess({
      eidolon: null,
      omen: { code, status: "error", message: `业务错误${code}` },
      timestamp: Date.now()
    });
    
    try {
      await userSeeker.findById("test");
      assert(false, `code ${code} 应该抛出OmenError`);
    } catch (error: any) {
      assertEquals(error.name, "OmenError", `code ${code} 应该是OmenError`);
      assertEquals(error.omen.code, code);
    }
  }
  
  // 测试系统错误都抛出WrathError
  const systemErrorCodes = [400, 500, 502, 503];
  
  for (const code of systemErrorCodes) {
    fetchMock.mockHttpError(code, `System Error ${code}`);
    
    try {
      await userSeeker.findById("test");
      assert(false, `HTTP ${code} 应该抛出WrathError`);
    } catch (error: any) {
      assertEquals(error.name, "WrathError", `HTTP ${code} 应该是WrathError`);
      assertEquals(error.omen.code, code);
    }
  }
}); 