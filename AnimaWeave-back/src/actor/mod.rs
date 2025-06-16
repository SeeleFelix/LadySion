// AnimaWeave Actor模块 - 事件驱动并行执行引擎

pub mod messages;
pub mod data_bus_actor;
pub mod node_actor;
pub mod graph_actor;

// 重新导出核心Actor类型
pub use messages::*;
pub use data_bus_actor::DataBusActor;
pub use node_actor::NodeActor;
pub use graph_actor::GraphExecutorActor;

use crate::{GraphDefinition, PluginRegistry, NodeOutputs};
use std::collections::HashMap;

/// Actor版本的图执行引擎
/// 保持与现有execute_graph函数完全相同的接口
pub async fn execute_graph_actor(
    graph: &GraphDefinition, 
    registry: &PluginRegistry
) -> Result<HashMap<String, NodeOutputs>, String> {
    // 创建Actor系统
    let system = actix::System::new();
    
    // 在系统中运行Actor执行逻辑
    let result = actix::spawn(async move {
        execute_graph_in_system(graph.clone(), registry.clone()).await
    });
    
    // 等待结果
    system.run().unwrap();
    result.await.map_err(|e| format!("Actor execution failed: {}", e))?
}

/// 在Actor系统中执行图
async fn execute_graph_in_system(
    graph: GraphDefinition,
    registry: PluginRegistry
) -> Result<HashMap<String, NodeOutputs>, String> {
    use actix::Actor;
    
    // 创建数据总线Actor
    let data_bus = DataBusActor::new().start();
    
    // 创建图执行Actor
    let graph_executor = GraphExecutorActor::new(data_bus.clone()).start();
    
    // 发送执行图的消息
    let result = graph_executor.send(ExecuteGraphMessage {
        graph,
        registry,
    }).await.map_err(|e| format!("Failed to send execute message: {}", e))?;
    
    result
} 