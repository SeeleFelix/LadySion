/**
 * 参考Spring Data JPA的 JpaRepository<T, ID> 模式
 * CRUD操作：create、update、patch、delete
 */

// 用 Deno.test/断言替换
// import { beforeEach, describe, expect, it, vi } from "vitest";
import { Resource } from "../types";
import { createResourceProxy } from "../createResourceMapper";
import { assert, assertEquals } from "std/assert/mod.ts";

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
  age?: number;
}

// 业务接口继承Resource - 参考Spring Data JPA
interface AppleResource extends Resource<Apple> {
  // 自动继承RESTful CRUD方法
}

interface UserResource extends Resource<User> {
  // 自动继承RESTful CRUD方法
}

// Mock helpers
function createMockSuccessResponse(data: any) {
  return {
    ok: true,
    json: () => Promise.resolve(data),
  } as Response;
}

function createMockErrorResponse(status: number) {
  return {
    ok: false,
    status,
    statusText: "Error",
  } as Response;
}

Deno.test("TypeScript Resource API (TRA) - RESTful CRUD接口", () => {
  // 用 Deno.test/断言替换 beforeEach(() => {
  //   vi.clearAllMocks();
  //   globalThis.fetch = vi.fn();
  // });

  Deno.test("Resource接口继承", () => {
    const appleResource = createResourceProxy<AppleResource>("Apple");

    Deno.test("应该为继承Resource的接口创建动态代理，包含CRUD方法", () => {
      assert(appleResource).toBeDefined();
      // 查询方法
      assert(typeof appleResource.findAll).toBe("function");
      assert(typeof appleResource.findById).toBe("function");
      // 创建方法
      assert(typeof appleResource.create).toBe("function");
      // 更新方法
      assert(typeof appleResource.update).toBe("function");
      assert(typeof appleResource.patch).toBe("function");
      // 删除方法
      assert(typeof appleResource.deleteById).toBe("function");
    });

    Deno.test("应该支持多个不同的资源类型", () => {
      const appleResource = createResourceProxy<AppleResource>("Apple");
      const userResource = createResourceProxy<UserResource>("User");

      assert(appleResource).toBeDefined();
      assert(userResource).toBeDefined();
      assert(appleResource).not.toBe(userResource);
    });
  });

  Deno.test("查询操作 (Read)", () => {
    let appleResource: AppleResource;

    Deno.test("beforeEach", () => {
      appleResource = createResourceProxy<AppleResource>("Apple");
    });

    Deno.test("findAll() 应该映射为 POST /api/whisper/Apple/findAll", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        createMockSuccessResponse([]),
      );
      await appleResource.findAll();
      assert(fetch).toHaveBeenCalledWith(
        "/api/whisper/Apple/findAll",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ args: [] }),
        }),
      );
    });

    Deno.test("findById(id) 应该映射为 POST /api/whisper/Apple/findById", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        createMockSuccessResponse({}),
      );
      await appleResource.findById("123");
      assert(fetch).toHaveBeenCalledWith(
        "/api/whisper/Apple/findById",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ args: ["123"] }),
        }),
      );
    });
  });

  Deno.test("创建操作 (Create)", () => {
    let appleResource: AppleResource;
    Deno.test("beforeEach", () => {
      appleResource = createResourceProxy<AppleResource>("Apple");
    });
    Deno.test("create() 应该映射为 POST /api/whisper/Apple/create", async () => {
      const newApple = { name: "New Apple", color: "yellow", price: 1.2 };
      globalThis.fetch = vi.fn().mockResolvedValue(
        createMockSuccessResponse({}),
      );
      await appleResource.create(newApple);
      assert(fetch).toHaveBeenCalledWith(
        "/api/whisper/Apple/create",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ args: [newApple] }),
        }),
      );
    });
  });

  Deno.test("更新操作 (Update)", () => {
    let appleResource: AppleResource;
    Deno.test("beforeEach", () => {
      appleResource = createResourceProxy<AppleResource>("Apple");
    });
    Deno.test("update(id, entity) 应该映射为 POST /api/whisper/Apple/update", async () => {
      const fullApple = { name: "Updated Apple", color: "red", price: 2.5 };
      globalThis.fetch = vi.fn().mockResolvedValue(
        createMockSuccessResponse({}),
      );
      await appleResource.update("123", fullApple);
      assert(fetch).toHaveBeenCalledWith(
        "/api/whisper/Apple/update",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ args: ["123", fullApple] }),
        }),
      );
    });
    Deno.test("patch(id, partial) 应该映射为 POST /api/whisper/Apple/patch", async () => {
      const partialUpdate = { price: 3.0 };
      globalThis.fetch = vi.fn().mockResolvedValue(
        createMockSuccessResponse({}),
      );
      await appleResource.patch("123", partialUpdate);
      assert(fetch).toHaveBeenCalledWith(
        "/api/whisper/Apple/patch",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ args: ["123", partialUpdate] }),
        }),
      );
    });
  });

  Deno.test("删除操作 (Delete)", () => {
    let appleResource: AppleResource;
    Deno.test("beforeEach", () => {
      appleResource = createResourceProxy<AppleResource>("Apple");
    });
    Deno.test("deleteById(id) 应该映射为 POST /api/whisper/Apple/deleteById", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        createMockSuccessResponse(null),
      );
      await appleResource.deleteById("123");
      assert(fetch).toHaveBeenCalledWith(
        "/api/whisper/Apple/deleteById",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ args: ["123"] }),
        }),
      );
    });
  });

  Deno.test("多资源类型测试", () => {
    Deno.test("UserResource应该映射到正确的URL路径", async () => {
      const userResource = createResourceProxy<UserResource>("User");
      const newUser = { username: "john", email: "john@test.com", age: 25 };
      globalThis.fetch = vi.fn().mockResolvedValue(
        createMockSuccessResponse({ id: "1", ...newUser }),
      );
      await userResource.create(newUser);
      assert(fetch).toHaveBeenCalledWith(
        "/api/whisper/User/create",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ args: [newUser] }),
        }),
      );
    });
  });

  Deno.test("错误处理", () => {
    Deno.test("应该处理网络错误", async () => {
      const appleResource = createResourceProxy<AppleResource>("Apple");
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network Error"));

      await assert.rejects(() => appleResource.findAll(), "Network Error");
    });

    Deno.test("应该处理HTTP错误状态", async () => {
      const appleResource = createResourceProxy<AppleResource>("Apple");
      const mockResponse = createMockErrorResponse(404);
      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

      await assert.rejects(() => appleResource.findById("nonexistent"), Error);
    });
  });

  Deno.test("配置和定制", () => {
    Deno.test("应该支持自定义配置", async () => {
      const appleResource = createResourceProxy<AppleResource>("Apple", {
        baseUrl: "https://custom.api.com",
        headers: { "Authorization": "Bearer token123" },
      });
      const mockApples = [{ id: "1", name: "Apple", color: "red", price: 1.0 }];
      globalThis.fetch = vi.fn().mockResolvedValue(
        createMockSuccessResponse(mockApples),
      );
      await appleResource.findAll();
      assert(fetch).toHaveBeenCalledWith(
        "/api/whisper/Apple/findAll",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Authorization": "Bearer token123",
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({ args: [] }),
        }),
      );
    });
  });
});
