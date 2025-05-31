/**
 * 测试辅助工具函数
 * 提供常用的测试工具和模拟数据创建函数
 */

import type { ServiceResponse } from "@shared/contracts";

/**
 * 创建模拟的成功响应
 */
export function createMockSuccessResponse<T>(data: T): ServiceResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date(),
  };
}

/**
 * 创建模拟的错误响应
 */
export function createMockErrorResponse(error: string): ServiceResponse {
  return {
    success: false,
    error,
    timestamp: new Date(),
  };
}

/**
 * 创建模拟的fetch响应
 */
export function createMockFetchResponse<T>(
  data: T,
  ok = true,
  status = 200,
): Response {
  return {
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    headers: new Headers({ "Content-Type": "application/json" }),
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    formData: () => Promise.resolve(new FormData()),
    clone: () => createMockFetchResponse(data, ok, status),
    body: null,
    bodyUsed: false,
    redirected: false,
    type: "default",
    url: "",
  } as Response;
}

/**
 * 等待指定时间
 */
export function waitFor(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 创建模拟的EventSource事件
 */
export function createMockSSEEvent(data: any) {
  return {
    data: JSON.stringify(data),
    type: "message",
  } as MessageEvent;
}

/**
 * 延迟Promise执行
 */
export function delayed<T>(value: T, delay = 100): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), delay);
  });
}

/**
 * 模拟网络延迟
 */
export async function withNetworkDelay<T>(
  fn: () => Promise<T>,
  delay = 100,
): Promise<T> {
  await waitFor(delay);
  return fn();
}
