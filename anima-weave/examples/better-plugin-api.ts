// 理想的插件编写方式示例 - 类型安全版本
// 确保输入输出定义与implement函数签名完全一致

import { definePlugin, node, input, output, type Int, type Bool, type String, type Signal } from "../src/framework/plugin-api.ts";

// ========== 类型定义（可选，框架可以自动推导）==========
interface Prompt {
  id: string;
  name: string;
  content: string;
}

// ========== 插件定义 ==========
export default definePlugin({
  name: "basic",
  version: "1.0.0",
  description: "Basic types and operations",
  
  // ========== 节点实现（只关注业务逻辑）==========
  nodes: {
    
    // 🚀 Start节点：无输入，有输出
    Start: node()
      .inputs({})  // 明确无输入
      .outputs({
        signal: Signal,
        execution_id: String,
      })
      .implement(() => {  // 无参数，因为无输入
        return {
          signal: true,  // 必须返回signal
          execution_id: crypto.randomUUID(),  // 必须返回execution_id
        };
      }),

    // ⏰ GetTimestamp节点：必须使用所有输入，包括trigger
    GetTimestamp: node()
      .inputs({ 
        trigger: Signal 
      })
      .outputs({ 
        timestamp: Int, 
        done: Signal 
      })
      .implement(({ trigger }) => {  // 必须接收trigger参数
        // trigger虽然是控制信号，但也需要在逻辑中体现
        console.log(`收到触发信号: ${trigger}`);
        
        return {
          timestamp: Math.floor(Date.now() / 1000),  // 必须返回
          done: true,  // 必须返回
        };
      }),

    // 🔢 IsEven节点：所有输入都必须使用
    IsEven: node()
      .inputs({ 
        number: Int, 
        trigger: Signal 
      })
      .outputs({ 
        result: Bool, 
        done: Signal 
      })
      .implement(({ number, trigger }) => {  // 必须使用所有输入
        // 即使trigger是控制信号，也要在实现中体现
        if (!trigger) {
          throw new Error("IsEven节点需要trigger信号才能执行");
        }
        
        return {
          result: number % 2 === 0,  // 必须返回result
          done: true,                 // 必须返回done
        };
      }),

    // 📝 FormatNumber节点：严格的输入输出匹配
    FormatNumber: node()
      .inputs({ 
        number: Int, 
        trigger: Signal 
      })
      .outputs({ 
        formatted: String, 
        done: Signal 
      })
      .implement(({ number, trigger }) => {  // 所有输入参数都必须存在
        if (!trigger) {
          return {
            formatted: `未触发时的默认值`,
            done: false,
          };
        }
        
        return {
          formatted: `Number: ${number}`,  // 必须返回formatted
          done: true,                      // 必须返回done
        };
      }),

    // 📋 CreatePrompt节点：复合类型的完整性
    CreatePrompt: node()
      .inputs({ 
        name: String, 
        content: String, 
        trigger: Signal 
      })
      .outputs({ 
        prompt: "Prompt",  
        done: Signal 
      })
      .implement(({ name, content, trigger }): { prompt: Prompt; done: boolean } => {
        // 所有输入都被使用，包括trigger
        if (!trigger) {
          throw new Error("CreatePrompt需要trigger信号");
        }
        
        return {
          prompt: {  // 必须返回完整的prompt对象
            id: crypto.randomUUID(),
            name,
            content,
          },
          done: true,  // 必须返回done
        };
      }),
  },

  // ========== 自定义类型（可选）==========
  types: {
    Prompt: {
      id: String,
      name: String, 
      content: String,
    }
  }
});

// ========== 对比：现在vs理想 ==========

/* 
现在的方式：386行，大量样板代码
- 手动定义 PluginDefinition
- 手动实现 getSupportedTypes()
- 手动实现 validateValue() 
- 手动实现 executeNode() with switch
- 每个节点都要写输入验证
- 大量 unknown 类型和类型断言

理想的方式：~80行，只有业务逻辑  
- 框架自动推导类型和元数据
- 自动生成 anima 文件
- 自动输入验证和类型检查
- 类型安全的输入参数
- 声明式 API，表达力强
*/ 

// ========== TypeScript类型约束示例 ==========

/* 
理想的类型系统应该能够：

1. 编译时检查输入完整性：
   .inputs({ a: Int, b: String })
   .implement(({ a, b }) => { ... })  // ✅ 正确
   .implement(({ a }) => { ... })     // ❌ 缺少参数b

2. 编译时检查输出完整性：
   .outputs({ result: Bool, done: Signal })
   .implement(() => ({ result: true, done: true }))  // ✅ 正确  
   .implement(() => ({ result: true }))              // ❌ 缺少done

3. 类型匹配检查：
   .inputs({ number: Int })
   .implement(({ number }: { number: number }) => { ... })  // ✅ 正确
   .implement(({ number }: { number: string }) => { ... })  // ❌ 类型不匹配

这样能确保：
- Signal类型的trigger也必须在实现中处理
- 不会有遗漏的输入或输出
- 编译时就能发现类型错误
- 插件的接口契约得到严格保证
*/ 