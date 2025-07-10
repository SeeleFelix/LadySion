pub mod actor;
pub mod status_tracker;

/// 简化版 GraphRunner —— 负责：
/// 1. 根据 Graph 创建 SimpleNodeActor 并连线
/// 2. 提供 launch(start_node) 运行入口
/// 该实现目前仅满足 CLI 演示需求，后续可逐步增强。
#[allow(unused_imports)]
pub mod graph_runner {}

// 重新导出主要类型
pub use actor::{DataInputMessage, ExecutionId, GetNodeStatusQuery, NodeStatus, SimpleNodeActor};

pub use status_tracker::{
    GetNodeStatsQuery, GetSystemStatsQuery, NodeExecutionStats, NodeStatusEvent, ResetStatsCommand,
    SimpleStatusTracker, SystemStats,
};
