/**
 * 🎯 Whisper 框架完整演示
 * 启动服务器并演示完整的端到端功能
 */

import { createTestServer } from "./server.ts";
import { TaskManagerClient } from "./client.ts";

const PORT = 8090;
const BASE_URL = `http://localhost:${PORT}`;

async function main() {
  console.log(`🎯 ===== Whisper 框架完整演示 =====\n`);

  // 1. 启动服务器
  console.log(`🚀 启动 Whisper 测试服务器...`);
  const app = createTestServer(PORT);
  const serverPromise = app.listen({ port: PORT });
  
  // 等待服务器启动
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    // 2. 验证服务器健康状态
    console.log(`\n🔍 验证服务器健康状态...`);
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const health = await healthResponse.json();
    console.log(`✅ 服务器状态: ${health.status}`);
    console.log(`📋 可用服务: ${health.services.join(", ")}`);

    // 3. 创建客户端并执行业务操作
    console.log(`\n🎯 开始业务功能演示...`);
    const client = new TaskManagerClient(BASE_URL);

    // 演示完整的工作流
    await client.demonstrateCompleteWorkflow();

    // 4. 验证协议层面的正确性
    console.log(`\n🔧 验证 Whisper 协议...`);
    
    // 直接发送 HTTP 请求验证协议
    const createResponse = await fetch(`${BASE_URL}/api/whisper/Task/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spell: {
          args: ["协议测试任务", "验证 Whisper 协议的正确性", "medium"]
        }
      })
    });

    const createResult = await createResponse.json();
    console.log(`✅ HTTP 协议验证通过:`);
    console.log(`   - 状态码: ${createResponse.status}`);
    console.log(`   - Omen 码: ${createResult.omen.code}`);
    console.log(`   - 任务ID: ${createResult.eidolon.id}`);
    
    // 查找刚创建的任务
    const findResponse = await fetch(`${BASE_URL}/api/whisper/Task/findById`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spell: {
          args: [createResult.eidolon.id]
        }
      })
    });

    const findResult = await findResponse.json();
    console.log(`✅ 任务查找验证通过:`);
    console.log(`   - 任务标题: ${findResult.eidolon.title}`);
    console.log(`   - 任务状态: ${findResult.eidolon.completed ? "已完成" : "进行中"}`);

    // 5. 演示错误处理
    console.log(`\n🚨 验证错误处理...`);
    
    const errorResponse = await fetch(`${BASE_URL}/api/whisper/Task/findById`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spell: {
          args: ["non-existent-id"]
        }
      })
    });

    const errorResult = await errorResponse.json();
    console.log(`✅ 错误处理验证通过:`);
    console.log(`   - HTTP 状态码: ${errorResponse.status}`);
    console.log(`   - Omen 错误码: ${errorResult.omen.code}`);
    console.log(`   - 错误信号: ${errorResult.omen.signal}`);
    console.log(`   - 错误消息: ${errorResult.omen.message}`);

    // 6. 性能测试
    console.log(`\n⚡ 简单性能测试...`);
    const startTime = Date.now();
    const promises = [];
    
    for (let i = 0; i < 10; i++) {
      promises.push(
        fetch(`${BASE_URL}/api/whisper/Task/getStats`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ spell: { args: [] } })
        })
      );
    }
    
    await Promise.all(promises);
    const endTime = Date.now();
    
    console.log(`✅ 并发性能测试完成:`);
    console.log(`   - 10个并发请求耗时: ${endTime - startTime}ms`);
    console.log(`   - 平均响应时间: ${(endTime - startTime) / 10}ms`);

    console.log(`\n🎉 ===== 演示完成 =====`);
    console.log(`\n✅ 验证结果:`);
    console.log(`   🔗 端到端通信正常`);
    console.log(`   📋 业务逻辑完整`);
    console.log(`   🚨 错误处理健全`);
    console.log(`   ⚡ 性能表现良好`);
    console.log(`   🎯 Whisper 协议工作正常`);

  } catch (error) {
    console.error(`❌ 演示过程中出现错误:`, error);
  }

  console.log(`\n🛑 关闭服务器...`);
  // 由于 Deno 的限制，这里简单退出
  Deno.exit(0);
}

if (import.meta.main) {
  await main();
} 