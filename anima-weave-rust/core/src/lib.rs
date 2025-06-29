pub mod actor;
pub mod event;
pub mod graph;
pub mod label;
pub mod signal;
pub mod state;
pub mod types;

// 导出系统级别类型别名
pub use types::{ExecutionId, NodeControlInputs, NodeDataInputs, NodeName, NodeOutputs, PortName};

// 明确导出，避免namespace冲突
pub use event::{
    EventMeta, NodeExecuteEvent, NodeExecutionEvent, NodeOutputEvent, NodeReadyEvent, NodeStatus,
    PortRef,
};
pub use graph::{ActivationMode, ConcurrentMode, Connection, Graph, GraphQuery, Node, Port};
pub use label::{ConversionFn, SemanticLabel, TransformError};
pub use signal::SignalLabel;

// 导出Actor抽象层
pub use actor::{
    Coordinator, CoordinatorError, DataStoreError, ExecutionPlan, GlobalState, NodeExecutionError,
    NodeExecutor, NodeState,
};
