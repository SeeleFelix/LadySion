/**
 * Vitest全局测试设置
 * 配置测试环境、全局模拟和工具函数
 */

import { afterEach, beforeEach, vi } from "vitest";
import { enableAutoUnmount } from "@vue/test-utils";

// 自动卸载组件，避免内存泄漏
enableAutoUnmount(afterEach);

// 全局模拟配置
beforeEach(() => {
  // 重置所有模拟
  vi.resetAllMocks();

  // 模拟fetch API
  globalThis.fetch = vi.fn();

  // 模拟EventSource
  globalThis.EventSource = vi.fn().mockImplementation(() => ({
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    close: vi.fn(),
    readyState: 1,
    onmessage: null,
    onerror: null,
  }));

  // 模拟localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
  });

  // 模拟URL和URLSearchParams
  globalThis.URL = class URL {
    constructor(url: string, base?: string) {
      this.href = base ? `${base}/${url}` : url;
      this.searchParams = new URLSearchParams(url.split("?")[1] || "");
    }
    href: string;
    searchParams: URLSearchParams;
  } as any;

  globalThis.URLSearchParams = class URLSearchParams {
    private params = new Map<string, string>();

    constructor(init?: string) {
      if (init) {
        init.split("&").forEach((pair) => {
          const [key, value] = pair.split("=");
          if (key && value) {
            this.params.set(decodeURIComponent(key), decodeURIComponent(value));
          }
        });
      }
    }

    set(key: string, value: string) {
      this.params.set(key, value);
    }

    get(key: string) {
      return this.params.get(key) || null;
    }

    toString() {
      const pairs: string[] = [];
      this.params.forEach((value, key) => {
        pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      });
      return pairs.join("&");
    }
  } as any;
});

afterEach(() => {
  // 清理计时器
  vi.clearAllTimers();

  // 清理DOM
  document.body.innerHTML = "";
});
