/**
 * 🧪 Doctrine 配置系统测试
 */

import {
  clearDoctrineCache,
  generateConfigTemplate,
  getDoctrine,
  getDoctrineSync,
} from "../core/doctrine.ts";
import { WrathError } from "../types/core.ts";

Deno.test("🔧 Doctrine 配置系统测试", async (t) => {
  await t.step("📋 应该加载默认配置", async () => {
    const doctrine = await getDoctrine();

    // 验证默认值（会被项目配置覆盖）
    assertEquals(doctrine.baseUrl, "http://localhost:8000");
    assertEquals(doctrine.timeout, 30000);
    assertEquals(doctrine.whisperPath, "/api/whisper"); // 项目配置覆盖
    assertEquals(doctrine.retries, 3);
    assertEquals(doctrine.retryBackoff, "exponential");
    assertEquals(doctrine.debug, true); // 项目配置覆盖
  });

  await t.step("🔄 应该正确合并配置覆盖", async () => {
    const doctrine = await getDoctrine({
      baseUrl: "https://api.custom.com",
      timeout: 60000,
      debug: true,
    });

    assertEquals(doctrine.baseUrl, "https://api.custom.com");
    assertEquals(doctrine.timeout, 60000);
    assertEquals(doctrine.debug, true);
    // 其他配置保持默认值
    assertEquals(doctrine.retries, 3);
  });

  await t.step("🔐 应该正确处理认证配置", async () => {
    const doctrine = await getDoctrine({
      auth: {
        type: "bearer",
        token: "test-token",
      },
    });

    // 验证认证headers自动添加
    assertEquals(doctrine.headers["Authorization"], "Bearer test-token");
  });

  await t.step("🌍 应该支持环境变量", async () => {
    // 设置环境变量
    Deno.env.set("WHISPER_BASE_URL", "https://env.example.com");
    Deno.env.set("WHISPER_TIMEOUT", "45000");
    Deno.env.set("WHISPER_DEBUG", "true");

    clearDoctrineCache(); // 清除缓存

    const doctrine = await getDoctrine();

    assertEquals(doctrine.baseUrl, "https://env.example.com");
    assertEquals(doctrine.timeout, 45000);
    assertEquals(doctrine.debug, true);

    // 清理环境变量
    Deno.env.delete("WHISPER_BASE_URL");
    Deno.env.delete("WHISPER_TIMEOUT");
    Deno.env.delete("WHISPER_DEBUG");
  });

  await t.step("🔍 应该智能构建headers", async () => {
    const doctrine = await getDoctrine({
      environment: "production",
      enableMetrics: true,
      requestId: () => "test-request-id",
      headers: {
        "X-Custom": "custom-value",
      },
    });

    // 验证自动添加的headers
    assertEquals(doctrine.headers["X-Environment"], "production");
    assertEquals(doctrine.headers["X-Request-ID"], "test-request-id");
    assertEquals(doctrine.headers["X-Custom"], "custom-value");
    assertEquals(doctrine.headers["Content-Type"], "application/json");
  });

  await t.step("⚠️ 应该验证必需配置", async () => {
    try {
      await getDoctrine({ baseUrl: "" });
      throw new Error("应该抛出错误");
    } catch (error: unknown) {
      assert(error instanceof WrathError);
      assertEquals((error as WrathError).omen.signal, "config_error");
    }
  });

  await t.step("⚠️ 应该验证配置范围", async () => {
    try {
      await getDoctrine({ timeout: -1 });
      throw new Error("应该抛出错误");
    } catch (error: unknown) {
      assert(error instanceof WrathError);
      assertEquals((error as WrathError).omen.signal, "config_error");
    }
  });

  await t.step("🔄 应该支持配置缓存", async () => {
    clearDoctrineCache();

    const doctrine1 = await getDoctrine();
    const doctrine2 = await getDoctrine();

    // 第二次应该从缓存读取，结果相同
    assertEquals(doctrine1.baseUrl, doctrine2.baseUrl);
  });

  await t.step("📋 应该生成配置模板", () => {
    const template = generateConfigTemplate();
    const config = JSON.parse(template);

    assert(config.baseUrl);
    assert(config.timeout);
    assert(config.auth);
    assert(config.headers);
  });

  await t.step("🚫 同步版本应该在未初始化时抛出错误", () => {
    clearDoctrineCache();

    try {
      getDoctrineSync();
      throw new Error("应该抛出错误");
    } catch (error: unknown) {
      assert(error instanceof WrathError);
      assertEquals((error as WrathError).omen.signal, "config_error");
    }
  });
});

// 测试辅助函数
function assertEquals(actual: any, expected: any) {
  if (actual !== expected) {
    throw new Error(`Expected ${expected}, got ${actual}`);
  }
}

function assert(condition: boolean, message?: string) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}
