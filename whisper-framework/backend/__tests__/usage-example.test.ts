/**
 * 🎯 Whisper 后端框架使用示例测试
 * 展示真实场景中的使用方法和最佳实践
 */

import { assertEquals, assert } from "jsr:@std/assert@1";
import { Router } from "oak/mod.ts";
import { setupWhisperRoutes } from "../core/factory.ts";
import type { SeekerImplementation } from "../types/backend.ts";
import type { Seeker } from "../../types/core.ts";
import { OmenError } from "../../types/core.ts";

// ================================
// 🏢 真实业务场景：用户管理系统
// ================================

// 📋 业务实体定义
interface UserEidolon {
  id?: string;
  username: string;
  email: string;
  age: number;
  profile?: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface PostEidolon {
  id?: string;
  title: string;
  content: string;
  authorId: string;
  tags: string[];
  published: boolean;
  createdAt?: string;
}

// 🙏 业务接口定义（与前端共享）
interface UserSeeker extends Seeker<UserEidolon> {
  // 基础 CRUD
  findById(id: string): Promise<UserEidolon>;
  findByEmail(email: string): Promise<UserEidolon>;
  create(username: string, email: string, age: number): Promise<UserEidolon>;
  update(id: string, data: Partial<UserEidolon>): Promise<UserEidolon>;
  delete(id: string): Promise<void>;
  
  // 复杂查询
  search(
    query: string,
    filters: { minAge?: number; maxAge?: number; hasProfile?: boolean },
    pagination: { page: number; size: number }
  ): Promise<UserEidolon[]>;
  
  // 业务逻辑
  updateProfile(
    userId: string,
    profile: Partial<UserEidolon['profile']>,
    notify?: boolean
  ): Promise<UserEidolon>;
  
  // 统计信息
  getStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    averageAge: number;
  }>;
}

interface PostSeeker extends Seeker<PostEidolon> {
  findById(id: string): Promise<PostEidolon>;
  findByAuthor(authorId: string): Promise<PostEidolon[]>;
  create(
    title: string,
    content: string,
    authorId: string,
    tags: string[]
  ): Promise<PostEidolon>;
  publish(id: string): Promise<PostEidolon>;
  searchByTag(tag: string): Promise<PostEidolon[]>;
}

// 🎯 业务服务实现
class UserSeekerService implements UserSeeker, SeekerImplementation {
  private users = new Map<string, UserEidolon>();
  private emailIndex = new Map<string, string>(); // email -> id
  
  constructor() {
    // 初始化测试数据
    this.initTestData();
  }

  private initTestData() {
    const users = [
      {
        id: "1",
        username: "玲珑",
        email: "lingling@example.com",
        age: 25,
        profile: { firstName: "玲", lastName: "珑", avatar: "avatar1.jpg" },
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z"
      },
      {
        id: "2",
        username: "茜茜",
        email: "akane@example.com",
        age: 23,
        profile: { firstName: "茜", lastName: "子" },
        createdAt: "2024-01-02T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z"
      },
      {
        id: "3",
        username: "小明",
        email: "xiaoming@example.com",
        age: 30,
        createdAt: "2024-01-03T00:00:00Z",
        updatedAt: "2024-01-03T00:00:00Z"
      }
    ];

    for (const user of users) {
      this.users.set(user.id, user);
      this.emailIndex.set(user.email, user.id);
    }
  }

  async findById(id: string): Promise<UserEidolon> {
    const user = this.users.get(id);
    if (!user) {
      throw new OmenError("用户不存在", {
        code: 404,
        status: "error",
        message: `用户 ${id} 不存在`,
        signal: "user_not_found"
      });
    }
    return { ...user }; // 返回副本
  }

  async findByEmail(email: string): Promise<UserEidolon> {
    const userId = this.emailIndex.get(email);
    if (!userId) {
      throw new OmenError("用户不存在", {
        code: 404,
        status: "error",
        message: `邮箱 ${email} 对应的用户不存在`,
        signal: "user_not_found"
      });
    }
    return this.findById(userId);
  }

  async create(username: string, email: string, age: number): Promise<UserEidolon> {
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

    if (this.emailIndex.has(email)) {
      throw new OmenError("邮箱已存在", {
        code: 409,
        status: "error",
        message: `邮箱 ${email} 已被使用`,
        signal: "email_exists"
      });
    }

    const id = Date.now().toString();
    const now = new Date().toISOString();
    const user: UserEidolon = {
      id,
      username,
      email,
      age,
      createdAt: now,
      updatedAt: now
    };

    this.users.set(id, user);
    this.emailIndex.set(email, id);
    
    return { ...user };
  }

  async update(id: string, data: Partial<UserEidolon>): Promise<UserEidolon> {
    const user = await this.findById(id);
    
    // 如果更新邮箱，需要检查重复
    if (data.email && data.email !== user.email) {
      if (this.emailIndex.has(data.email)) {
        throw new OmenError("邮箱已存在", {
          code: 409,
          status: "error",
          message: `邮箱 ${data.email} 已被使用`,
          signal: "email_exists"
        });
      }
      // 更新邮箱索引
      this.emailIndex.delete(user.email);
      this.emailIndex.set(data.email, id);
    }

    const updated = {
      ...user,
      ...data,
      id, // 确保 ID 不被修改
      updatedAt: new Date().toISOString()
    };

    this.users.set(id, updated);
    return { ...updated };
  }

  async delete(id: string): Promise<void> {
    const user = await this.findById(id);
    this.users.delete(id);
    this.emailIndex.delete(user.email);
  }

  async search(
    query: string,
    filters: { minAge?: number; maxAge?: number; hasProfile?: boolean },
    pagination: { page: number; size: number }
  ): Promise<UserEidolon[]> {
    let results = Array.from(this.users.values());

    // 关键词过滤
    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(user => 
        user.username.toLowerCase().includes(lowerQuery) ||
        user.email.toLowerCase().includes(lowerQuery) ||
        (user.profile?.firstName && user.profile.firstName.toLowerCase().includes(lowerQuery)) ||
        (user.profile?.lastName && user.profile.lastName.toLowerCase().includes(lowerQuery))
      );
    }

    // 年龄过滤
    if (filters.minAge !== undefined) {
      results = results.filter(user => user.age >= filters.minAge!);
    }
    if (filters.maxAge !== undefined) {
      results = results.filter(user => user.age <= filters.maxAge!);
    }

    // 是否有个人资料过滤
    if (filters.hasProfile !== undefined) {
      results = results.filter(user => 
        filters.hasProfile ? !!user.profile : !user.profile
      );
    }

    // 分页
    const start = pagination.page * pagination.size;
    const end = start + pagination.size;

    return results.slice(start, end).map(user => ({ ...user }));
  }

  async updateProfile(
    userId: string,
    profile: Partial<UserEidolon['profile']>,
    notify: boolean = false
  ): Promise<UserEidolon> {
    const user = await this.findById(userId);
    
    const updatedProfile = {
      firstName: user.profile?.firstName || '',
      lastName: user.profile?.lastName || '',
      avatar: user.profile?.avatar,
      ...profile
    };

    const updated = await this.update(userId, { profile: updatedProfile });

    if (notify) {
      console.log(`📧 发送资料更新通知给 ${user.email}`);
    }

    return updated;
  }

  async getStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    averageAge: number;
  }> {
    const users = Array.from(this.users.values());
    const totalUsers = users.length;
    const activeUsers = users.filter(user => !!user.profile).length;
    const averageAge = users.reduce((sum, user) => sum + user.age, 0) / totalUsers;

    return {
      totalUsers,
      activeUsers,
      averageAge: Math.round(averageAge * 100) / 100
    };
  }
}

class PostSeekerService implements PostSeeker, SeekerImplementation {
  private posts = new Map<string, PostEidolon>();
  private tagIndex = new Map<string, Set<string>>(); // tag -> postIds

  async findById(id: string): Promise<PostEidolon> {
    const post = this.posts.get(id);
    if (!post) {
      throw new OmenError("文章不存在", {
        code: 404,
        status: "error",
        message: `文章 ${id} 不存在`,
        signal: "post_not_found"
      });
    }
    return { ...post };
  }

  async findByAuthor(authorId: string): Promise<PostEidolon[]> {
    return Array.from(this.posts.values())
      .filter(post => post.authorId === authorId)
      .map(post => ({ ...post }));
  }

  async create(
    title: string,
    content: string,
    authorId: string,
    tags: string[]
  ): Promise<PostEidolon> {
    const id = Date.now().toString();
    const post: PostEidolon = {
      id,
      title,
      content,
      authorId,
      tags,
      published: false,
      createdAt: new Date().toISOString()
    };

    this.posts.set(id, post);
    
    // 更新标签索引
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(id);
    }

    return { ...post };
  }

  async publish(id: string): Promise<PostEidolon> {
    const post = await this.findById(id);
    post.published = true;
    this.posts.set(id, post);
    return { ...post };
  }

  async searchByTag(tag: string): Promise<PostEidolon[]> {
    const postIds = this.tagIndex.get(tag) || new Set();
    return Array.from(postIds)
      .map(id => this.posts.get(id)!)
      .filter(post => post.published) // 只返回已发布的
      .map(post => ({ ...post }));
  }
}

// ================================
// 🧪 真实使用场景测试
// ================================

Deno.test("🏢 真实场景：用户管理系统", async () => {
  // 🔧 设置服务
  const router = new Router();
  const userSeeker = new UserSeekerService();
  const postSeeker = new PostSeekerService();

  setupWhisperRoutes(router, {
    "User": userSeeker,
    "Post": postSeeker
  });

  console.log("✅ 用户管理系统 Whisper 服务已启动");
});

Deno.test("👤 用户 CRUD 完整流程", async () => {
  const userSeeker = new UserSeekerService();

  // 1. 查找现有用户
  const existingUser = await userSeeker.findById("1");
  assertEquals(existingUser.username, "玲珑");
  assertEquals(existingUser.email, "lingling@example.com");

  // 2. 通过邮箱查找
  const userByEmail = await userSeeker.findByEmail("akane@example.com");
  assertEquals(userByEmail.username, "茜茜");

  // 3. 创建新用户
  const newUser = await userSeeker.create("新用户", "newuser@test.com", 28);
  assert(newUser.id);
  assertEquals(newUser.username, "新用户");
  assert(newUser.createdAt);
  assert(newUser.updatedAt);

  // 4. 更新用户信息
  const updated = await userSeeker.update(newUser.id!, { age: 29 });
  assertEquals(updated.age, 29);
  assert(updated.updatedAt, "应该有更新时间");
  assert(newUser.updatedAt, "应该有创建时间");
  assert(updated.updatedAt >= newUser.updatedAt, "更新时间应该不早于创建时间");

  // 5. 更新用户个人资料
  const withProfile = await userSeeker.updateProfile(newUser.id!, {
    firstName: "新",
    lastName: "用户",
    avatar: "new-avatar.jpg"
  }, true);
  assertEquals(withProfile.profile?.firstName, "新");
  assertEquals(withProfile.profile?.lastName, "用户");

  // 6. 删除用户
  await userSeeker.delete(newUser.id!);
  
  // 验证删除成功
  try {
    await userSeeker.findById(newUser.id!);
    assert(false, "应该抛出用户不存在异常");
  } catch (error: any) {
    assertEquals(error.name, "OmenError");
    assertEquals(error.omen.signal, "user_not_found");
  }
});

Deno.test("🔍 用户搜索和过滤", async () => {
  const userSeeker = new UserSeekerService();

  // 1. 关键词搜索
  const searchResults = await userSeeker.search("玲", {}, { page: 0, size: 10 });
  assertEquals(searchResults.length, 1);
  assertEquals(searchResults[0].username, "玲珑");

  // 2. 年龄过滤
  const ageResults = await userSeeker.search("", { minAge: 25, maxAge: 30 }, { page: 0, size: 10 });
  assert(ageResults.length >= 2);
  assert(ageResults.every(user => user.age >= 25 && user.age <= 30));

  // 3. 是否有个人资料过滤
  const profileResults = await userSeeker.search("", { hasProfile: true }, { page: 0, size: 10 });
  assert(profileResults.every(user => !!user.profile));

  // 4. 分页测试
  const page1 = await userSeeker.search("", {}, { page: 0, size: 2 });
  const page2 = await userSeeker.search("", {}, { page: 1, size: 2 });
  assertEquals(page1.length, 2);
  assert(page2.length >= 0);
  
  // 确保分页结果不重复
  const page1Ids = page1.map(u => u.id);
  const page2Ids = page2.map(u => u.id);
  const intersection = page1Ids.filter(id => page2Ids.includes(id));
  assertEquals(intersection.length, 0);
});

Deno.test("📊 统计信息", async () => {
  const userSeeker = new UserSeekerService();
  
  const stats = await userSeeker.getStats();
  
  assertEquals(stats.totalUsers, 3);
  assertEquals(stats.activeUsers, 2); // 有 profile 的用户
  assert(stats.averageAge > 0);
  
  console.log(`📊 用户统计: 总数 ${stats.totalUsers}, 活跃 ${stats.activeUsers}, 平均年龄 ${stats.averageAge}`);
});

Deno.test("🚨 业务异常处理", async () => {
  const userSeeker = new UserSeekerService();

  // 1. 测试年龄验证
  try {
    await userSeeker.create("测试", "test@invalid.com", -1);
    assert(false, "应该抛出年龄无效异常");
  } catch (error: any) {
    assertEquals(error.name, "OmenError");
    assertEquals(error.omen.code, 400);
    assertEquals(error.omen.signal, "invalid_age");
  }

  // 2. 测试邮箱格式验证
  try {
    await userSeeker.create("测试", "invalid-email", 25);
    assert(false, "应该抛出邮箱格式异常");
  } catch (error: any) {
    assertEquals(error.name, "OmenError");
    assertEquals(error.omen.signal, "invalid_email");
  }

  // 3. 测试邮箱重复
  try {
    await userSeeker.create("重复", "lingling@example.com", 25);
    assert(false, "应该抛出邮箱重复异常");
  } catch (error: any) {
    assertEquals(error.name, "OmenError");
    assertEquals(error.omen.code, 409);
    assertEquals(error.omen.signal, "email_exists");
  }

  // 4. 测试用户不存在
  try {
    await userSeeker.findById("999");
    assert(false, "应该抛出用户不存在异常");
  } catch (error: any) {
    assertEquals(error.name, "OmenError");
    assertEquals(error.omen.code, 404);
    assertEquals(error.omen.signal, "user_not_found");
  }
});

Deno.test("📝 文章管理功能", async () => {
  const postSeeker = new PostSeekerService();

  // 1. 创建文章
  const post = await postSeeker.create(
    "我的第一篇文章",
    "这是文章内容...",
    "1", // 玲珑的 ID
    ["技术", "分享"]
  );
  
  assert(post.id);
  assertEquals(post.title, "我的第一篇文章");
  assertEquals(post.published, false);
  assertEquals(post.tags.length, 2);

  // 2. 发布文章
  const published = await postSeeker.publish(post.id!);
  assertEquals(published.published, true);

  // 3. 按作者查找
  const userPosts = await postSeeker.findByAuthor("1");
  assertEquals(userPosts.length, 1);
  assertEquals(userPosts[0].title, "我的第一篇文章");

  // 4. 按标签搜索
  const techPosts = await postSeeker.searchByTag("技术");
  assertEquals(techPosts.length, 1);
  assertEquals(techPosts[0].published, true);
});

console.log("🎯 Whisper 后端框架使用示例测试完成！"); 