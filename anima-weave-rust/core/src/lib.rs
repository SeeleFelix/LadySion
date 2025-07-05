//! AnimaWeave Core Library
//!
//! This crate defines the foundational data structures, traits, and events
//! that form the core of the AnimaWeave execution engine.

// Top-level modules
pub mod actor;
pub mod error_handling;
pub mod event;
pub mod graph;
pub mod in_memory_graph;
pub mod label;
pub mod signal;
pub mod types;

// Re-export key types for convenient access by other crates.

pub use error_handling::AnimaWeaveError;

pub use graph::{Graph, GraphQuery};
pub use label::SemanticLabel;
pub use signal::SignalLabel;
pub use types::{NodeControlInputs, NodeDataInputs, NodeDataOutputs};

/// 分布式Actor系统的Node trait
/// 与anima_weave_node::node::Node兼容的接口
pub trait Node: Send + Sync + std::fmt::Debug {
    /// 执行节点逻辑
    fn execute(&self, inputs: &NodeDataInputs) -> Result<NodeDataOutputs, AnimaWeaveError>;
    
    /// 获取节点类型名称
    fn node_type(&self) -> &'static str;
    
    /// 检查节点是否准备就绪
    fn is_ready(&self) -> bool {
        true
    }
}


