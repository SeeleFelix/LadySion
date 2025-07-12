use kameo::actor::{ActorRef, WeakActorRef};
use kameo::error::ActorStopReason;
use kameo::message::{Context, Message};
use kameo::{Actor, Reply};
use std::collections::HashMap;
use std::collections::HashSet;
use std::time::{Duration, SystemTime};

use super::ExecutionId;
use anima_weave_core::NodeName;

/// 简化版状态追踪器 - 收集节点执行统计
pub struct SimpleStatusTracker {
    /// 节点执行统计
    node_stats: HashMap<NodeName, NodeExecutionStats>,

    /// 剩余未完成节点集合
    remaining_nodes: HashSet<NodeName>,

    /// 系统级统计
    total_executions: u64,
    total_successes: u64,
    total_failures: u64,
    start_time: SystemTime,
    shutdown_hook: Option<Box<dyn Fn() + Send + Sync + 'static>>,
}

/// 节点执行统计
#[derive(Debug, Clone, Default)]
pub struct NodeExecutionStats {
    pub total_executions: u64,
    pub successful_executions: u64,
    pub failed_executions: u64,
    pub last_execution_time: Option<SystemTime>,
    pub total_execution_duration: Duration,
    pub min_execution_duration: Duration,
    pub max_execution_duration: Duration,
}

impl NodeExecutionStats {
    pub fn new() -> Self {
        Self {
            total_executions: 0,
            successful_executions: 0,
            failed_executions: 0,
            last_execution_time: None,
            total_execution_duration: Duration::from_secs(0),
            min_execution_duration: Duration::from_secs(u64::MAX),
            max_execution_duration: Duration::from_secs(0),
        }
    }

    pub fn success_rate(&self) -> f64 {
        if self.total_executions == 0 {
            0.0
        } else {
            self.successful_executions as f64 / self.total_executions as f64
        }
    }

    pub fn average_execution_duration(&self) -> Duration {
        if self.total_executions == 0 {
            Duration::from_secs(0)
        } else {
            self.total_execution_duration / self.total_executions as u32
        }
    }
}

impl SimpleStatusTracker {
    pub fn new() -> Self {
        Self {
            node_stats: HashMap::new(),
            remaining_nodes: HashSet::new(),
            total_executions: 0,
            total_successes: 0,
            total_failures: 0,
            start_time: SystemTime::now(),
            shutdown_hook: None,
        }
    }

    /// 设置期望执行的节点列表
    fn set_expected_nodes(&mut self, nodes: Vec<NodeName>) {
        self.remaining_nodes = nodes.into_iter().collect();
    }

    /// 当节点首次成功或失败时，从 remaining_nodes 移除
    fn consume_node(&mut self, node_name: &NodeName) {
        self.remaining_nodes.remove(node_name);
        if self.remaining_nodes.is_empty() {
            log::info!("All nodes have finished at least once. Triggering shutdown hook.");
            if let Some(hook) = &self.shutdown_hook {
                (hook)();
            }
        }
    }

    /// 记录节点执行开始
    fn record_execution_start(&mut self, node_name: NodeName, execution_id: ExecutionId) {
        let stats = self
            .node_stats
            .entry(node_name.clone())
            .or_insert_with(NodeExecutionStats::new);
        stats.total_executions += 1;
        stats.last_execution_time = Some(SystemTime::now());

        self.total_executions += 1;

        log::debug!("Node {} started execution {}", node_name, execution_id);
    }

    /// 记录节点执行成功
    fn record_execution_success(
        &mut self,
        node_name: NodeName,
        execution_id: ExecutionId,
        duration: Duration,
    ) {
        self.consume_node(&node_name);
        if let Some(stats) = self.node_stats.get_mut(&node_name) {
            stats.successful_executions += 1;
            stats.total_execution_duration += duration;

            if duration < stats.min_execution_duration {
                stats.min_execution_duration = duration;
            }
            if duration > stats.max_execution_duration {
                stats.max_execution_duration = duration;
            }
        }

        self.total_successes += 1;

        log::info!(
            "Node {} completed execution {} in {:?}",
            node_name,
            execution_id,
            duration
        );
    }

    /// 记录节点执行失败
    fn record_execution_failure(
        &mut self,
        node_name: NodeName,
        execution_id: ExecutionId,
        error: String,
        duration: Duration,
    ) {
        self.consume_node(&node_name);
        if let Some(stats) = self.node_stats.get_mut(&node_name) {
            stats.failed_executions += 1;
            stats.total_execution_duration += duration;
        }

        self.total_failures += 1;

        log::error!(
            "Node {} failed execution {} in {:?}: {}",
            node_name,
            execution_id,
            duration,
            error
        );
    }

    /// 获取系统整体统计
    pub fn get_system_stats(&self) -> SystemStats {
        let uptime = self.start_time.elapsed().unwrap_or(Duration::from_secs(0));

        SystemStats {
            total_executions: self.total_executions,
            total_successes: self.total_successes,
            total_failures: self.total_failures,
            success_rate: if self.total_executions == 0 {
                0.0
            } else {
                self.total_successes as f64 / self.total_executions as f64
            },
            uptime,
            active_nodes: self.node_stats.len(),
        }
    }

    /// 获取特定节点的统计
    pub fn get_node_stats(&self, node_name: &NodeName) -> Option<&NodeExecutionStats> {
        self.node_stats.get(node_name)
    }

    /// 获取所有节点统计
    pub fn get_all_node_stats(&self) -> &HashMap<NodeName, NodeExecutionStats> {
        &self.node_stats
    }
}

impl Default for SimpleStatusTracker {
    fn default() -> Self {
        Self::new()
    }
}

impl Actor for SimpleStatusTracker {
    type Args = Self;
    type Error = String;

    async fn on_start(
        tracker: Self::Args,
        _actor_ref: ActorRef<Self>,
    ) -> Result<Self, Self::Error> {
        log::info!("Starting SimpleStatusTracker");
        Ok(tracker)
    }

    async fn on_stop(
        &mut self,
        _actor_ref: WeakActorRef<Self>,
        _reason: ActorStopReason,
    ) -> Result<(), Self::Error> {
        log::info!("Stopping SimpleStatusTracker");
        Ok(())
    }
}

/// 节点状态事件消息
#[derive(Debug, Clone)]
pub enum NodeStatusEvent {
    ExecutionStarted {
        node_name: NodeName,
        execution_id: ExecutionId,
    },
    ExecutionCompleted {
        node_name: NodeName,
        execution_id: ExecutionId,
        duration: Duration,
    },
    ExecutionFailed {
        node_name: NodeName,
        execution_id: ExecutionId,
        error: String,
        duration: Duration,
    },
}

impl Message<NodeStatusEvent> for SimpleStatusTracker {
    type Reply = ();

    async fn handle(
        &mut self,
        event: NodeStatusEvent,
        _ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        match event {
            NodeStatusEvent::ExecutionStarted {
                node_name,
                execution_id,
            } => {
                self.record_execution_start(node_name, execution_id);
            }
            NodeStatusEvent::ExecutionCompleted {
                node_name,
                execution_id,
                duration,
            } => {
                self.record_execution_success(node_name, execution_id, duration);
            }
            NodeStatusEvent::ExecutionFailed {
                node_name,
                execution_id,
                error,
                duration,
            } => {
                self.record_execution_failure(node_name, execution_id, error, duration);
            }
        }
    }
}

/// 系统统计查询
#[derive(Debug)]
pub struct GetSystemStatsQuery;

/// 系统统计信息
#[derive(Debug, Clone, Reply)]
pub struct SystemStats {
    pub total_executions: u64,
    pub total_successes: u64,
    pub total_failures: u64,
    pub success_rate: f64,
    pub uptime: Duration,
    pub active_nodes: usize,
}

impl Message<GetSystemStatsQuery> for SimpleStatusTracker {
    type Reply = SystemStats;

    async fn handle(
        &mut self,
        _query: GetSystemStatsQuery,
        _ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        self.get_system_stats()
    }
}

/// 节点统计查询
#[derive(Debug)]
pub struct GetNodeStatsQuery {
    pub node_name: NodeName,
}

impl Message<GetNodeStatsQuery> for SimpleStatusTracker {
    type Reply = Option<NodeExecutionStats>;

    async fn handle(
        &mut self,
        query: GetNodeStatsQuery,
        _ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        self.get_node_stats(&query.node_name).cloned()
    }
}

/// 重置统计命令
#[derive(Debug)]
pub struct ResetStatsCommand;

impl Message<ResetStatsCommand> for SimpleStatusTracker {
    type Reply = ();

    async fn handle(
        &mut self,
        _command: ResetStatsCommand,
        _ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        self.node_stats.clear();
        self.total_executions = 0;
        self.total_successes = 0;
        self.total_failures = 0;
        self.start_time = SystemTime::now();

        log::info!("Statistics reset");
    }
}

/// 设置期望节点列表命令
#[derive(Debug)]
pub struct SetExpectedNodesCommand {
    pub nodes: Vec<NodeName>,
}

impl Message<SetExpectedNodesCommand> for SimpleStatusTracker {
    type Reply = ();

    async fn handle(
        &mut self,
        cmd: SetExpectedNodesCommand,
        _ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        self.set_expected_nodes(cmd.nodes);
    }
}

/// 设置关机钩子命令
pub struct SetShutdownHookCommand {
    pub hook: Box<dyn Fn() + Send + Sync + 'static>,
}

impl std::fmt::Debug for SetShutdownHookCommand {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("SetShutdownHookCommand")
            .finish_non_exhaustive()
    }
}

impl Message<SetShutdownHookCommand> for SimpleStatusTracker {
    type Reply = ();

    async fn handle(
        &mut self,
        cmd: SetShutdownHookCommand,
        _ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        self.shutdown_hook = Some(cmd.hook);
    }
}
