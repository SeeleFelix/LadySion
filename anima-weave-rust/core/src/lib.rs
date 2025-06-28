pub mod types;
pub mod graph;
pub mod label;
pub mod signal;
pub mod event;

// 导出系统级别类型别名
pub use types::{NodeName, PortName, ExecutionId, NodeInputs, NodeOutputs};

// 明确导出，避免namespace冲突
pub use graph::{Graph, Port, Connection, Node};
pub use label::{SemanticLabel, TransformError, ConversionFn};
pub use signal::SignalLabel;
pub use event::{
    PortRef, 
    NodeStatus,
    EventMeta,
    DataEvent, 
    ControlEvent, 
    NodeExecuteEvent, 
    NodeExecutionEvent
};
