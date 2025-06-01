/**
 * 🔧 配置管理测试
 * 验证Doctrine配置的读取和合并
 */

/// <reference lib="deno.ns" />

import { assertEquals, assert } from "std/assert/mod.ts";
import { getDoctrine, setGlobalDoctrine, getGlobalDoctrine } from "../core/config.ts";

Deno.test("配置管理 - 默认配置读取", () => {
  // 清除环境变量
  const originalEnv = Deno.env.get("WHISPER_ENV");
  if (originalEnv) {
    Deno.env.delete("WHISPER_ENV");
  }
  
  try {
    const doctrine = getDoctrine();
    
    // 验证默认配置
    assertEquals(doctrine.baseUrl, "http://localhost:8000"); // development环境
    assertEquals(doctrine.timeout, 10000);
    assertEquals(doctrine.whisperPath, "/api/whisper");
    assertEquals(doctrine.retries, 1);
    assertEquals(doctrine.headers["Content-Type"], "application/json");
  } finally {
    // 恢复环境变量
    if (originalEnv) {
      Deno.env.set("WHISPER_ENV", originalEnv);
    }
  }
});

Deno.test("配置管理 - 环境配置切换", () => {
  // 设置生产环境
  Deno.env.set("WHISPER_ENV", "production");
  
  try {
    const doctrine = getDoctrine();
    
    assertEquals(doctrine.baseUrl, "https://api.example.com");
    assertEquals(doctrine.timeout, 60000);
    assertEquals(doctrine.retries, 5);
    assertEquals(doctrine.headers["X-Environment"], "production");
  } finally {
    Deno.env.delete("WHISPER_ENV");
  }
});

Deno.test("配置管理 - 运行时覆盖", () => {
  const overrides = {
    baseUrl: "http://custom.api.com",
    timeout: 45000,
    headers: {
      "Authorization": "Bearer custom-token"
    }
  };
  
  const doctrine = getDoctrine(overrides);
  
  assertEquals(doctrine.baseUrl, "http://custom.api.com");
  assertEquals(doctrine.timeout, 45000);
  assertEquals(doctrine.headers["Authorization"], "Bearer custom-token");
  assertEquals(doctrine.headers["Content-Type"], "application/json"); // 保留默认
});

Deno.test("配置管理 - 全局配置设置", () => {
  // 清理全局配置
  setGlobalDoctrine({});
  
  setGlobalDoctrine({
    baseUrl: "http://global.api.com",
    headers: {
      "X-Global": "true"
    }
  });
  
  const doctrine = getGlobalDoctrine();
  
  assertEquals(doctrine.baseUrl, "http://global.api.com");
  assertEquals(doctrine.headers["X-Global"], "true");
  
  // 清理
  setGlobalDoctrine({});
}); 