//! AnimaWeave 分布式Actor系统
//!
//! 定义了AnimaWeave系统中的分布式Actor架构：
//! - StatusCollector: 被动状态收集器，监控整个图的执行状态
//! - DistributedNodeActor: 自主执行单元，维护自己的状态和数据
//!
//! 这些Actor通过直接消息传递实现完全分布式的图计算

pub mod coordinator;
pub mod errors;
pub mod node_actor;
pub mod status_collector;

// 导出核心Actor
pub use coordinator::Coordinator;
pub use node_actor::{DistributedNodeActor, GetNodeInfoQuery, GetNodeStateQuery, NodeInfo};
pub use status_collector::StatusCollector;

// 导出类型定义
pub use errors::{CoordinatorError, DataStoreError};

// 从 distributed_node_actor.rs 重新导出 NodeActor 相关类型
pub use node_actor::distributed_node_actor::{NodeState, NodeExecutionEvent, ExecutionStats};

// 从 status_collector.rs 重新导出 StatusCollector 相关类型
pub use status_collector::{
    DetailedExecutionRecord, DetailedExecutionStatus, ExecutionStatus, 
    MessageStats, NodeStats, PerformanceReport, SystemMetrics
};
