use crate::{Port, DynamicLabel};
use crate::event::ControlSignal;
use std::collections::HashMap;

/// 全局执行状态 Ω = (Σ_data, Σ_control, Σ_node)
pub trait GlobalState {
    fn get_data_value(&self, port: &Port) -> Option<&dyn DynamicLabel>;
    fn set_data_value(&mut self, port: Port, value: Box<dyn DynamicLabel>);
    
    fn get_control_value(&self, port: &Port) -> ControlSignal;
    fn set_control_value(&mut self, port: Port, signal: ControlSignal);
    
    fn get_node_state(&self, node_id: &str) -> NodeState;
    fn set_node_state(&mut self, node_id: String, state: NodeState);
}

/// 节点执行状态
#[derive(Debug, Clone, PartialEq)]
pub enum NodeState {
    Ready,
    Running,
    Completed,
    Blocked,
}

/// 全局状态的具体实现
#[derive(Debug)]
pub struct RuntimeState {
    pub data_state: HashMap<Port, Box<dyn DynamicLabel>>,
    pub control_state: HashMap<Port, ControlSignal>,
    pub node_state: HashMap<String, NodeState>,
}

impl Default for RuntimeState {
    fn default() -> Self {
        Self {
            data_state: HashMap::new(),
            control_state: HashMap::new(),
            node_state: HashMap::new(),
        }
    }
}

impl GlobalState for RuntimeState {
    fn get_data_value(&self, port: &Port) -> Option<&dyn DynamicLabel> {
        self.data_state.get(port).map(|v| v.as_ref())
    }
    
    fn set_data_value(&mut self, port: Port, value: Box<dyn DynamicLabel>) {
        self.data_state.insert(port, value);
    }
    
    fn get_control_value(&self, port: &Port) -> ControlSignal {
        self.control_state.get(port).cloned().unwrap_or(ControlSignal::NoInput)
    }
    
    fn set_control_value(&mut self, port: Port, signal: ControlSignal) {
        self.control_state.insert(port, signal);
    }
    
    fn get_node_state(&self, node_id: &str) -> NodeState {
        self.node_state.get(node_id).cloned().unwrap_or(NodeState::Ready)
    }
    
    fn set_node_state(&mut self, node_id: String, state: NodeState) {
        self.node_state.insert(node_id, state);
    }
} 