//! Coordinator实现
//!
//! 最简单的协调器实现，专注于处理控制事件

use kameo::message::{Context, Message};
use kameo::prelude::*;
use std::collections::HashSet;
use std::time::SystemTime;

use super::CoordinatorError;
use crate::event::{ControlEvent, DataEvent, NodeExecutionEvent};
use crate::types::NodeName;

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

    /// 尝试执行节点（如果不在运行中）
    async fn try_execute_node(&mut self, node_name: &NodeName) {
        // 🚫 同名节点不能并发执行
        if self.running_nodes.contains(node_name) {
            println!("⏸️ Node {} is already running, skipping", node_name);
            return;
        }

        // TODO: 检查节点是否ready（所有输入数据和控制信号都满足）
        if !self.is_node_ready(node_name) {
            println!("⏳ Node {} is not ready yet", node_name);
            return;
        }

        // 标记为运行中
        self.running_nodes.insert(node_name.clone());
        self.total_executions += 1;
        self.last_activity = Some(SystemTime::now());

        // 执行节点
        self.execute_node(node_name).await;
    }

    /// 检查节点是否ready执行
    fn is_node_ready(&self, _node_name: &NodeName) -> bool {
        // TODO: 基于图结构检查：
        // 1. 所有必需的输入端口都有数据
        // 2. 所有必需的控制信号都是active
        // 3. 前置依赖节点都已完成
        true // 暂时返回true
    }

    /// 执行节点
    async fn execute_node(&mut self, node_name: &NodeName) {
        let execution_id = format!("exec_{}_{}", node_name, self.total_executions);

        println!(
            "▶️ Executing node {} with execution_id {}",
            node_name, execution_id
        );

        /* TODO: 启用这段代码当NodeActor实现后
        // 通过lookup查找节点Actor
        if let Ok(Some(node_ref)) = ActorRef::<NodeActor>::lookup(node_name).await {
            // 准备执行事件
            let execute_event = NodeExecuteEvent::new(
                node_name.clone(),
                execution_id.clone(),
                self.collect_node_inputs(node_name), // 从DataStore收集输入
            );

            // 发送执行命令
            if let Err(e) = node_ref.tell(execute_event).await {
                eprintln!("❌ Failed to send execute command to node {}: {}", node_name, e);
                self.current_error = Some(format!("Node execution failed: {}", e));
                self.running_nodes.remove(node_name); // 执行失败，移除运行标记
            }
        } else {
            eprintln!("❌ Node {} not found in registry", node_name);
            self.current_error = Some(format!("Node {} not found", node_name));
            self.running_nodes.remove(node_name); // 节点不存在，移除运行标记
        }
        */

        // 暂时模拟执行（移除当实现NodeActor后）
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        self.handle_node_completion(node_name, true);
    }

    /// 收集节点的输入数据
    fn collect_node_inputs(&self, _node_name: &NodeName) -> crate::types::NodeInputs {
        // TODO: 从DataStore收集指定节点的所有输入数据
        crate::types::NodeInputs::new()
    }

    /// 处理节点执行完成
    fn handle_node_completion(&mut self, node_name: &NodeName, success: bool) {
        // 🔓 移除运行标记，允许该节点再次执行
        self.running_nodes.remove(node_name);

        if success {
            self.successful_executions += 1;
            println!("✅ Node {} completed successfully", node_name);

            // 🔄 检查下游节点是否可以执行
            self.check_downstream_nodes(node_name);
        } else {
            self.failed_executions += 1;
            println!("❌ Node {} failed", node_name);
        }

        self.last_activity = Some(SystemTime::now());
    }

    /// 检查下游节点是否可以执行
    fn check_downstream_nodes(&mut self, _completed_node: &NodeName) {
        // TODO: 基于图结构查找所有下游节点
        // TODO: 对每个下游节点调用try_execute_node
        println!("🔍 Checking downstream nodes of {}", _completed_node);
    }

    /// 处理新数据到达，检查相关节点
    fn handle_data_arrival(&mut self, _event: &DataEvent) {
        // TODO: 基于数据端口找到相关节点
        // TODO: 对相关节点调用try_execute_node
        println!("📊 Data arrived, checking related nodes");
    }

    /// 处理控制信号变化，检查相关节点  
    fn handle_control_change(&mut self, _event: &ControlEvent) {
        // TODO: 基于控制端口找到相关节点
        // TODO: 对相关节点调用try_execute_node
        println!("🎛️ Control signal changed, checking related nodes");
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
                println!("🔄 Node {} started running", event.node_name);
            }
            crate::event::types::NodeStatus::Pending => {
                println!("⏳ Node {} is pending", event.node_name);
            }
        }
    }
}

// 🎛️ ControlEvent: Node -> Coordinator
impl Message<ControlEvent> for Coordinator {
    type Reply = ();

    async fn handle(
        &mut self,
        event: ControlEvent,
        _ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        self.handle_control_change(&event);
        self.last_activity = Some(SystemTime::now());
    }
}

// 📊 DataEvent: Node -> Coordinator
impl Message<DataEvent> for Coordinator {
    type Reply = ();

    async fn handle(
        &mut self,
        event: DataEvent,
        _ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        self.handle_data_arrival(&event);
        self.last_activity = Some(SystemTime::now());
    }
}

// 📊 状态查询消息（仅用于调试）
#[derive(Debug)]
pub struct GetStatusQuery;

impl Message<GetStatusQuery> for Coordinator {
    type Reply = Result<ExecutionStatus, CoordinatorError>;

    async fn handle(
        &mut self,
        _query: GetStatusQuery,
        _ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        Ok(self.get_status())
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
