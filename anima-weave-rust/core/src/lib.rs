pub mod graph;
pub mod label;
pub mod node;
pub mod types;

// 重新导出核心类型
pub use graph::{Graph, PortRef};
pub use label::SemanticLabel;
pub use node::{Node, NodeInfo, PortDef};
pub use types::{NodeDataInputs, NodeDataOutputs, NodeName, PortName};

/// Error type for AnimaWeave operations
pub type AnimaWeaveError = anyhow::Error;
