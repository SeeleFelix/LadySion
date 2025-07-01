//! Coordinator实现
//!
//! 最简单的协调器实现，专注于处理控制事件

use crate::actor::errors::CoordinatorError;
use crate::event::{NodeExecutionEvent, NodeReadyEvent, NodeExecuteEvent};
use kameo::message::Context;
use kameo::{actor::ActorRef, message::Message, Actor};
use std::time::SystemTime;
use crate::actor::registry::NodeRegistry;
use crate::actor::execution_tracker::ExecutionTracker;
use log;
use std::sync::Arc;

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
    /// 执行统计
    total_executions: u64,
    successful_executions: u64,
    failed_executions: u64,
    /// 最后活动时间
    last_activity: Option<SystemTime>,
    /// 当前错误
    current_error: Option<String>,
    /// NodeActor 注册表（共享）
    node_registry: Arc<NodeRegistry>,
    /// 执行追踪器
    tracker: ExecutionTracker,
}

impl Default for Coordinator {
    fn default() -> Self {
        Self::new()
    }
}

impl Coordinator {
    pub fn new() -> Self {
        Self {
            total_executions: 0,
            successful_executions: 0,
            failed_executions: 0,
            last_activity: None,
            current_error: None,
            node_registry: Arc::new(NodeRegistry::new()),
            tracker: ExecutionTracker::new(),
        }
    }

    /// 创建一个使用外部共享 `NodeRegistry` 的 Coordinator
    pub fn with_registry(registry: Arc<NodeRegistry>) -> Self {
        Self {
            total_executions: 0,
            successful_executions: 0,
            failed_executions: 0,
            last_activity: None,
            current_error: None,
            node_registry: registry,
            tracker: ExecutionTracker::new(),
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
            active_nodes_count: self.tracker.running_nodes_count(),
            pending_nodes_count: 0, // TODO: 从图分析中计算
            total_executions: self.total_executions,
            successful_executions: self.successful_executions,
            failed_executions: self.failed_executions,
            last_activity: self.last_activity,
            current_error: self.current_error.clone(),
        }
    }

    /// 尝试立即调度或队列等待
    fn on_node_ready(&mut self, event: NodeReadyEvent) {
        // TODO: 从图的元数据中获取 is_sequential 标志
        self.tracker.register_ready(event, false);
        self.try_dispatch_from_queue();
    }

    /// 真正派发执行
    fn dispatch_execute_event(&mut self, event: NodeExecuteEvent) {
        let node_name = event.node_name.clone();

        self.total_executions += 1;
        self.last_activity = Some(SystemTime::now());

        log::info!(
            "(Coordinator) Executing node {} (execution {})",
            node_name, event.node_execute_id
        );

        if let Some(recipient) = self.node_registry.lookup(&node_name) {
            tokio::spawn(async move {
                if recipient.tell(event).await.is_err() {
                    // 如果发送失败，这是一个严重的系统错误，因为 Actor 应该总是可达的
                    panic!("FATAL: Failed to send NodeExecuteEvent to actor '{}'. The actor might have crashed.", node_name);
                }
            });
        } else {
            // 如果在注册表中找不到 Actor，这是一个更严重的系统设计或状态同步错误
            panic!("FATAL: NodeActor for '{}' not found in registry, but was scheduled for execution.", node_name);
        }
    }

    /// 尝试调度队列
    fn try_dispatch_from_queue(&mut self) {
        while let Some(execute_event) = self.tracker.try_dispatch_next() {
            self.dispatch_execute_event(execute_event);
        }
    }

    /// 处理NodeExecutionEvent：节点执行状态通知
    fn handle_node_execution(&mut self, event: &NodeExecutionEvent) {
        
    }

    /// 处理节点执行完成
    fn handle_node_completion(&mut self, event: &NodeExecutionEvent) {
        self.last_activity = Some(SystemTime::now());
        self.tracker.mark_as_completed(&event.node_execute_id, event.status.is_success());

        // 节点完成后尝试调度队列
        self.try_dispatch_from_queue();
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
        log::debug!("(Coordinator) Received NodeExecutionEvent: {:?}", event);
        match event.status {
            crate::event::types::NodeStatus::Completed => {
                self.handle_node_completion(&event);
            }
            crate::event::types::NodeStatus::Failed(ref error) => {
                self.handle_node_completion(&event);
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
        log::info!(
            "(Coordinator) Received NodeReadyEvent for {}",
            event.target_node_name
        );
        self.on_node_ready(event);
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

        // 这个测试的逻辑应该在 ExecutionTracker 的测试中完成
        // Coordinator 不再直接管理运行状态
    }
}
