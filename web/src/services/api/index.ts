import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import type { ApiError, ApiResponse } from "@/types";

// HTTP客户端配置
const createHttpClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: "/api",
    timeout: 10000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // 请求拦截器
  client.interceptors.request.use(
    (config) => {
      // 这里可以添加认证token等
      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  // 响应拦截器
  client.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      return response;
    },
    (error) => {
      const apiError: ApiError = {
        code: error.response?.status?.toString() || "UNKNOWN",
        message: error.response?.data?.message || error.message || "网络错误",
        details: error.response?.data,
      };
      return Promise.reject(apiError);
    },
  );

  return client;
};

export const httpClient = createHttpClient();

// 通用API调用方法
export class BaseApiService {
  protected async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await httpClient.get<ApiResponse<T>>(url, config);
    return response.data.data;
  }

  protected async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await httpClient.post<ApiResponse<T>>(url, data, config);
    return response.data.data;
  }

  protected async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await httpClient.put<ApiResponse<T>>(url, data, config);
    return response.data.data;
  }

  protected async delete<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await httpClient.delete<ApiResponse<T>>(url, config);
    return response.data.data;
  }
}
