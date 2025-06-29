//! Coordinator实现
//!
//! 最简单的协调器实现，专注于处理控制事件

use crate::actor::errors::CoordinatorError;
use crate::event::{NodeExecutionEvent, NodeReadyEvent};
use crate::types::NodeName;
use kameo::message::Context;
use kameo::{actor::ActorRef, message::Message, Actor};
use std::collections::HashSet;
use std::time::SystemTime;

/// 执行状态信息
///
/// 提供给外部的状态查询结果
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ExecutionStatus {
    /// 引擎是否正在运行
    pub is_running: bool,
    /// 当前正在执行的节点数量
    pub active_nodes_count: usize,
    /// 等待执行的节点数量
    pub pending_nodes_count: usize,
    /// 总执行次数
    pub total_executions: u64,
    /// 成功执行次数
    pub successful_executions: u64,
    /// 失败执行次数
    pub failed_executions: u64,
    /// 最后活动时间
    pub last_activity: Option<SystemTime>,
    /// 当前错误（如果有）
    pub current_error: Option<String>,
}

impl ExecutionStatus {
    /// 创建空的状态
    pub fn empty() -> Self {
        Self {
            is_running: false,
            active_nodes_count: 0,
            pending_nodes_count: 0,
            total_executions: 0,
            successful_executions: 0,
            failed_executions: 0,
            last_activity: None,
            current_error: None,
        }
    }

    /// 计算成功率
    pub fn success_rate(&self) -> f64 {
        if self.total_executions == 0 {
            0.0
        } else {
            self.successful_executions as f64 / self.total_executions as f64
        }
    }

    /// 检查是否健康运行
    pub fn is_healthy(&self) -> bool {
        self.is_running && self.current_error.is_none()
    }
}

impl Default for ExecutionStatus {
    fn default() -> Self {
        Self::empty()
    }
}

/// AnimaWeave系统的图执行引擎
///
/// 纯事件驱动模式：
/// - 基于图依赖自动执行节点
/// - 保证同名节点不并发执行
/// - 有序处理所有事件
#[derive(Debug)]
pub struct Coordinator {
    /// 当前正在执行的节点（防止同名节点并发）
    running_nodes: HashSet<NodeName>,
    /// 执行统计
    total_executions: u64,
    successful_executions: u64,
    failed_executions: u64,
    /// 最后活动时间
    last_activity: Option<SystemTime>,
    /// 当前错误
    current_error: Option<String>,
}

impl Default for Coordinator {
    fn default() -> Self {
        Self::new()
    }
}

impl Coordinator {
    pub fn new() -> Self {
        Self {
            running_nodes: HashSet::new(),
            total_executions: 0,
            successful_executions: 0,
            failed_executions: 0,
            last_activity: None,
            current_error: None,
        }
    }

    /// 为图启动coordinator并注册到全局registry
    ///
    /// 图启动一次，自动注册所有需要的node监听
    pub async fn spawn_for_graph(/* TODO: 添加图参数 */) -> Result<ActorRef<Self>, CoordinatorError>
    {
        let coordinator = Self::new();
        let actor_ref = Actor::spawn(coordinator);

        // 注册为系统coordinator
        actor_ref.register("system_coordinator").map_err(|e| {
            CoordinatorError::startup_failed(format!("Failed to register coordinator: {}", e))
        })?;

        println!("🚀 Coordinator started for graph execution");

        // TODO: 根据图结构注册所有需要的node actors
        // TODO: 分析图依赖，准备执行策略

        Ok(actor_ref)
    }

    /// 获取当前执行状态（用于调试）
    pub fn get_status(&self) -> ExecutionStatus {
        ExecutionStatus {
            is_running: true, // 图模式下coordinator总是运行的
            active_nodes_count: self.running_nodes.len(),
            pending_nodes_count: 0, // TODO: 从图分析中计算
            total_executions: self.total_executions,
            successful_executions: self.successful_executions,
            failed_executions: self.failed_executions,
            last_activity: self.last_activity,
            current_error: self.current_error.clone(),
        }
    }

    /// 处理NodeReadyEvent：依赖满足通知
    fn handle_node_ready(&mut self, event: &NodeReadyEvent) {
        let node_name = &event.target_node_name;

        // 🚫 同名节点不能并发执行
        if self.running_nodes.contains(node_name) {
            println!("⏸️ Node {} is already running, skipping", node_name);
            return;
        }

        // 标记为运行中
        self.running_nodes.insert(node_name.clone());
        self.total_executions += 1;
        self.last_activity = Some(SystemTime::now());

        println!(
            "▶️ Executing node {} (execution {})",
            node_name, self.total_executions
        );

        // TODO: 发送NodeExecuteEvent到具体的NodeActor
        // let execution_id = format!("exec_{}_{}", node_name, self.total_executions);
        // let execute_event = NodeExecuteEvent::new(node_name, execution_id, event.prepared_inputs);
        // node_actor_ref.send(execute_event).await;
    }

    /// 处理NodeExecutionEvent：节点执行状态通知
    fn handle_node_execution(&mut self, event: &NodeExecutionEvent) {
        let node_name = &event.node_name;

        // 移除运行标记
        self.running_nodes.remove(node_name);
        self.last_activity = Some(SystemTime::now());

        // 更新统计
        match &event.status {
            crate::event::types::NodeStatus::Completed => {
                self.successful_executions += 1;
                println!(
                    "✅ Node {} completed successfully ({})",
                    node_name, event.node_execute_id
                );
            }
            crate::event::types::NodeStatus::Failed(error) => {
                self.failed_executions += 1;
                println!(
                    "❌ Node {} failed ({}): {}",
                    node_name, event.node_execute_id, error
                );
            }
            _ => {
                println!("📊 Node {} status: {:?}", node_name, event.status);
            }
        }
    }

    /// 处理节点执行完成
    fn handle_node_completion(&mut self, node_name: &NodeName, success: bool) {
        // 🔓 移除运行标记，允许该节点再次执行
        self.running_nodes.remove(node_name);

        if success {
            self.successful_executions += 1;
            println!("✅ Node {} completed successfully", node_name);

            // 🔄 当节点完成时，由DataBus负责检查下游依赖
            // 这里不需要手动检查，等待DataReadyEvent即可
        } else {
            self.failed_executions += 1;
            println!("❌ Node {} failed", node_name);
        }

        self.last_activity = Some(SystemTime::now());
    }

    pub fn is_node_running(&self, node_name: &NodeName) -> bool {
        self.running_nodes.contains(node_name)
    }
}

// 实现Kameo Actor trait
impl Actor for Coordinator {
    type Args = Self;
    type Error = CoordinatorError;

    async fn on_start(
        coordinator: Self::Args,
        _actor_ref: ActorRef<Self>,
    ) -> Result<Self, Self::Error> {
        println!("🚀 Graph execution coordinator started");
        Ok(coordinator)
    }

    async fn on_stop(
        &mut self,
        _actor_ref: kameo::actor::WeakActorRef<Self>,
        _reason: kameo::error::ActorStopReason,
    ) -> Result<(), Self::Error> {
        println!("🛑 Graph execution coordinator stopped");
        Ok(())
    }
}

// 🔄 NodeExecutionEvent: Node -> Coordinator
impl Message<NodeExecutionEvent> for Coordinator {
    type Reply = ();

    async fn handle(
        &mut self,
        event: NodeExecutionEvent,
        _ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        match event.status {
            crate::event::types::NodeStatus::Completed => {
                self.handle_node_completion(&event.node_name, true);
            }
            crate::event::types::NodeStatus::Failed(ref error) => {
                self.handle_node_completion(&event.node_name, false);
                self.current_error = Some(error.clone());
            }
            crate::event::types::NodeStatus::Running => {
                self.handle_node_execution(&event);
            }
            crate::event::types::NodeStatus::Pending => {
                self.handle_node_execution(&event);
            }
        }
    }
}

// 🔔 NodeReadyEvent: DataBus -> Coordinator
impl Message<NodeReadyEvent> for Coordinator {
    type Reply = ();

    async fn handle(
        &mut self,
        event: NodeReadyEvent,
        _ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        println!(
            "🔔 Coordinator received NodeReadyEvent for {}",
            event.target_node_name
        );
        self.handle_node_ready(&event);
    }
}

// 📊 状态查询消息（仅用于调试）
#[derive(Debug)]
pub struct GetStatusQuery;

impl Message<GetStatusQuery> for Coordinator {
    type Reply = ();

    async fn handle(
        &mut self,
        _query: GetStatusQuery,
        _ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        let status = self.get_status();
        // 通过 ctx 发送回复
        println!("📊 Current status: {:?}", status);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_coordinator_creation() {
        let coordinator = Coordinator::new();
        assert_eq!(coordinator.total_executions, 0);
        assert!(coordinator.running_nodes.is_empty());
    }

    #[test]
    fn test_coordinator_status() {
        let coordinator = Coordinator::new();
        let status = coordinator.get_status();

        assert!(status.is_running); // 图模式下总是运行
        assert_eq!(status.active_nodes_count, 0);
        assert_eq!(status.total_executions, 0);
        assert_eq!(status.success_rate(), 0.0);
    }

    #[test]
    fn test_node_concurrency_control() {
        let mut coordinator = Coordinator::new();

        // 同名节点不能并发
        assert!(!coordinator.running_nodes.contains("test_node"));
        coordinator.running_nodes.insert("test_node".to_string());
        assert!(coordinator.running_nodes.contains("test_node"));
    }
}
