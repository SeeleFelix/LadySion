/**
 * 🌟 Whisper Framework 使用示例
 * 展示如何使用createSeeker创建业务API调用
 */

import { createSeeker } from "../index.ts";
import type { Seeker } from "../index.ts";

// 🔮 步骤1：定义业务Eidolon（通常在scripture包中）
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

// 🙏 步骤2：定义Seeker接口（通常在scripture包中）
interface UserSeeker extends Seeker<UserEidolon> {
  // 单参数方法
  findById(id: string): Promise<UserEidolon>;

  // 多参数方法
  create(username: string, email: string, age: number): Promise<UserEidolon>;

  // 复杂多参数方法
  updateProfile(
    userId: string,
    profile: Partial<UserEidolon["profile"]>,
    notify?: boolean,
  ): Promise<UserEidolon>;

  // 搜索方法
  search(
    query: string,
    filters: { minAge?: number; maxAge?: number },
    pagination: { page: number; size: number },
  ): Promise<UserEidolon[]>;

  // 无参数方法
  getStatistics(): Promise<{
    totalUsers: number;
    activeUsers: number;
  }>;

  // 删除方法
  delete(id: string): Promise<void>;
}

// 🔧 步骤3：创建seeker实例（通常在scripture包的index.ts中）
const userSeeker = createSeeker<UserSeeker>("User", {
  baseUrl: "http://localhost:8000",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer your-token",
  },
});

// 🎯 步骤4：在业务代码中使用（前端代码超级干净）
export async function businessLogicExample() {
  try {
    // ✨ 单参数调用
    const user = await userSeeker.findById("123");
    console.log("👤 找到用户:", user.username);

    // ✨ 多参数调用
    const newUser = await userSeeker.create("玲珑", "lingling@example.com", 25);
    console.log("🎉 创建用户:", newUser);

    // ✨ 复杂多参数调用
    const updatedUser = await userSeeker.updateProfile(
      newUser.id!,
      { firstName: "玲", lastName: "珑" },
      true,
    );
    console.log("📝 更新用户:", updatedUser);

    // ✨ 搜索调用
    const searchResults = await userSeeker.search(
      "程序员",
      { minAge: 20, maxAge: 35 },
      { page: 0, size: 10 },
    );
    console.log("🔍 搜索结果:", searchResults.length, "个用户");

    // ✨ 无参数调用
    const stats = await userSeeker.getStatistics();
    console.log("📊 统计:", stats);

    // ✨ 删除操作
    await userSeeker.delete("old-user-id");
    console.log("🗑️ 删除完成");
  } catch (error) {
    console.error("❌ 操作失败:", error);
  }
}

// 🏗️ 架构说明
export const ARCHITECTURE_OVERVIEW = `
🏗️ Whisper Framework 架构概览

📦 在scripture包中做所有脏活：
1. 定义Eidolon和Seeker接口
2. 用createSeeker创建实例
3. 处理环境配置、认证等
4. 导出clean的seeker对象

🎯 前端代码超级干净：
import { userSeeker } from '@/scripture';
const user = await userSeeker.create("name", "email", 25);

✨ 核心特性：
- 支持任意多参数：create(name, email, age)
- TypeScript类型安全
- 统一错误处理  
- 环境配置管理
- Whisper协议：POST /whisper/{eidolon}/{ritual}

🔮 Spell格式：
{
  args: ["参数1", "参数2", { 复杂对象 }]
}

🌐 Whisper协议示例：
POST /whisper/User/create
{
  "spell": {
    "args": ["玲珑", "test@example.com", 25]  
  }
}
`;

// 🚀 运行示例（仅用于演示，实际使用时不需要mock）
if (import.meta.main) {
  console.log("🌟 ===== Whisper Framework 使用示例 =====");
  console.log(ARCHITECTURE_OVERVIEW);
  console.log("\n📋 业务逻辑示例（需要实际后端支持）：");

  // 注意：这里会报网络错误，因为没有真实后端
  // 在实际使用中，确保有对应的whisper后端服务
  try {
    await businessLogicExample();
  } catch (error) {
    console.log("ℹ️ 这是正常的，因为没有运行后端服务");
    console.log("在实际使用中，请确保whisper后端服务正在运行");
  }

  console.log("\n🎉 ===== 示例完成 =====");
}
