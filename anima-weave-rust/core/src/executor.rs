use crate::{Node, Graph, GlobalState, NodeState, DataEvent, ControlEvent};

/// 节点执行器trait
pub trait NodeExecutor {
    fn execute(&self, inputs: NodeInputs) -> NodeOutputs;
    fn node_type(&self) -> &str;
}

/// 节点输入数据
#[derive(Debug)]
pub struct NodeInputs {
    pub data_inputs: std::collections::HashMap<String, Box<dyn crate::DynamicLabel>>,
    pub control_inputs: std::collections::HashMap<String, crate::event::ControlSignal>,
}

/// 节点输出数据
#[derive(Debug)]
pub struct NodeOutputs {
    pub data_outputs: std::collections::HashMap<String, Box<dyn crate::DynamicLabel>>,
    pub control_outputs: std::collections::HashMap<String, crate::event::ControlSignal>,
}

/// 协调器trait - 管理全局状态和调度执行
pub trait Coordinator {
    fn process_event(&mut self, event: Box<dyn crate::Event>);
    fn check_node_ready(&self, node_id: &str) -> bool;
    fn schedule_execution(&mut self, node_id: String);
    fn get_global_state(&self) -> &dyn GlobalState;
    fn get_global_state_mut(&mut self) -> &mut dyn GlobalState;
}

/// NodeReady检查器trait
pub trait ReadinessChecker {
    fn data_ready(&self, node: &Node, state: &dyn GlobalState) -> bool;
    fn control_active(&self, node: &Node, state: &dyn GlobalState) -> bool;
    fn node_ready(&self, node: &Node, state: &dyn GlobalState) -> bool {
        self.data_ready(node, state) && self.control_active(node, state)
    }
} 