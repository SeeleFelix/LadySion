/**
 * TypeScript Resource API (TRA) - JPA风格严格实现
 * 按照Spring Data JPA规范，严格验证字段和操作符
 */

import {
  CreateResourceProxy,
  Resource,
  ResourceConfig,
} from "./types.ts";
import { HttpClient } from "./httpClient.ts";
import { QueryMethodParser, ParsedQuery } from "./queryMethodParser.ts";

/**
 * JPA风格的资源代理工厂
 * 严格按照字段和操作符规范解析方法名
 */
class JpaResourceProxyFactory<T> {
  private httpClient: HttpClient;
  private resourceName: string;
  private queryParser: QueryMethodParser<T>;
  private entityFields: string[];

  constructor(resourceName: string, entityFields: string[], config?: ResourceConfig) {
    this.httpClient = new HttpClient(config);
    this.resourceName = resourceName;
    this.entityFields = entityFields;
    this.queryParser = new QueryMethodParser<T>(entityFields);
  }

  /**
   * 处理JPA风格的动态查询方法
   */
  private handleJpaQuery<R>(method: string, args: any[]): Promise<R> {
    try {
      // 解析方法名
      const parsedQuery = this.queryParser.parseMethodName(method);
      
      // 验证参数
      this.queryParser.validateParameters(parsedQuery, args);
      
      // 构建whisper API调用
      return this.httpClient.request<R>({
        method: "POST",
        url: `/api/whisper/${this.resourceName}/${method}`,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          parsedQuery,  // 包含解析后的查询结构
          args 
        }),
      });
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * 处理标准CRUD方法
   */
  private handleStandardMethod<R>(method: string, args: any[]): Promise<R> {
    return this.httpClient.request<R>({
      method: "POST", 
      url: `/api/whisper/${this.resourceName}/${method}`,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ args }),
    });
  }

  /**
   * 创建JPA风格的资源代理
   */
  createProxy(): Resource<T> {
    const emptyTarget = {};

    return new Proxy(emptyTarget, {
      get: (target: any, prop: string | symbol) => {
        if (typeof prop !== 'string') {
          return undefined;
        }

        // 忽略内部属性
        if (prop.startsWith('_') || prop === 'constructor' || prop === 'prototype') {
          return undefined;
        }

        return (...args: any[]) => {
          // 标准CRUD方法直接处理
          if (this.isStandardMethod(prop)) {
            return this.handleStandardMethod(prop, args);
          }
          
          // JPA风格查询方法需要解析验证
          return this.handleJpaQuery(prop, args);
        };
      },

      ownKeys: (target) => {
        return [
          'findAll',
          'findById', 
          'findAllPaged',
          'create',
          'update',
          'patch',
          'deleteById'
        ];
      },

      has: (target, prop) => {
        if (typeof prop !== 'string') return false;
        
        // 标准方法always存在
        if (this.isStandardMethod(prop)) return true;
        
        // JPA方法需要符合规范 - 但不抛出错误
        try {
          this.queryParser.parseMethodName(prop);
          return true;
        } catch {
          // 解析失败则表示不支持此方法
          return false;
        }
      },

      getOwnPropertyDescriptor: (target, prop) => {
        if (typeof prop !== 'string') return undefined;
        if (prop.startsWith('_') || prop === 'constructor' || prop === 'prototype') {
          return undefined;
        }
        
        return {
          enumerable: true,
          configurable: true,
          value: (...args: any[]) => {
            if (this.isStandardMethod(prop)) {
              return this.handleStandardMethod(prop, args);
            }
            return this.handleJpaQuery(prop, args);
          }
        };
      }
    }) as Resource<T>;
  }

  /**
   * 判断是否为标准CRUD方法
   */
  private isStandardMethod(methodName: string): boolean {
    const standardMethods = [
      'findAll', 'findById', 'findAllPaged',
      'create', 'update', 'patch', 'deleteById'
    ];
    return standardMethods.includes(methodName);
  }
}

/**
 * 创建JPA风格的资源代理
 * 
 * 🎯 设计理念：严格按照JPA规范，确保后端可预测
 * 
 * ✅ 支持的方法模式：
 * - findBy{Field}{Operator}
 * - countBy{Field}{Operator}  
 * - existsBy{Field}{Operator}
 * - deleteBy{Field}{Operator}
 * 
 * ✅ 支持的操作符：
 * - 比较：GreaterThan, LessThan, Between, In等
 * - 字符串：Like, Containing, StartingWith等
 * - 逻辑：And, Or连接多个条件
 * 
 * ✅ 字段验证：
 * - 必须提供实体字段列表
 * - 方法名中的字段必须存在于实体中
 * - 参数个数必须匹配查询条件
 * 
 * 📖 使用示例：
 * ```typescript
 * const UserResource = createResourceProxy<Resource<User>>(
 *   "User", 
 *   ["id", "username", "email", "age", "status", "createdAt"]
 * );
 * 
 * // ✅ 有效的JPA查询
 * await UserResource.findByUsername("john");              
 * await UserResource.findByAgeGreaterThan(18);            
 * await UserResource.findByUsernameAndEmail("john", "john@test.com");
 * await UserResource.countByStatus("active");             
 * 
 * // ❌ 无效的查询（会抛出错误）
 * await UserResource.findByInvalidField("value");         // 字段不存在
 * await UserResource.customMethod("arg");                 // 不符合JPA模式
 * await UserResource.findByUsername();                    // 参数不匹配
 * ```
 */
export const createResourceProxy: CreateResourceProxy = (<T>(
  resourceName: string,
  entityFieldsOrConfig?: string[] | ResourceConfig,
  config?: ResourceConfig,
) => {
  let entityFields: string[];
  let actualConfig: ResourceConfig | undefined;

  // 处理参数重载
  if (Array.isArray(entityFieldsOrConfig)) {
    entityFields = entityFieldsOrConfig;
    actualConfig = config;
  } else {
    // 如果没有提供字段列表，使用通用字段（向后兼容）
    entityFields = ["id"];
    actualConfig = entityFieldsOrConfig;
    console.warn(`⚠️  建议为 ${resourceName} 提供字段列表以启用严格的JPA验证`);
  }

  const factory = new JpaResourceProxyFactory(resourceName, entityFields, actualConfig);
  return factory.createProxy();
}) as CreateResourceProxy;
