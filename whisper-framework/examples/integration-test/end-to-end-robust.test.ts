/**
 * 🎯 Whisper 框架端到端集成测试 (健壮版本)
 * 真实 HTTP 通信，无 Mock，完整验证前后端集成
 * 这个版本避免了硬编码的期望值，更加健壮
 */

import { assertEquals, assert, assertRejects } from "jsr:@std/assert@1";
import { createTestServer } from "./server.ts";
import { TaskManagerClient, quickIntegrationTest } from "./client.ts";

// 测试服务器配置
const TEST_PORT = 8082;
const TEST_BASE_URL = `http://localhost:${TEST_PORT}`;

// 全局测试服务器实例
let testServer: any = null;
let serverController: AbortController | null = null;

// ================================
// 🧪 测试辅助函数
// ================================

async function startTestServer(): Promise<void> {
  console.log("🚀 启动测试服务器...");
  
  const app = createTestServer(TEST_PORT);
  serverController = new AbortController();
  
  // 启动服务器（非阻塞）
  testServer = app.listen({ 
    port: TEST_PORT,
    signal: serverController.signal 
  });
  
  // 等待服务器启动
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log(`✅ 测试服务器已启动在端口 ${TEST_PORT}`);
}

async function stopTestServer(): Promise<void> {
  if (serverController) {
    console.log("🛑 停止测试服务器...");
    serverController.abort();
    serverController = null;
    testServer = null;
    // 等待服务器关闭
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log("✅ 测试服务器已停止");
  }
}

async function waitForServer(): Promise<void> {
  const maxRetries = 10;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const response = await fetch(`${TEST_BASE_URL}/health`);
      if (response.ok) {
        console.log("✅ 服务器健康检查通过");
        return;
      }
    } catch (error) {
      // 服务器还没准备好
    }
    
    retries++;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  throw new Error("服务器启动超时");
}

// ================================
// 🧪 集成测试套件
// ================================

Deno.test({
  name: "🚀 服务器启动和健康检查",
  async fn() {
    await startTestServer();
    await waitForServer();
    
    // 验证健康检查端点
    const response = await fetch(`${TEST_BASE_URL}/health`);
    assertEquals(response.status, 200);
    
    const health = await response.json();
    assertEquals(health.status, "ok");
    assert(health.timestamp);
    assert(Array.isArray(health.services));
    assert(health.services.includes("Task"));
    assert(health.services.includes("Project"));
  },
  sanitizeOps: false,
  sanitizeResources: false
});

Deno.test({
  name: "🔗 基础连通性测试",
  async fn() {
    const success = await quickIntegrationTest(TEST_BASE_URL);
    assert(success, "快速集成测试应该成功");
  },
  sanitizeOps: false,
  sanitizeResources: false
});

Deno.test({
  name: "📋 任务管理 CRUD 完整流程",
  async fn() {
    const client = new TaskManagerClient(TEST_BASE_URL);
    
    // 1. 创建任务
    const task = await client.createTask(
      "集成测试任务",
      "验证 CRUD 操作的完整性",
      "high"
    );
    
    assert(task.id, "任务应该有 ID");
    assertEquals(task.title, "集成测试任务");
    assertEquals(task.completed, false);
    assertEquals(task.priority, "high");
    assert(task.createdAt, "任务应该有创建时间");
    
    // 2. 查找任务
    const foundTask = await client.getTask(task.id!);
    assertEquals(foundTask.id, task.id);
    assertEquals(foundTask.title, task.title);
    
    // 3. 更新任务
    const updatedTask = await client.updateTask(task.id!, {
      description: "更新后的描述",
      priority: "medium"
    });
    assertEquals(updatedTask.description, "更新后的描述");
    assertEquals(updatedTask.priority, "medium");
    assert(updatedTask.updatedAt !== task.updatedAt, "更新时间应该改变");
    
    // 4. 完成任务
    const completedTask = await client.completeTask(task.id!);
    assertEquals(completedTask.completed, true);
    
    // 5. 添加标签
    const taggedTask = await client.addTaskTags(task.id!, ["测试", "集成", "重要"]);
    assertEquals(taggedTask.tags.length, 3);
    assert(taggedTask.tags.includes("测试"));
    assert(taggedTask.tags.includes("集成"));
    assert(taggedTask.tags.includes("重要"));
    
    // 6. 删除任务
    await client.deleteTask(task.id!);
    
    // 7. 验证删除成功
    await assertRejects(
      () => client.getTask(task.id!),
      Error
    );
  },
  sanitizeOps: false,
  sanitizeResources: false
});

Deno.test({
  name: "🔍 任务搜索和过滤功能",
  async fn() {
    const client = new TaskManagerClient(TEST_BASE_URL);
    
    // 重置测试数据到初始状态
    await client.resetTestData();
    
    // 获取初始状态
    const initialStats = await client.getTaskStats();
    
    // 创建测试数据
    const tasks = [
      await client.createTask("前端开发测试", "开发用户界面", "high"),
      await client.createTask("后端开发测试", "开发API接口", "high"),
      await client.createTask("测试工作测试", "编写单元测试", "medium"),
      await client.createTask("文档编写测试", "编写用户文档", "low")
    ];
    
    // 添加标签
    await client.addTaskTags(tasks[0].id!, ["前端", "UI", "测试"]);
    await client.addTaskTags(tasks[1].id!, ["后端", "API", "测试"]);
    await client.addTaskTags(tasks[2].id!, ["测试", "质量"]);
    
    // 完成部分任务
    await client.completeTask(tasks[0].id!);
    await client.completeTask(tasks[2].id!);
    
    try {
      // 1. 关键词搜索
      const frontendTasks = await client.searchTasks("前端");
      assert(frontendTasks.length >= 1, "应该找到至少一个前端任务");
      assert(frontendTasks.some(t => t.title.includes("前端")), "结果应该包含前端相关任务");
      
      // 2. 优先级过滤
      const highPriorityTasks = await client.searchTasks("", { priority: "high" });
      assert(highPriorityTasks.length >= 2, "应该找到至少两个高优先级任务");
      assert(highPriorityTasks.every(t => t.priority === "high"), "所有结果都应该是高优先级");
      
      // 3. 完成状态过滤
      const completedTasks = await client.searchTasks("", { completed: true });
      const initialCompleted = completedTasks.filter(t => tasks.some(task => task.id === t.id)).length;
      assertEquals(initialCompleted, 2, "应该有两个测试任务被完成");
      
      const incompleteTasks = await client.searchTasks("", { completed: false });
      const initialIncomplete = incompleteTasks.filter(t => tasks.some(task => task.id === t.id)).length;
      assertEquals(initialIncomplete, 2, "应该有两个测试任务未完成");
      
      // 4. 分页测试
      const allTestTasks = await client.searchTasks("测试");
      const page1 = await client.searchTasks("测试", {}, { page: 0, size: 2 });
      assert(page1.length <= 2, "第一页结果不应超过2个");
      assert(page1.length > 0, "第一页应该有结果");
      
      // 5. 标签搜索
      const uiTasks = await client.taskSeeker.searchByTag("UI");
      assert(uiTasks.length >= 1, "应该找到至少一个UI标签的任务");
      assert(uiTasks.some(t => t.title.includes("前端")), "UI任务应该包含前端开发任务");
      
    } finally {
      // 清理测试数据
      for (const task of tasks) {
        try {
          await client.deleteTask(task.id!);
        } catch (error) {
          // 可能已经被删除
        }
      }
    }
  },
  sanitizeOps: false,
  sanitizeResources: false
});

Deno.test({
  name: "🏗️ 项目管理功能测试",
  async fn() {
    const client = new TaskManagerClient(TEST_BASE_URL);
    
    // 获取初始项目数量
    const initialProjects = await client.getAllProjects();
    const initialCount = initialProjects.length;
    
    // 1. 创建项目
    const project = await client.createProject(
      "集成测试项目",
      "用于测试项目管理功能"
    );
    
    assert(project.id, "项目应该有 ID");
    assertEquals(project.name, "集成测试项目");
    assertEquals(project.status, "planning");
    assertEquals(project.taskCount, 0);
    
    try {
      // 2. 查找项目
      const foundProject = await client.getProject(project.id!);
      assertEquals(foundProject.id, project.id);
      assertEquals(foundProject.name, project.name);
      
      // 3. 更新项目状态
      const activeProject = await client.updateProjectStatus(project.id!, "active");
      assertEquals(activeProject.status, "active");
      
      const completedProject = await client.updateProjectStatus(project.id!, "completed");
      assertEquals(completedProject.status, "completed");
      
      // 4. 获取所有项目
      const allProjects = await client.getAllProjects();
      assert(allProjects.length === initialCount + 1, `项目总数应该增加1个，期望 ${initialCount + 1}，实际 ${allProjects.length}`);
      const testProject = allProjects.find(p => p.id === project.id);
      assert(testProject, "应该能在项目列表中找到测试项目");
      
    } finally {
      // 注意：这里没有删除方法，项目会保留
      console.log(`测试项目 ${project.id} 已保留`);
    }
  },
  sanitizeOps: false,
  sanitizeResources: false
});

Deno.test({
  name: "📊 任务统计功能测试",
  async fn() {
    const client = new TaskManagerClient(TEST_BASE_URL);
    
    // 重置测试数据到初始状态
    await client.resetTestData();
    
    // 获取初始统计
    const initialStats = await client.getTaskStats();
    
    // 创建测试任务
    const tasks = [
      await client.createTask("高优先级任务1", "描述", "high"),
      await client.createTask("高优先级任务2", "描述", "high"),
      await client.createTask("中优先级任务", "描述", "medium"),
      await client.createTask("低优先级任务", "描述", "low")
    ];
    
    // 完成部分任务
    await client.completeTask(tasks[0].id!);
    await client.completeTask(tasks[2].id!);
    
    try {
      // 获取更新后的统计
      const stats = await client.getTaskStats();
      
      // 验证总数增加
      assertEquals(stats.total, initialStats.total + 4, "任务总数应该增加4个");
      assertEquals(stats.completed, initialStats.completed + 2, "完成任务数应该增加2个");
      
      // 验证按优先级统计（考虑初始数据）
      const priorityDiff = {
        high: stats.byPriority.high - (initialStats.byPriority.high || 0),
        medium: stats.byPriority.medium - (initialStats.byPriority.medium || 0),
        low: stats.byPriority.low - (initialStats.byPriority.low || 0)
      };
      
      assertEquals(priorityDiff.high, 2, "高优先级任务应该增加2个");
      assertEquals(priorityDiff.medium, 1, "中优先级任务应该增加1个");
      assertEquals(priorityDiff.low, 1, "低优先级任务应该增加1个");
      
    } finally {
      // 清理测试数据
      for (const task of tasks) {
        try {
          await client.deleteTask(task.id!);
        } catch (error) {
          // 可能已经被删除
        }
      }
    }
  },
  sanitizeOps: false,
  sanitizeResources: false
});

Deno.test({
  name: "🔗 复合操作和工作流测试",
  async fn() {
    const client = new TaskManagerClient(TEST_BASE_URL);
    
    // 1. 创建项目
    const project = await client.createProject(
      "工作流测试项目",
      "测试复合操作和完整工作流"
    );
    
    try {
      // 2. 在项目中创建任务
      const { task } = await client.createTaskInProject(
        project.id!,
        "项目任务",
        "在项目中创建的任务",
        "high"
      );
      
      assert(task.id, "任务应该被创建");
      
      // 验证复合操作的结果 - 重新获取任务以确保标签已更新
      const taskWithTags = await client.getTask(task.id!);
      assert(taskWithTags.tags.some(tag => tag.includes(project.name)), "任务应该包含项目标签");
      
      // 3. 验证复合操作的结果
      const updatedTask = await client.getTask(task.id!);
      assertEquals(updatedTask.title, "项目任务");
      assert(updatedTask.tags.length > 0, "任务应该有标签");
      
      // 清理任务
      await client.deleteTask(task.id!);
      
    } finally {
      // 项目会保留，因为没有删除方法
      console.log(`工作流测试项目 ${project.id} 已保留`);
    }
  },
  sanitizeOps: false,
  sanitizeResources: false
});

Deno.test({
  name: "🚨 错误处理和异常测试",
  async fn() {
    const client = new TaskManagerClient(TEST_BASE_URL);
    
    // 1. 测试找不到的任务
    await assertRejects(
      () => client.getTask("non-existent-id"),
      Error
    );
    
    // 2. 测试找不到的项目
    await assertRejects(
      () => client.getProject("non-existent-id"),
      Error
    );
    
    // 3. 测试创建无效任务（空标题）
    await assertRejects(
      () => client.createTask("", "描述", "high"),
      Error
    );
    
    // 4. 测试删除不存在的任务
    await assertRejects(
      () => client.deleteTask("non-existent-id"),
      Error
    );
    
    console.log("✅ 所有错误处理测试通过");
  },
  sanitizeOps: false,
  sanitizeResources: false
});

Deno.test({
  name: "🎯 完整工作流演示测试",
  async fn() {
    const client = new TaskManagerClient(TEST_BASE_URL);
    
    // 执行完整的工作流演示
    // 这会测试所有功能的组合使用
    await client.demonstrateCompleteWorkflow();
    
    console.log("✅ 完整工作流演示测试通过");
  },
  sanitizeOps: false,
  sanitizeResources: false
});

Deno.test({
  name: "🛑 关闭测试服务器",
  async fn() {
    await stopTestServer();
    console.log("✅ 测试清理完成");
  },
  sanitizeOps: false,
  sanitizeResources: false
});

console.log(`
🎯 ===== Whisper 框架端到端集成测试 (健壮版本) =====

这个版本的测试更加健壮，避免了硬编码的期望值：
✅ 真实 HTTP 服务器启动和健康检查
✅ 前端到后端的完整通信
✅ Whisper 协议的正确实现
✅ 业务逻辑的端到端执行
✅ CRUD 操作的完整性
✅ 搜索和过滤功能（相对验证）
✅ 复合操作和工作流
✅ 错误处理和异常管理
✅ 统计和聚合功能（增量验证）

🔧 运行方式：
deno test whisper-framework/examples/integration-test/end-to-end-robust.test.ts --allow-all --no-check

🎉 ===== 测试说明完成 =====
`); 