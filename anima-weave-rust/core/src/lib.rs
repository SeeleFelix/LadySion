pub mod graph;
pub mod label;
pub mod signal;

// 明确导出，避免namespace冲突
pub use graph::{Graph, Port, Connection, Node};
pub use label::{SemanticLabel, TransformError, ConversionFn};
pub use signal::SignalLabel;
