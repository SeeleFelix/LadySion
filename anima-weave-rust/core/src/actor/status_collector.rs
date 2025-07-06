use crate::actor::errors::CoordinatorError;
use crate::actor::types::*;
use crate::types::{ExecutionId, NodeName};
use kameo::actor::{ActorRef, WeakActorRef};
use kameo::error::ActorStopReason;
use kameo::message::{Context, Message};
use kameo::Actor;
use std::collections::{HashMap, VecDeque};
use std::time::{Duration, SystemTime};

/// 分布式状态收集器 - 完全兼容Coordinator和ExecutionTracker的功能
/// 被动收集NodeActor的状态事件，维护系统整体状态
pub struct StatusCollector {
    // ===== 基础统计信息 (继承自Coordinator) =====
    total_executions: u64,
    successful_executions: u64,
    failed_executions: u64,
    last_activity: Option<SystemTime>,
    current_error: Option<String>,

    // ===== 详细执行记录 (增强自ExecutionTracker) =====
    all_execution_records: HashMap<ExecutionId, DetailedExecutionRecord>,
    active_executions: HashMap<ExecutionId, DetailedExecutionRecord>,
    execution_history: VecDeque<DetailedExecutionRecord>,
    max_history_size: usize,

    // ===== 节点级别统计 =====
    node_statistics: HashMap<NodeName, NodeStats>,

    // ===== 性能分析数据 =====
    execution_duration_histogram: HashMap<NodeName, Vec<Duration>>,
    system_metrics: SystemMetrics,

    // ===== 分布式状态信息 =====
    node_actor_health: HashMap<NodeName, ActorHealthStatus>,
    message_stats: MessageStats,
}

impl StatusCollector {
    pub fn new() -> Self {
        Self {
            total_executions: 0,
            successful_executions: 0,
            failed_executions: 0,
            last_activity: None,
            current_error: None,
            all_execution_records: HashMap::new(),
            active_executions: HashMap::new(),
            execution_history: VecDeque::new(),
            max_history_size: 1000,
            node_statistics: HashMap::new(),
            execution_duration_histogram: HashMap::new(),
            system_metrics: SystemMetrics::default(),
            node_actor_health: HashMap::new(),
            message_stats: MessageStats::default(),
        }
    }

    pub fn with_history_size(max_history_size: usize) -> Self {
        Self {
            max_history_size,
            ..Self::new()
        }
    }

    // ===== 兼容Coordinator的所有方法 =====

    pub fn get_status(&self) -> ExecutionStatus {
        ExecutionStatus {
            is_running: !self.active_executions.is_empty(),
            active_nodes_count: self.active_executions.len(),
            total_executions: self.total_executions,
            successful_executions: self.successful_executions,
            failed_executions: self.failed_executions,
            last_activity: self.last_activity,
            current_error: self.current_error.clone(),
        }
    }

    pub fn get_active_executions(&self) -> Vec<&DetailedExecutionRecord> {
        self.active_executions.values().collect()
    }

    pub fn get_recent_history(&self, limit: usize) -> Vec<&DetailedExecutionRecord> {
        self.execution_history.iter().rev().take(limit).collect()
    }

    pub fn clear_error(&mut self) {
        self.current_error = None;
    }

    pub fn reset_stats(&mut self) {
        self.total_executions = 0;
        self.successful_executions = 0;
        self.failed_executions = 0;
        self.current_error = None;
        self.node_statistics.clear();
        self.execution_duration_histogram.clear();
        self.system_metrics = SystemMetrics::default();
        log::info!("(StatusCollector) Statistics reset");
    }

    // ===== 兼容ExecutionTracker的所有方法 =====

    pub fn get_execution_record(
        &self,
        execution_id: &ExecutionId,
    ) -> Option<&DetailedExecutionRecord> {
        self.all_execution_records.get(execution_id)
    }

    pub fn running_nodes_count(&self) -> usize {
        self.active_executions.len()
    }

    pub fn is_running_nodes_empty(&self) -> bool {
        self.active_executions.is_empty()
    }

    // ===== 新增的增强功能 =====

    pub fn get_node_statistics(&self, node_name: &NodeName) -> Option<&NodeStats> {
        self.node_statistics.get(node_name)
    }

    pub fn get_all_node_statistics(&self) -> &HashMap<NodeName, NodeStats> {
        &self.node_statistics
    }

    pub fn get_system_metrics(&self) -> &SystemMetrics {
        &self.system_metrics
    }

    pub fn generate_performance_report(&self) -> PerformanceReport {
        PerformanceReport {
            overall_stats: self.get_status(),
            node_performance: self.node_statistics.clone(),
            system_metrics: self.system_metrics.clone(),
            top_performers: self.get_top_performing_nodes(5),
            bottlenecks: self.identify_bottlenecks(),
        }
    }

    pub fn get_actor_health(&self, node_name: &NodeName) -> Option<&ActorHealthStatus> {
        self.node_actor_health.get(node_name)
    }

    pub fn get_message_stats(&self) -> &MessageStats {
        &self.message_stats
    }

    // ===== 内部处理方法 =====

    fn handle_status_event(&mut self, event: NodeStatusEvent) {
        self.last_activity = Some(SystemTime::now());

        match event {
            NodeStatusEvent::ExecutionQueued {
                node_name,
                execution_id,
                is_sequential,
            } => {
                self.handle_execution_queued(node_name, execution_id, is_sequential);
            }
            NodeStatusEvent::ExecutionStarted {
                node_name,
                execution_id,
                input_count,
            } => {
                self.handle_execution_started(node_name, execution_id, input_count);
            }
            NodeStatusEvent::ExecutionCompleted {
                node_name,
                execution_id,
                output_count,
                duration,
            } => {
                self.handle_execution_completed(node_name, execution_id, output_count, duration);
            }
            NodeStatusEvent::ExecutionFailed {
                node_name,
                execution_id,
                error,
                duration,
            } => {
                self.handle_execution_failed(node_name, execution_id, error, duration);
            }
            NodeStatusEvent::HealthUpdate { node_name, status } => {
                self.node_actor_health.insert(node_name, status);
            }
            NodeStatusEvent::MessageProcessed {
                node_name,
                message_type,
                processing_time,
            } => {
                self.handle_message_processed(node_name, message_type, processing_time);
            }
        }
    }

    fn handle_execution_queued(
        &mut self,
        node_name: NodeName,
        execution_id: ExecutionId,
        is_sequential: bool,
    ) {
        let record = DetailedExecutionRecord {
            execution_id: execution_id.clone(),
            node_name,
            status: DetailedExecutionStatus::Queued,
            is_sequential,
            ready_at: SystemTime::now(),
            dispatched_at: None,
            started_at: None,
            completed_at: None,
            input_data_count: 0,
            output_data_count: 0,
            error_message: None,
            queue_wait_duration: None,
            execution_duration: None,
        };

        self.all_execution_records.insert(execution_id, record);
    }

    fn handle_execution_started(
        &mut self,
        node_name: NodeName,
        execution_id: ExecutionId,
        input_count: usize,
    ) {
        let record =
            if let Some(existing_record) = self.all_execution_records.get_mut(&execution_id) {
                // 使用现有记录
                existing_record.status = DetailedExecutionStatus::Running;
                existing_record.started_at = Some(SystemTime::now());
                existing_record.input_data_count = input_count;

                // 计算队列等待时间
                if let Some(started) = existing_record.started_at {
                    existing_record.queue_wait_duration =
                        started.duration_since(existing_record.ready_at).ok();
                }

                existing_record.clone()
            } else {
                // 如果没有先发送ExecutionQueued，创建一个新记录
                let now = SystemTime::now();
                let new_record = DetailedExecutionRecord {
                    execution_id: execution_id.clone(),
                    node_name: node_name.clone(),
                    status: DetailedExecutionStatus::Running,
                    is_sequential: false, // 分布式执行默认为非顺序
                    ready_at: now,
                    dispatched_at: Some(now),
                    started_at: Some(now),
                    completed_at: None,
                    input_data_count: input_count,
                    output_data_count: 0,
                    error_message: None,
                    queue_wait_duration: Some(Duration::ZERO), // 立即执行
                    execution_duration: None,
                };

                self.all_execution_records
                    .insert(execution_id.clone(), new_record.clone());
                new_record
            };

        // 移动到活跃执行
        self.active_executions.insert(execution_id.clone(), record);

        // 更新系统指标
        self.system_metrics.current_concurrent_executions = self.active_executions.len();
        if self.active_executions.len() > self.system_metrics.peak_concurrent_executions {
            self.system_metrics.peak_concurrent_executions = self.active_executions.len();
        }
    }

    fn handle_execution_completed(
        &mut self,
        node_name: NodeName,
        execution_id: ExecutionId,
        output_count: usize,
        duration: Duration,
    ) {
        if let Some(record) = self.active_executions.remove(&execution_id) {
            self.complete_execution(record, true, output_count, duration, None);
        }
    }

    fn handle_execution_failed(
        &mut self,
        node_name: NodeName,
        execution_id: ExecutionId,
        error: String,
        duration: Duration,
    ) {
        if let Some(record) = self.active_executions.remove(&execution_id) {
            self.complete_execution(record, false, 0, duration, Some(error));
        }
    }

    fn handle_message_processed(
        &mut self,
        node_name: NodeName,
        message_type: MessageType,
        processing_time: Duration,
    ) {
        match message_type {
            MessageType::Data => self.message_stats.total_data_messages += 1,
            MessageType::Control => self.message_stats.total_control_messages += 1,
            MessageType::Status => self.message_stats.total_status_messages += 1,
        }

        // 更新平均处理时间
        let total_messages = self.message_stats.total_data_messages
            + self.message_stats.total_control_messages
            + self.message_stats.total_status_messages;

        if total_messages > 0 {
            let current_avg_nanos = self
                .message_stats
                .average_message_processing_time
                .as_nanos() as u64;
            let processing_time_nanos = processing_time.as_nanos() as u64;
            let new_avg_nanos =
                (current_avg_nanos * (total_messages - 1) + processing_time_nanos) / total_messages;
            self.message_stats.average_message_processing_time =
                Duration::from_nanos(new_avg_nanos);
        }
    }

    fn complete_execution(
        &mut self,
        mut record: DetailedExecutionRecord,
        success: bool,
        output_count: usize,
        duration: Duration,
        error: Option<String>,
    ) {
        // 更新记录
        record.completed_at = Some(SystemTime::now());
        record.output_data_count = output_count;
        record.error_message = error.clone();
        record.execution_duration = Some(duration);

        // 更新统计
        self.total_executions += 1;
        if success {
            self.successful_executions += 1;
            record.status = DetailedExecutionStatus::Completed { success: true };
        } else {
            self.failed_executions += 1;
            let error_msg = error.unwrap_or_default();
            record.status = DetailedExecutionStatus::Failed {
                error: error_msg.clone(),
            };
            self.current_error = Some(format!("Node '{}': {}", record.node_name, error_msg));
        }

        // 更新节点统计
        self.update_node_statistics(&record);

        // 添加到历史
        self.add_to_history(record.clone());

        // 更新完整记录
        self.all_execution_records
            .insert(record.execution_id.clone(), record);

        // 更新系统指标
        self.system_metrics.current_concurrent_executions = self.active_executions.len();
        self.update_system_throughput();
    }

    fn update_node_statistics(&mut self, record: &DetailedExecutionRecord) {
        let stats = self
            .node_statistics
            .entry(record.node_name.clone())
            .or_default();

        stats.total_executions += 1;
        if matches!(
            record.status,
            DetailedExecutionStatus::Completed { success: true }
        ) {
            stats.successful_executions += 1;
        } else {
            stats.failed_executions += 1;
        }

        if let Some(duration) = record.execution_duration {
            stats.last_execution_time = record.completed_at;
            stats.total_processing_time += duration;

            if duration < stats.min_execution_time {
                stats.min_execution_time = duration;
            }
            if duration > stats.max_execution_time {
                stats.max_execution_time = duration;
            }

            stats.average_execution_time =
                stats.total_processing_time / stats.total_executions as u32;

            // 更新性能直方图
            self.execution_duration_histogram
                .entry(record.node_name.clone())
                .or_default()
                .push(duration);
        }
    }

    fn add_to_history(&mut self, record: DetailedExecutionRecord) {
        self.execution_history.push_back(record);

        if self.execution_history.len() > self.max_history_size {
            self.execution_history.pop_front();
        }
    }

    fn update_system_throughput(&mut self) {
        let uptime = self.system_metrics.start_time.elapsed().unwrap_or_default();
        if uptime.as_secs() > 0 {
            self.system_metrics.system_throughput =
                self.total_executions as f64 / uptime.as_secs_f64();
        }
        self.system_metrics.uptime = uptime;
    }

    fn get_top_performing_nodes(&self, limit: usize) -> Vec<(NodeName, NodeStats)> {
        let mut nodes: Vec<_> = self
            .node_statistics
            .iter()
            .map(|(name, stats)| (name.clone(), stats.clone()))
            .collect();

        nodes.sort_by(|a, b| {
            let a_rate = a.1.successful_executions as f64 / a.1.total_executions.max(1) as f64;
            let b_rate = b.1.successful_executions as f64 / b.1.total_executions.max(1) as f64;
            b_rate
                .partial_cmp(&a_rate)
                .unwrap_or(std::cmp::Ordering::Equal)
        });

        nodes.into_iter().take(limit).collect()
    }

    fn identify_bottlenecks(&self) -> Vec<(NodeName, String)> {
        let mut bottlenecks = Vec::new();

        for (node_name, stats) in &self.node_statistics {
            let success_rate =
                stats.successful_executions as f64 / stats.total_executions.max(1) as f64;

            if success_rate < 0.8 {
                bottlenecks.push((
                    node_name.clone(),
                    format!("Low success rate: {:.2}%", success_rate * 100.0),
                ));
            }

            if stats.average_execution_time > Duration::from_secs(5) {
                bottlenecks.push((
                    node_name.clone(),
                    format!("Slow execution: {:?}", stats.average_execution_time),
                ));
            }
        }

        bottlenecks
    }
}

impl Default for StatusCollector {
    fn default() -> Self {
        Self::new()
    }
}

impl Actor for StatusCollector {
    type Args = Self;
    type Error = CoordinatorError;

    async fn on_start(
        collector: Self::Args,
        _actor_ref: ActorRef<Self>,
    ) -> Result<Self, Self::Error> {
        log::info!("Starting StatusCollector");
        Ok(collector)
    }

    async fn on_stop(
        &mut self,
        _actor_ref: WeakActorRef<Self>,
        _reason: ActorStopReason,
    ) -> Result<(), Self::Error> {
        log::info!("Stopping StatusCollector");
        Ok(())
    }
}

impl Message<NodeStatusEvent> for StatusCollector {
    type Reply = ();

    async fn handle(
        &mut self,
        event: NodeStatusEvent,
        _ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        self.handle_status_event(event);
    }
}

/// 查询消息类型
#[derive(Debug)]
pub struct GetStatusQuery;

#[derive(Debug)]
pub struct GetNodeStatsQuery(pub NodeName);

#[derive(Debug)]
pub struct GetPerformanceReportQuery;

#[derive(Debug)]
pub struct ResetStatsCommand;

impl Message<GetStatusQuery> for StatusCollector {
    type Reply = ExecutionStatus;

    async fn handle(
        &mut self,
        _query: GetStatusQuery,
        _ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        self.get_status()
    }
}

impl Message<GetNodeStatsQuery> for StatusCollector {
    type Reply = Option<NodeStats>;

    async fn handle(
        &mut self,
        query: GetNodeStatsQuery,
        _ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        self.get_node_statistics(&query.0).cloned()
    }
}

impl Message<GetPerformanceReportQuery> for StatusCollector {
    type Reply = PerformanceReport;

    async fn handle(
        &mut self,
        _query: GetPerformanceReportQuery,
        _ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        self.generate_performance_report()
    }
}

impl Message<ResetStatsCommand> for StatusCollector {
    type Reply = ();

    async fn handle(
        &mut self,
        _command: ResetStatsCommand,
        _ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        self.reset_stats();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_status_collector_creation() {
        let collector = StatusCollector::new();
        assert_eq!(collector.total_executions, 0);
        assert_eq!(collector.successful_executions, 0);
        assert_eq!(collector.failed_executions, 0);
        assert!(collector.is_running_nodes_empty());
    }

    #[test]
    fn test_status_collector_with_history_size() {
        let collector = StatusCollector::with_history_size(500);
        assert_eq!(collector.max_history_size, 500);
    }

    #[test]
    fn test_execution_status_compatibility() {
        let collector = StatusCollector::new();
        let status = collector.get_status();

        assert!(!status.is_running);
        assert_eq!(status.active_nodes_count, 0);
        assert_eq!(status.total_executions, 0);
        assert!(status.is_healthy());
    }

    #[test]
    fn test_node_statistics_default() {
        let collector = StatusCollector::new();
        let stats = collector.get_all_node_statistics();
        assert!(stats.is_empty());
    }
}
