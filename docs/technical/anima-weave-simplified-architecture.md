# AnimaWeave 简化架构设计

## 📋 概述

经过 DataBus 合并重构，AnimaWeave 的架构得到了显著简化。原本的三层架构（Coordinator + DataBus + NodeActor）现在简化为两层架构（Coordinator + NodeActor），消除了组件间的职责重叠，提高了系统的可维护性。

## 🏗️ 架构组件

### 1. Coordinator（协调器）
**职责：**
- 图执行调度和生命周期管理
- 数据流管理和依赖检查
- 控制信号聚合和计算
- 节点就绪判断和派发

**核心功能：**
- 集成了原 DataBus 的所有功能
- 使用 ExecutionTracker 实现严格队首阻塞调度
- 内置 DataStore 管理数据和控制信号
- 自动检测图完成状态

### 2. NodeActor（节点执行器）
**职责：**
- 执行具体的业务逻辑
- 处理输入数据和产生输出数据
- 向 Coordinator 报告执行状态

**实现：**
- 使用 PrimitiveNodeActor 承载 NodeFunction
- 所有事件（NodeOutputEvent、NodeExecutionEvent）都发送给 Coordinator
- 不再与 DataBus 直接通信

### 3. GraphLauncher（图启动器）
**职责：**
- 服务入口点和生命周期管理
- 解析 .weave 文件并创建图对象
- 初始化所有组件并建立连接
- 循环处理图执行请求

## 🔄 事件流程

### 简化后的事件流：
```
NodeActor → Coordinator → NodeActor
    ↓         ↓
    ↓      ExecutionTracker
    ↓         ↓
    ↓      DataStore
    ↓         ↓
    ↓      调度决策
    ↓         ↓
    ↓      派发执行
    ↓         ↓
    ↓      依赖检查
    ↓         ↓
    ↓      图完成检测
```

### 关键事件：
1. **NodeOutputEvent**：NodeActor → Coordinator
2. **NodeExecutionEvent**：NodeActor → Coordinator
3. **NodeExecuteEvent**：Coordinator → NodeActor
4. **NodeReadyEvent**：Coordinator 内部处理

## 🎯 核心优势

### 1. 架构简化
- 从三层架构简化为两层架构
- 消除了 DataBus 和 Coordinator 间的职责重叠
- 减少了组件间的通信开销

### 2. 职责清晰
- Coordinator：全权负责调度和数据流管理
- NodeActor：专注于业务逻辑执行
- 每个组件都有明确的单一职责

### 3. 性能提升
- 减少了一层消息传递
- 内部函数调用替代了异步消息
- 降低了系统的整体延迟

### 4. 易于维护
- 代码重复大幅减少
- 调试和追踪更加简单
- 错误处理更加集中

## 🔧 技术实现

### ExecutionTracker 严格队首阻塞调度
```rust
pub fn try_dispatch_next(&mut self) -> Option<NodeExecuteEvent> {
    // 1. 检查全局串行锁
    if self.is_sequential_running {
        return None;
    }
    
    // 2. 检查队列头部
    let Some(execution_id) = self.pending_ids.front() else {
        return None;
    };
    
    // 3. 应用并发规则
    // ...
}
```

### 统一的数据流处理
```rust
pub(crate) fn handle_node_output(&mut self, event: NodeOutputEvent) {
    // 1. 记录数据到 DataStore
    self.record_outputs(&event);
    
    // 2. 检查下游节点就绪状态
    self.process_ready_nodes(&event.node_name);
    
    // 3. 检查图完成状态
    if self.is_graph_execution_completed() {
        self.emit_graph_completed();
    }
}
```

## 🚀 服务化设计

### GraphLauncher 服务循环
```rust
pub async fn run_service_loop(&mut self) {
    loop {
        // 1. 接收 .weave 文件
        let weave_file = self.receive_weave_file().await;
        
        // 2. 解析并执行图
        let result = self.execute_graph(weave_file).await;
        
        // 3. 输出结果
        self.output_result(result).await;
        
        // 4. 等待下一个请求
    }
}
```

## 📊 与原架构对比

| 方面 | 原架构 | 简化架构 |
|------|--------|----------|
| 组件数量 | 3层（Coordinator + DataBus + NodeActor） | 2层（Coordinator + NodeActor） |
| 消息路径 | NodeActor → DataBus → Coordinator | NodeActor → Coordinator |
| 职责分离 | 部分重叠 | 完全分离 |
| 代码重复 | 较多 | 极少 |
| 调试难度 | 较高 | 较低 |
| 性能开销 | 较高 | 较低 |

## 🔄 迁移影响

### 已完成的重构：
- ✅ 移除 DataBus actor 实现
- ✅ 合并 DataBus 功能到 Coordinator
- ✅ 更新 NodeActor 事件发送目标
- ✅ 简化 GraphLauncher 初始化流程
- ✅ 更新相关事件文档

### 向后兼容性：
- 保持了所有核心接口不变
- 事件类型定义保持兼容
- 对外部使用者透明

## 🎯 未来规划

### 短期目标：
1. 完善图完成检测机制
2. 添加更详细的执行统计
3. 优化错误处理和恢复

### 长期目标：
1. 支持动态图修改
2. 增加分布式执行能力
3. 实现更智能的调度算法

## 🔗 相关文档

- [ExecutionTracker 设计文档](./anima-weave-actor-model-design.md)
- [图执行流程](../architecture/animaweave-class-diagram.md)
- [事件系统设计](../architecture/backend.md)

---

*更新时间：2024-12-24*
*版本：简化架构 v1.0* 