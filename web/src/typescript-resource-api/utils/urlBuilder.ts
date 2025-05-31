/**
 * TRA URL构建工具
 * 负责构建RESTful API的URL和查询参数
 * 使用Vite官方配置管理，返回相对路径供HttpClient使用
 */

import type { Pageable, ResourceConfig, SortField } from "../types";
import { buildResourcePath } from "../config";

/**
 * URL路径构建器 - 统一管理所有URL构建逻辑
 * ⚠️ 重要：此类返回相对路径，由HttpClient负责拼接baseUrl
 */
export class UrlBuilder {
  private resourceName: string;
  private config?: Partial<ResourceConfig>;

  constructor(resourceName: string, config?: Partial<ResourceConfig>) {
    this.resourceName = resourceName;
    this.config = config;
  }

  /**
   * 构建基础资源路径 - 返回相对路径
   * 返回: /api/resources/ResourceName
   */
  getBasePath(): string {
    return buildResourcePath(this.resourceName, this.config);
  }

  /**
   * 构建单个资源路径 - 返回相对路径
   * 返回: /api/resources/ResourceName/id
   */
  getResourcePath(id: string): string {
    return `${this.getBasePath()}/${id}`;
  }

  /**
   * 构建分页查询URL
   */
  getPagedUrl(pageable: Pageable): string {
    const basePath = this.getBasePath();
    const queryParams = this.buildPageableParams(pageable);
    return `${basePath}?${queryParams}`;
  }

  /**
   * 构建分页查询参数 - 私有方法，专注于参数构建逻辑
   */
  private buildPageableParams(pageable: Pageable): string {
    const params: string[] = [];

    // 添加分页参数 - 基础必需参数
    params.push(`page=${pageable.page}`);
    params.push(`size=${pageable.size}`);

    // 添加排序参数 - 可选参数
    if (pageable.sort?.fields && pageable.sort.fields.length > 0) {
      pageable.sort.fields.forEach((sortField: SortField) => {
        // 验证排序字段参数
        if (sortField.field && sortField.direction) {
          params.push(`sort=${sortField.field},${sortField.direction}`);
        }
      });
    }

    return params.join("&");
  }

  /**
   * 构建自定义查询URL - 为未来扩展做准备
   */
  getCustomQueryUrl(
    endpoint: string,
    queryParams?: Record<string, string | number>,
  ): string {
    const basePath = this.getBasePath();
    const url = `${basePath}/${endpoint}`;

    if (!queryParams || Object.keys(queryParams).length === 0) {
      return url;
    }

    const params = Object.entries(queryParams)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join("&");

    return `${url}?${params}`;
  }
}
