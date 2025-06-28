pub mod actor;
pub mod event;
pub mod graph;
pub mod label;
pub mod signal;
pub mod types;

// 导出系统级别类型别名
pub use types::{ExecutionId, NodeInputs, NodeName, NodeOutputs, PortName};

// 明确导出，避免namespace冲突
pub use event::{
    ControlEvent, DataEvent, EventMeta, NodeExecuteEvent, NodeExecutionEvent, NodeStatus, PortRef,
};
pub use graph::{ActivationMode, ConcurrentMode, Connection, Graph, GraphQuery, Node, Port};
pub use label::{ConversionFn, SemanticLabel, TransformError};
pub use signal::SignalLabel;

// 导出Actor抽象层
pub use actor::{
    Coordinator, CoordinatorError, DataStore, DataStoreError, ExecutionPlan, GlobalState,
    NodeExecutionError, NodeExecutor, NodeState,
};
