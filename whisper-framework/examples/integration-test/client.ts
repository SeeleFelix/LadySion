/**
 * 🎯 Whisper 集成测试 - 前端客户端
 * 使用 createSeeker 调用真实的后端服务
 */

import { createSeeker } from "../../index.ts";
import type { Seeker } from "../../types/core.ts";

// ================================
// 🔮 业务实体类型（与后端保持一致）
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
// 🙏 Seeker 接口定义（与后端保持一致）
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
// 🔧 创建 Seeker 实例
// ================================

export function createTestClient(baseUrl: string = "http://localhost:8080") {
  const taskSeeker = createSeeker<TaskSeeker>("Task", {
    baseUrl,
    whisperPath: "/api/whisper",
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  const projectSeeker = createSeeker<ProjectSeeker>("Project", {
    baseUrl,
    whisperPath: "/api/whisper",
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  return { taskSeeker, projectSeeker };
}

// ================================
// 🎯 业务操作示例函数
// ================================

export class TaskManagerClient {
  public taskSeeker: TaskSeeker; // 改为 public 以便测试访问
  public projectSeeker: ProjectSeeker; // 改为 public 以便测试访问

  constructor(baseUrl?: string) {
    const client = createTestClient(baseUrl);
    this.taskSeeker = client.taskSeeker;
    this.projectSeeker = client.projectSeeker;
  }

  // 🔄 测试辅助方法
  async resetTestData(): Promise<void> {
    console.log(`🔄 重置测试数据...`);
    await this.taskSeeker.initTestData();
    await this.projectSeeker.initTestData();
    console.log(`✅ 测试数据重置成功`);
  }

  // 📋 任务管理操作
  async createTask(
    title: string,
    description: string,
    priority: "low" | "medium" | "high",
  ): Promise<TaskEidolon> {
    console.log(`📝 创建任务: ${title}`);
    const task = await this.taskSeeker.create(title, description, priority);
    console.log(`✅ 任务创建成功: ID=${task.id}`);
    return task;
  }

  async getTask(id: string): Promise<TaskEidolon> {
    console.log(`🔍 查找任务: ${id}`);
    const task = await this.taskSeeker.findById(id);
    console.log(`✅ 找到任务: ${task.title}`);
    return task;
  }

  async completeTask(id: string): Promise<TaskEidolon> {
    console.log(`✅ 完成任务: ${id}`);
    const task = await this.taskSeeker.complete(id);
    console.log(`🎉 任务已完成: ${task.title}`);
    return task;
  }

  async addTaskTags(id: string, tags: string[]): Promise<TaskEidolon> {
    console.log(`🏷️ 添加标签到任务 ${id}: ${tags.join(", ")}`);
    const task = await this.taskSeeker.addTags(id, tags);
    console.log(`✅ 标签添加成功: ${task.tags.join(", ")}`);
    return task;
  }

  async searchTasks(
    query: string,
    filters: any = {},
    pagination = { page: 0, size: 10 },
  ): Promise<TaskEidolon[]> {
    console.log(`🔍 搜索任务: "${query}"`);
    const tasks = await this.taskSeeker.search(query, filters, pagination);
    console.log(`✅ 找到 ${tasks.length} 个任务`);
    return tasks;
  }

  async getTaskStats(): Promise<any> {
    console.log(`📊 获取任务统计`);
    const stats = await this.taskSeeker.getStats();
    console.log(`✅ 统计结果: 总计 ${stats.total}, 已完成 ${stats.completed}`);
    return stats;
  }

  async updateTask(id: string, updates: Partial<TaskEidolon>): Promise<TaskEidolon> {
    console.log(`📝 更新任务 ${id}`);
    const task = await this.taskSeeker.update(id, updates);
    console.log(`✅ 任务更新成功: ${task.title}`);
    return task;
  }

  async deleteTask(id: string): Promise<void> {
    console.log(`🗑️ 删除任务: ${id}`);
    await this.taskSeeker.delete(id);
    console.log(`✅ 任务删除成功`);
  }

  // 🏗️ 项目管理操作
  async createProject(name: string, description: string): Promise<ProjectEidolon> {
    console.log(`🏗️ 创建项目: ${name}`);
    const project = await this.projectSeeker.create(name, description);
    console.log(`✅ 项目创建成功: ID=${project.id}`);
    return project;
  }

  async getProject(id: string): Promise<ProjectEidolon> {
    console.log(`🔍 查找项目: ${id}`);
    const project = await this.projectSeeker.findById(id);
    console.log(`✅ 找到项目: ${project.name}`);
    return project;
  }

  async getAllProjects(): Promise<ProjectEidolon[]> {
    console.log(`📋 获取所有项目`);
    const projects = await this.projectSeeker.getAll();
    console.log(`✅ 找到 ${projects.length} 个项目`);
    return projects;
  }

  async updateProjectStatus(
    id: string,
    status: "planning" | "active" | "completed",
  ): Promise<ProjectEidolon> {
    console.log(`🔄 更新项目状态: ${id} -> ${status}`);
    const project = await this.projectSeeker.updateStatus(id, status);
    console.log(`✅ 项目状态更新成功: ${project.name} -> ${project.status}`);
    return project;
  }

  // 🔗 复合操作示例
  async createTaskInProject(
    projectId: string,
    title: string,
    description: string,
    priority: "low" | "medium" | "high",
  ): Promise<{ project: ProjectEidolon; task: TaskEidolon }> {
    console.log(`🔗 在项目 ${projectId} 中创建任务: ${title}`);

    // 1. 验证项目存在
    const project = await this.getProject(projectId);

    // 2. 创建任务
    const task = await this.createTask(title, description, priority);

    // 3. 添加项目标签
    await this.addTaskTags(task.id!, [`项目:${project.name}`]);

    console.log(`✅ 复合操作完成: 任务 ${task.id} 已关联到项目 ${project.name}`);

    return { project, task };
  }

  // 🎯 完整工作流示例
  async demonstrateCompleteWorkflow(): Promise<void> {
    console.log(`\n🎯 ===== 开始完整工作流演示 =====`);

    try {
      // 1. 创建项目
      const project = await this.createProject(
        "Whisper 集成测试项目",
        "演示 Whisper 框架的完整功能",
      );

      // 2. 创建多个任务
      const task1 = await this.createTask(
        "设计系统架构",
        "设计 Whisper 框架的整体架构",
        "high",
      );

      const task2 = await this.createTask(
        "实现核心功能",
        "实现 Seeker 和 Whisper 的核心逻辑",
        "high",
      );

      const task3 = await this.createTask(
        "编写文档",
        "编写详细的使用文档和示例",
        "medium",
      );

      // 3. 添加标签
      await this.addTaskTags(task1.id!, ["架构", "设计", "高优先级"]);
      await this.addTaskTags(task2.id!, ["开发", "核心", "高优先级"]);
      await this.addTaskTags(task3.id!, ["文档", "示例", "中优先级"]);

      // 4. 完成一些任务
      await this.completeTask(task1.id!);
      await this.completeTask(task2.id!);

      // 5. 更新任务描述
      await this.updateTask(task3.id!, {
        description: "编写详细的使用文档、API 文档和最佳实践示例",
        priority: "high",
      });

      // 6. 搜索和统计
      const highPriorityTasks = await this.searchTasks("", { priority: "high" });
      const completedTasks = await this.searchTasks("", { completed: true });
      const stats = await this.getTaskStats();

      // 7. 项目状态管理
      await this.updateProjectStatus(project.id!, "active");
      const allProjects = await this.getAllProjects();

      // 8. 结果汇总
      console.log(`\n📊 工作流完成汇总:`);
      console.log(`- 创建项目: ${project.name}`);
      console.log(`- 高优先级任务: ${highPriorityTasks.length} 个`);
      console.log(`- 已完成任务: ${completedTasks.length} 个`);
      console.log(`- 项目总数: ${allProjects.length} 个`);
      console.log(`- 任务统计: 总计 ${stats.total}, 已完成 ${stats.completed}`);

      console.log(`\n🎉 ===== 工作流演示完成 =====`);
    } catch (error) {
      console.error(`❌ 工作流执行失败:`, error);
      throw error;
    }
  }
}

// ================================
// 🧪 快速测试函数
// ================================

export async function quickIntegrationTest(baseUrl?: string): Promise<boolean> {
  console.log(`🧪 开始快速集成测试...`);

  try {
    const client = new TaskManagerClient(baseUrl);

    // 测试基本连通性
    await client.getTaskStats();
    console.log(`✅ 连通性测试通过`);

    // 测试 CRUD 操作
    const task = await client.createTask("集成测试任务", "验证端到端通信", "low");
    await client.getTask(task.id!);
    await client.deleteTask(task.id!);
    console.log(`✅ CRUD 测试通过`);

    return true;
  } catch (error) {
    console.error(`❌ 集成测试失败:`, error);
    return false;
  }
}

// 如果直接运行这个文件，执行演示
if (import.meta.main) {
  console.log(`🎯 Whisper 框架客户端演示`);

  const client = new TaskManagerClient();

  // 执行快速测试
  const success = await quickIntegrationTest();

  if (success) {
    console.log(`\n🎉 快速测试通过，开始完整演示...`);
    await client.demonstrateCompleteWorkflow();
  } else {
    console.log(`\n❌ 快速测试失败，请检查服务器是否运行`);
    Deno.exit(1);
  }
}
