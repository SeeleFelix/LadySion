//! `anima-weave-node` Crate: The core execution logic for AnimaWeave nodes.
//!
//! This crate defines the `Node` trait and other essential components 
//! for running and managing individual nodes within the graph.

pub mod factory;
pub mod macros;
pub mod node;
pub mod registry;

// 导出核心接口
pub use factory::{create_node_by_type, create_node_factory, get_registered_node_types};
pub use node::{Node, NodeInfo, PortDef};
pub use registry::NodeRegistration;

// 宏会自动导出到crate根部，不需要手动重新导出
