//! Coordinator实现 - 纯监控器
//!
//! 分布式架构下的监控器，只负责：
//! - 监控节点执行状态
//! - 收集执行统计信息
//! - 提供系统状态查询

use crate::actor::errors::CoordinatorError;
use crate::actor::status_collector::{GetPerformanceReportQuery, GetStatusQuery, StatusCollector};
use crate::actor::types::*;
use crate::types::NodeName;
use kameo::actor::{ActorRef, WeakActorRef};
use kameo::error::ActorStopReason;
use kameo::message::{Context, Message};
use kameo::Actor;
use log;
use std::collections::HashMap;
use std::time::SystemTime;

// ExecutionStatus 现在使用 types 模块中的定义

/// 简化的Coordinator - 专注于高级监控和报告
///
/// 分布式架构下的监控器：
/// - 提供系统级别的状态查询接口
/// - 生成执行报告和性能分析
/// - 不参与实际的执行调度和数据管理
/// - 作为StatusCollector的高级封装
pub struct Coordinator {
    /// StatusCollector引用
    status_collector: ActorRef<StatusCollector>,

    /// 系统启动时间
    start_time: SystemTime,

    /// 监控配置
    monitoring_enabled: bool,
    report_interval_seconds: u64,
}

impl Coordinator {
    /// 创建新的监控型Coordinator
    pub fn new(status_collector: ActorRef<StatusCollector>) -> Self {
        Self {
            status_collector,
            start_time: SystemTime::now(),
            monitoring_enabled: true,
            report_interval_seconds: 60,
        }
    }

    /// 创建带自定义配置的Coordinator
    pub fn with_config(
        status_collector: ActorRef<StatusCollector>,
        monitoring_enabled: bool,
        report_interval_seconds: u64,
    ) -> Self {
        Self {
            status_collector,
            start_time: SystemTime::now(),
            monitoring_enabled,
            report_interval_seconds,
        }
    }

    /// 获取系统整体状态 (代理到StatusCollector)
    pub async fn get_status(&self) -> Result<ExecutionStatus, CoordinatorError> {
        self.status_collector
            .ask(GetStatusQuery)
            .await
            .map_err(|e| CoordinatorError::StatusQueryFailed(e.to_string()))
    }

    /// 获取系统性能报告 (代理到StatusCollector)
    pub async fn get_performance_report(&self) -> Result<PerformanceReport, CoordinatorError> {
        self.status_collector
            .ask(GetPerformanceReportQuery)
            .await
            .map_err(|e| CoordinatorError::ReportGenerationFailed(e.to_string()))
    }

    /// 获取系统运行时长
    pub fn get_uptime(&self) -> std::time::Duration {
        self.start_time.elapsed().unwrap_or_default()
    }

    /// 启用/禁用监控
    pub fn set_monitoring_enabled(&mut self, enabled: bool) {
        self.monitoring_enabled = enabled;
        log::info!(
            "(Coordinator) Monitoring {}",
            if enabled { "enabled" } else { "disabled" }
        );
    }

    /// 检查监控是否启用
    pub fn is_monitoring_enabled(&self) -> bool {
        self.monitoring_enabled
    }

    /// 设置报告间隔
    pub fn set_report_interval(&mut self, seconds: u64) {
        self.report_interval_seconds = seconds;
        log::info!("(Coordinator) Report interval set to {} seconds", seconds);
    }

    /// 生成系统概览
    pub async fn generate_system_overview(&self) -> Result<SystemOverview, CoordinatorError> {
        let status = self.get_status().await?;
        let performance_report = self.get_performance_report().await?;

        Ok(SystemOverview {
            uptime: self.get_uptime(),
            monitoring_enabled: self.monitoring_enabled,
            execution_status: status,
            performance_summary: PerformanceSummary {
                total_nodes: performance_report.node_performance.len(),
                active_nodes: performance_report.overall_stats.active_nodes_count,
                throughput: performance_report.system_metrics.system_throughput,
                peak_concurrency: performance_report.system_metrics.peak_concurrent_executions,
            },
            health_status: self.assess_system_health(&performance_report),
        })
    }

    /// 评估系统健康状态
    fn assess_system_health(&self, report: &PerformanceReport) -> SystemHealth {
        let overall_success_rate = report.overall_stats.success_rate();

        if overall_success_rate >= 0.95 {
            SystemHealth::Excellent
        } else if overall_success_rate >= 0.85 {
            SystemHealth::Good
        } else if overall_success_rate >= 0.70 {
            SystemHealth::Fair
        } else if overall_success_rate >= 0.50 {
            SystemHealth::Poor
        } else {
            SystemHealth::Critical
        }
    }
}

/// 系统概览
#[derive(Debug, Clone)]
pub struct SystemOverview {
    pub uptime: std::time::Duration,
    pub monitoring_enabled: bool,
    pub execution_status: ExecutionStatus,
    pub performance_summary: PerformanceSummary,
    pub health_status: SystemHealth,
}

/// 性能摘要
#[derive(Debug, Clone)]
pub struct PerformanceSummary {
    pub total_nodes: usize,
    pub active_nodes: usize,
    pub throughput: f64,
    pub peak_concurrency: usize,
}

/// 系统健康状态
#[derive(Debug, Clone, PartialEq)]
pub enum SystemHealth {
    Excellent,
    Good,
    Fair,
    Poor,
    Critical,
}

impl Default for Coordinator {
    fn default() -> Self {
        // 注意：这里需要一个StatusCollector引用，但在default中无法提供
        // 实际使用时应该用new()方法
        panic!("Coordinator requires a StatusCollector reference. Use Coordinator::new() instead.");
    }
}

impl Actor for Coordinator {
    type Args = Self;
    type Error = CoordinatorError;

    async fn on_start(
        coordinator: Self::Args,
        _actor_ref: ActorRef<Self>,
    ) -> Result<Self, Self::Error> {
        log::info!("Starting monitoring Coordinator");
        Ok(coordinator)
    }

    async fn on_stop(
        &mut self,
        _actor_ref: WeakActorRef<Self>,
        _reason: ActorStopReason,
    ) -> Result<(), Self::Error> {
        log::info!("Stopping monitoring Coordinator");
        Ok(())
    }
}

/// 查询消息类型
#[derive(Debug)]
pub struct GetSystemStatusQuery;

#[derive(Debug)]
pub struct GetSystemOverviewQuery;

#[derive(Debug)]
pub struct SetMonitoringCommand(pub bool);

#[derive(Debug)]
pub struct SetReportIntervalCommand(pub u64);

impl Message<GetSystemStatusQuery> for Coordinator {
    type Reply = Result<ExecutionStatus, CoordinatorError>;

    async fn handle(
        &mut self,
        _query: GetSystemStatusQuery,
        _ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        self.get_status().await
    }
}

impl Message<GetSystemOverviewQuery> for Coordinator {
    type Reply = Result<SystemOverview, CoordinatorError>;

    async fn handle(
        &mut self,
        _query: GetSystemOverviewQuery,
        _ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        self.generate_system_overview().await
    }
}

impl Message<SetMonitoringCommand> for Coordinator {
    type Reply = ();

    async fn handle(
        &mut self,
        command: SetMonitoringCommand,
        _ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        self.set_monitoring_enabled(command.0);
    }
}

impl Message<SetReportIntervalCommand> for Coordinator {
    type Reply = ();

    async fn handle(
        &mut self,
        command: SetReportIntervalCommand,
        _ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        self.set_report_interval(command.0);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::actor::status_collector::StatusCollector;
    use kameo::Actor;

    #[tokio::test]
    async fn test_coordinator_creation() {
        let status_collector = Actor::spawn(StatusCollector::new());

        let coordinator = Coordinator::new(status_collector);
        assert!(coordinator.is_monitoring_enabled());
        assert_eq!(coordinator.report_interval_seconds, 60);
    }

    #[tokio::test]
    async fn test_coordinator_configuration() {
        let status_collector = Actor::spawn(StatusCollector::new());

        let mut coordinator = Coordinator::with_config(status_collector, false, 30);
        assert!(!coordinator.is_monitoring_enabled());
        assert_eq!(coordinator.report_interval_seconds, 30);

        coordinator.set_monitoring_enabled(true);
        assert!(coordinator.is_monitoring_enabled());

        coordinator.set_report_interval(120);
        assert_eq!(coordinator.report_interval_seconds, 120);
    }

    #[tokio::test]
    async fn test_system_health_assessment() {
        let status_collector = Actor::spawn(StatusCollector::new());
        let coordinator = Coordinator::new(status_collector);

        // 创建模拟的性能报告
        let report = PerformanceReport {
            overall_stats: ExecutionStatus {
                is_running: false,
                active_nodes_count: 0,
                total_executions: 100,
                successful_executions: 95,
                failed_executions: 5,
                last_activity: None,
                current_error: None,
            },
            node_performance: HashMap::new(),
            system_metrics: SystemMetrics::default(),
            top_performers: Vec::new(),
            bottlenecks: Vec::new(),
        };

        let health = coordinator.assess_system_health(&report);
        assert_eq!(health, SystemHealth::Excellent);
    }
}
