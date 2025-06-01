/**
 * 🌟 Whisper 后端框架使用示例
 * 展示如何实现 Seeker 并集成到现有应用
 */

import { Router } from "oak/mod.ts";
import type { Seeker } from "../../types/core.ts";
import { setupWhisperRoutes } from "../core/factory.ts";
import type { SeekerImplementation } from "../types/backend.ts";
import { OmenError } from "../../types/core.ts";

// 🔮 步骤1：定义业务 Eidolon（与前端共享）
interface UserEidolon {
  id?: string;
  username: string;
  email: string;
  age: number;
  profile?: {
    firstName: string;
    lastName: string;
  };
}

// 🙏 步骤2：定义 Seeker 接口（与前端共享）
interface UserSeeker extends Seeker<UserEidolon> {
  findById(id: string): Promise<UserEidolon>;
  create(username: string, email: string, age: number): Promise<UserEidolon>;
  updateProfile(
    userId: string,
    profile: Partial<UserEidolon['profile']>,
    notify?: boolean
  ): Promise<UserEidolon>;
  search(
    query: string,
    filters: { minAge?: number; maxAge?: number },
    pagination: { page: number; size: number }
  ): Promise<UserEidolon[]>;
  getStatistics(): Promise<{ totalUsers: number; activeUsers: number }>;
  delete(id: string): Promise<void>;
}

// 🎯 步骤3：实现 Seeker 服务（纯业务逻辑，无HTTP概念）
class UserSeekerService implements UserSeeker, SeekerImplementation {
  private users: Map<string, UserEidolon> = new Map();
  
  constructor() {
    // 初始化一些测试数据
    this.users.set("1", {
      id: "1",
      username: "玲珑",
      email: "lingling@example.com",
      age: 25,
      profile: { firstName: "玲", lastName: "珑" }
    });
    
    this.users.set("2", {
      id: "2", 
      username: "茜茜",
      email: "xixi@example.com",
      age: 23
    });
  }

  async findById(id: string): Promise<UserEidolon> {
    console.log(`🔍 查找用户: ${id}`);
    
    const user = this.users.get(id);
    if (!user) {
      // 🚨 抛出业务异常（前端会收到 OmenError）
      throw new OmenError("用户不存在", {
        code: 404,
        status: "error",
        message: `用户 ${id} 不存在`,
        signal: "user_not_found"
      });
    }
    
    return user;
  }

  async create(username: string, email: string, age: number): Promise<UserEidolon> {
    console.log(`➕ 创建用户: ${username}, ${email}, ${age}`);
    
    // 业务验证
    if (age < 0 || age > 150) {
      throw new OmenError("年龄无效", {
        code: 400,
        status: "error",
        message: "年龄必须在 0-150 之间",
        signal: "invalid_age"
      });
    }

    if (!email.includes('@')) {
      throw new OmenError("邮箱格式无效", {
        code: 400,
        status: "error", 
        message: "请提供有效的邮箱地址",
        signal: "invalid_email"
      });
    }

    const id = Date.now().toString();
    const user: UserEidolon = {
      id,
      username,
      email,
      age,
    };

    this.users.set(id, user);
    return user;
  }

  async updateProfile(
    userId: string,
    profile: Partial<UserEidolon['profile']>,
    notify: boolean = false
  ): Promise<UserEidolon> {
    console.log(`📝 更新用户资料: ${userId}`, profile, { notify });
    
    const user = await this.findById(userId); // 复用查找逻辑
    
    user.profile = {
      firstName: user.profile?.firstName || '',
      lastName: user.profile?.lastName || '',
      ...profile,
    };
    
    this.users.set(userId, user);
    
    if (notify) {
      console.log(`📧 发送通知给用户: ${user.email}`);
    }
    
    return user;
  }

  async search(
    query: string,
    filters: { minAge?: number; maxAge?: number },
    pagination: { page: number; size: number }
  ): Promise<UserEidolon[]> {
    console.log(`🔍 搜索用户:`, { query, filters, pagination });
    
    let results = Array.from(this.users.values());
    
    // 关键词过滤
    if (query) {
      results = results.filter(user => 
        user.username.includes(query) || 
        user.email.includes(query)
      );
    }
    
    // 年龄过滤
    if (filters.minAge !== undefined) {
      results = results.filter(user => user.age >= filters.minAge!);
    }
    if (filters.maxAge !== undefined) {
      results = results.filter(user => user.age <= filters.maxAge!);
    }
    
    // 分页
    const start = pagination.page * pagination.size;
    const end = start + pagination.size;
    
    return results.slice(start, end);
  }

  async getStatistics(): Promise<{ totalUsers: number; activeUsers: number }> {
    console.log(`📊 获取用户统计`);
    
    return {
      totalUsers: this.users.size,
      activeUsers: this.users.size, // 简化：假设所有用户都是活跃的
    };
  }

  async delete(id: string): Promise<void> {
    console.log(`🗑️ 删除用户: ${id}`);
    
    if (!this.users.has(id)) {
      throw new OmenError("用户不存在", {
        code: 404,
        status: "error",
        message: `用户 ${id} 不存在`,
        signal: "user_not_found"
      });
    }
    
    this.users.delete(id);
  }
}

// 🎭 步骤4：创建其他 Seeker 示例
interface ProductSeeker extends Seeker<{ id?: string; name: string; price: number }> {
  findAll(): Promise<Array<{ id?: string; name: string; price: number }>>;
  findById(id: string): Promise<{ id?: string; name: string; price: number }>;
  create(name: string, price: number): Promise<{ id?: string; name: string; price: number }>;
}

class ProductSeekerService implements ProductSeeker, SeekerImplementation {
  private products = new Map([
    ["1", { id: "1", name: "MacBook Pro", price: 15999 }],
    ["2", { id: "2", name: "iPhone 15", price: 5999 }],
  ]);

  async findAll() {
    console.log("📦 获取所有产品");
    return Array.from(this.products.values());
  }

  async findById(id: string) {
    console.log(`📦 查找产品: ${id}`);
    const product = this.products.get(id);
    if (!product) {
      throw new OmenError("产品不存在", {
        code: 404,
        status: "error",
        message: `产品 ${id} 不存在`,
        signal: "product_not_found"
      });
    }
    return product;
  }

  async create(name: string, price: number) {
    console.log(`➕ 创建产品: ${name}, ¥${price}`);
    
    if (price <= 0) {
      throw new OmenError("价格无效", {
        code: 400,
        status: "error",
        message: "价格必须大于0",
        signal: "invalid_price"
      });
    }

    const id = Date.now().toString();
    const product = { id, name, price };
    this.products.set(id, product);
    return product;
  }
}

// 🚀 步骤5：集成到 Oak 应用
export function setupExampleWhisperAPI(router: Router): void {
  console.log("🎉 设置示例 Whisper API...");
  
  // 创建 Seeker 实例
  const seekers = {
    "User": new UserSeekerService(),
    "Product": new ProductSeekerService(),
  };
  
  // 🔮 一行代码完成所有路由设置！
  setupWhisperRoutes(router, seekers, {
    whisperPath: "/api/whisper",
  });
  
  console.log("✨ Whisper API 设置完成！");
  console.log("\n🎯 可用的 API 端点:");
  console.log("📍 POST /api/whisper/User/findById");
  console.log("📍 POST /api/whisper/User/create"); 
  console.log("📍 POST /api/whisper/User/updateProfile");
  console.log("📍 POST /api/whisper/User/search");
  console.log("📍 POST /api/whisper/User/getStatistics");
  console.log("📍 POST /api/whisper/User/delete");
  console.log("📍 POST /api/whisper/Product/findAll");
  console.log("📍 POST /api/whisper/Product/findById");
  console.log("📍 POST /api/whisper/Product/create");
}

// 🧪 使用示例（模拟前端调用）
export const USAGE_EXAMPLES = {
  // ✨ 前端调用示例
  frontend: `
// 前端代码（与后端完美对称）
import { userSeeker, productSeeker } from '@/scripture';

// 🎯 单参数调用
const user = await userSeeker.findById("1");

// 🎯 多参数调用  
const newUser = await userSeeker.create("张三", "zhangsan@example.com", 30);

// 🎯 复杂参数调用
const updatedUser = await userSeeker.updateProfile(
  "1",
  { firstName: "张", lastName: "三" },
  true
);

// 🎯 搜索调用
const users = await userSeeker.search(
  "程序员",
  { minAge: 20, maxAge: 35 },
  { page: 0, size: 10 }
);

// 🎯 无参数调用
const stats = await userSeeker.getStatistics();

// 🎯 产品相关
const products = await productSeeker.findAll();
const product = await productSeeker.findById("1");
`,

  // 🌐 HTTP 请求示例
  http: `
# 用户相关 API

POST /api/whisper/User/findById
{
  "spell": { "args": ["1"] }
}

POST /api/whisper/User/create  
{
  "spell": { "args": ["张三", "zhangsan@example.com", 30] }
}

POST /api/whisper/User/updateProfile
{
  "spell": { 
    "args": [
      "1", 
      { "firstName": "张", "lastName": "三" }, 
      true
    ] 
  }
}

POST /api/whisper/User/search
{
  "spell": {
    "args": [
      "程序员",
      { "minAge": 20, "maxAge": 35 },
      { "page": 0, "size": 10 }
    ]
  }
}

# 产品相关 API

POST /api/whisper/Product/findAll
{
  "spell": { "args": [] }
}

POST /api/whisper/Product/create
{
  "spell": { "args": ["新产品", 999] }
}
`,

  // ✅ 响应格式示例
  response: `
# 成功响应
{
  "eidolon": {
    "id": "1",
    "username": "玲珑", 
    "email": "lingling@example.com",
    "age": 25
  },
  "omen": {
    "code": 200,
    "status": "success",
    "message": "操作成功",
    "signal": "success"
  },
  "timestamp": 1703123456789
}

# 业务错误响应  
{
  "eidolon": null,
  "omen": {
    "code": 404,
    "status": "error",
    "message": "用户 999 不存在",
    "signal": "user_not_found"
  },
  "timestamp": 1703123456789
}
`
}; 