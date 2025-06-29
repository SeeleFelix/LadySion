//! AnimaWeave Actor抽象层
//!
//! 定义了AnimaWeave系统中三个核心Actor的抽象能力：
//! - CoordinatorActor: 全局调度大脑，管理状态和调度执行
//! - DataBus: 数据流路由引擎，处理数据传递和转换
//! - NodeActor: 计算执行单元，执行具体的业务逻辑
//!
//! 这些trait定义了清晰的职责边界和接口契约

pub mod coordinator;
pub mod databus;
pub mod errors;
pub mod node;
pub mod types;

// 导出核心抽象trait
pub use coordinator::Coordinator;
pub use node::NodeExecutor;

// 导出类型定义
pub use errors::{CoordinatorError, DataStoreError, NodeExecutionError};
pub use types::{ExecutionPlan, GlobalState, NodeState};
