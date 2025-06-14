/**
 * 🎯 Whisper 集成测试 - 真实后端服务器
 * 这是一个完整的后端实现，用于验证端到端通信
 */

import { Application, Router } from "oak/mod.ts";
import { setupWhisperRoutes } from "../../backend/core/factory.ts";
import type { SeekerImplementation } from "../../backend/types/backend.ts";
import type { Seeker } from "../../types/core.ts";
import { OmenError } from "../../types/core.ts";

// ================================
// 🔮 业务实体定义
// ================================

interface TaskEidolon {
  id?: string;
  title: string;
  description: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface ProjectEidolon {
  id?: string;
  name: string;
  description: string;
  status: "planning" | "active" | "completed";
  taskCount: number;
  createdAt?: string;
}

// ================================
// 🙏 Seeker 接口定义
// ================================

interface TaskSeeker extends Seeker<TaskEidolon> {
  // 测试辅助方法
  initTestData(): Promise<void>;

  // 基础 CRUD
  findById(id: string): Promise<TaskEidolon>;
  create(
    title: string,
    description: string,
    priority: "low" | "medium" | "high",
  ): Promise<TaskEidolon>;
  update(id: string, data: Partial<TaskEidolon>): Promise<TaskEidolon>;
  delete(id: string): Promise<void>;

  // 业务方法
  complete(id: string): Promise<TaskEidolon>;
  addTags(id: string, tags: string[]): Promise<TaskEidolon>;
  searchByTag(tag: string): Promise<TaskEidolon[]>;

  // 复杂查询
  search(
    query: string,
    filters: {
      completed?: boolean;
      priority?: "low" | "medium" | "high";
      tags?: string[];
    },
    pagination: { page: number; size: number },
  ): Promise<TaskEidolon[]>;

  // 统计方法
  getStats(): Promise<{
    total: number;
    completed: number;
    byPriority: Record<string, number>;
  }>;
}

interface ProjectSeeker extends Seeker<ProjectEidolon> {
  // 测试辅助方法
  initTestData(): Promise<void>;

  findById(id: string): Promise<ProjectEidolon>;
  create(name: string, description: string): Promise<ProjectEidolon>;
  updateStatus(id: string, status: "planning" | "active" | "completed"): Promise<ProjectEidolon>;
  getAll(): Promise<ProjectEidolon[]>;
}

// ================================
// 🎯 业务服务实现
// ================================

class TaskSeekerService implements TaskSeeker, SeekerImplementation {
  private tasks = new Map<string, TaskEidolon>();
  private tagIndex = new Map<string, Set<string>>(); // tag -> taskIds

  constructor() {
    this.initTestData();
  }

  async initTestData(): Promise<void> {
    // 清空现有数据
    this.tasks.clear();
    this.tagIndex.clear();
    const tasks = [
      {
        id: "1",
        title: "设计用户界面",
        description: "为新功能设计直观的用户界面",
        completed: false,
        priority: "high" as const,
        tags: ["设计", "UI", "前端"],
        createdAt: "2024-01-01T10:00:00Z",
        updatedAt: "2024-01-01T10:00:00Z",
      },
      {
        id: "2",
        title: "实现后端API",
        description: "根据接口文档实现RESTful API",
        completed: true,
        priority: "high" as const,
        tags: ["后端", "API", "开发"],
        createdAt: "2024-01-01T11:00:00Z",
        updatedAt: "2024-01-02T15:30:00Z",
      },
      {
        id: "3",
        title: "编写单元测试",
        description: "为核心业务逻辑编写单元测试",
        completed: false,
        priority: "medium" as const,
        tags: ["测试", "质量保证"],
        createdAt: "2024-01-01T12:00:00Z",
        updatedAt: "2024-01-01T12:00:00Z",
      },
    ];

    for (const task of tasks) {
      this.tasks.set(task.id, task);

      // 构建标签索引
      for (const tag of task.tags) {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
        }
        this.tagIndex.get(tag)!.add(task.id);
      }
    }
  }

  async findById(id: string): Promise<TaskEidolon> {
    const task = this.tasks.get(id);
    if (!task) {
      throw new OmenError("任务不存在", {
        code: 404,
        status: "error",
        message: `任务 ${id} 不存在`,
        signal: "task_not_found",
      });
    }
    return { ...task };
  }

  async create(
    title: string,
    description: string,
    priority: "low" | "medium" | "high",
  ): Promise<TaskEidolon> {
    if (!title.trim()) {
      throw new OmenError("标题不能为空", {
        code: 400,
        status: "error",
        message: "任务标题不能为空",
        signal: "invalid_title",
      });
    }

    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const task: TaskEidolon = {
      id,
      title,
      description,
      completed: false,
      priority,
      tags: [],
      createdAt: now,
      updatedAt: now,
    };

    this.tasks.set(id, task);
    return { ...task };
  }

  async update(id: string, data: Partial<TaskEidolon>): Promise<TaskEidolon> {
    const task = await this.findById(id);

    const updated = {
      ...task,
      ...data,
      id, // 确保ID不被修改
      updatedAt: new Date().toISOString(),
    };

    // 如果更新了标签，需要更新索引
    if (data.tags) {
      // 从旧标签中移除
      for (const oldTag of task.tags) {
        this.tagIndex.get(oldTag)?.delete(id);
      }

      // 添加到新标签
      for (const newTag of data.tags) {
        if (!this.tagIndex.has(newTag)) {
          this.tagIndex.set(newTag, new Set());
        }
        this.tagIndex.get(newTag)!.add(id);
      }
    }

    this.tasks.set(id, updated);
    return { ...updated };
  }

  async delete(id: string): Promise<void> {
    const task = await this.findById(id);

    // 从标签索引中移除
    for (const tag of task.tags) {
      this.tagIndex.get(tag)?.delete(id);
    }

    this.tasks.delete(id);
  }

  async complete(id: string): Promise<TaskEidolon> {
    return this.update(id, { completed: true });
  }

  async addTags(id: string, tags: string[]): Promise<TaskEidolon> {
    const task = await this.findById(id);
    const uniqueTags = Array.from(new Set([...task.tags, ...tags]));
    return this.update(id, { tags: uniqueTags });
  }

  async searchByTag(tag: string): Promise<TaskEidolon[]> {
    const taskIds = this.tagIndex.get(tag) || new Set();
    return Array.from(taskIds)
      .map((id) => this.tasks.get(id)!)
      .map((task) => ({ ...task }));
  }

  async search(
    query: string,
    filters: {
      completed?: boolean;
      priority?: "low" | "medium" | "high";
      tags?: string[];
    },
    pagination: { page: number; size: number },
  ): Promise<TaskEidolon[]> {
    let results = Array.from(this.tasks.values());

    // 关键词过滤
    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter((task) =>
        task.title.toLowerCase().includes(lowerQuery) ||
        task.description.toLowerCase().includes(lowerQuery)
      );
    }

    // 完成状态过滤
    if (filters.completed !== undefined) {
      results = results.filter((task) => task.completed === filters.completed);
    }

    // 优先级过滤
    if (filters.priority) {
      results = results.filter((task) => task.priority === filters.priority);
    }

    // 标签过滤
    if (filters.tags && filters.tags.length > 0) {
      results = results.filter((task) => filters.tags!.some((tag) => task.tags.includes(tag)));
    }

    // 分页
    const start = pagination.page * pagination.size;
    const end = start + pagination.size;

    return results.slice(start, end).map((task) => ({ ...task }));
  }

  async getStats(): Promise<{
    total: number;
    completed: number;
    byPriority: Record<string, number>;
  }> {
    const tasks = Array.from(this.tasks.values());
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;

    const byPriority = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, completed, byPriority };
  }
}

class ProjectSeekerService implements ProjectSeeker, SeekerImplementation {
  private projects = new Map<string, ProjectEidolon>();

  constructor() {
    this.initTestData();
  }

  async initTestData(): Promise<void> {
    // 清空现有数据
    this.projects.clear();
    const projects = [
      {
        id: "1",
        name: "Lady Sion",
        description: "智能对话系统项目",
        status: "active" as const,
        taskCount: 15,
        createdAt: "2024-01-01T00:00:00Z",
      },
      {
        id: "2",
        name: "Whisper Framework",
        description: "前后端通信框架",
        status: "active" as const,
        taskCount: 8,
        createdAt: "2024-01-02T00:00:00Z",
      },
    ];

    for (const project of projects) {
      this.projects.set(project.id, project);
    }
  }

  async findById(id: string): Promise<ProjectEidolon> {
    const project = this.projects.get(id);
    if (!project) {
      throw new OmenError("项目不存在", {
        code: 404,
        status: "error",
        message: `项目 ${id} 不存在`,
        signal: "project_not_found",
      });
    }
    return { ...project };
  }

  async create(name: string, description: string): Promise<ProjectEidolon> {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const project: ProjectEidolon = {
      id,
      name,
      description,
      status: "planning",
      taskCount: 0,
      createdAt: new Date().toISOString(),
    };

    this.projects.set(id, project);
    return { ...project };
  }

  async updateStatus(
    id: string,
    status: "planning" | "active" | "completed",
  ): Promise<ProjectEidolon> {
    const project = await this.findById(id);
    const updated = { ...project, status };
    this.projects.set(id, updated);
    return { ...updated };
  }

  async getAll(): Promise<ProjectEidolon[]> {
    return Array.from(this.projects.values()).map((p) => ({ ...p }));
  }
}

// ================================
// 🚀 服务器启动
// ================================

export function createTestServer(port: number = 8080): Application {
  const app = new Application();
  const router = new Router();

  // 创建业务服务实例
  const taskSeeker = new TaskSeekerService();
  const projectSeeker = new ProjectSeekerService();

  // 设置 Whisper 路由
  setupWhisperRoutes(router, {
    "Task": taskSeeker,
    "Project": projectSeeker,
  }, {
    whisperPath: "/api/whisper",
  });

  // 添加 CORS 支持
  app.use(async (ctx, next) => {
    ctx.response.headers.set("Access-Control-Allow-Origin", "*");
    ctx.response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (ctx.request.method === "OPTIONS") {
      ctx.response.status = 200;
      return;
    }

    await next();
  });

  // 健康检查端点
  router.get("/health", (ctx) => {
    ctx.response.body = {
      status: "ok",
      timestamp: new Date().toISOString(),
      services: ["Task", "Project"],
    };
  });

  app.use(router.routes());
  app.use(router.allowedMethods());

  console.log(`🎯 Whisper 集成测试服务器启动在端口 ${port}`);
  console.log(`📋 可用的 Seeker:
  - Task: 任务管理
    - POST /api/whisper/Task/create
    - POST /api/whisper/Task/findById  
    - POST /api/whisper/Task/update
    - POST /api/whisper/Task/complete
    - POST /api/whisper/Task/search
    
  - Project: 项目管理
    - POST /api/whisper/Project/create
    - POST /api/whisper/Project/findById
    - POST /api/whisper/Project/getAll`);

  return app;
}

// 如果直接运行这个文件，启动服务器
if (import.meta.main) {
  const app = createTestServer(8080);
  await app.listen({ port: 8080 });
}
