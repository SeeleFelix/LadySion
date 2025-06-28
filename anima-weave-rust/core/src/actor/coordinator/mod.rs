//! CoordinatorActor 实现
//!
//! CoordinatorActor是AnimaWeave系统的图执行引擎，使用Kameo Actor模型实现：
//! - 通过lookup机制实现完全解耦的事件传递
//! - 基于消息传递的异步处理
//! - 自动注册到全局registry供其他Actor查找

pub mod coordinator;

// 导出核心实现和类型
pub use crate::actor::CoordinatorError;
pub use coordinator::{Coordinator, ExecutionStatus, GetStatusQuery};
