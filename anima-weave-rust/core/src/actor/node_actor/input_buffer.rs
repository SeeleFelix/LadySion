use crate::label::SemanticLabel;
use crate::signal::SignalLabel;
use crate::types::{PortRef, NodeDataInputs};
use std::collections::HashMap;
use std::sync::Arc;

/// 数据缓存组件 - 负责暂存输入数据
#[derive(Debug)]
pub struct InputBuffer {
    pending_data_inputs: HashMap<PortRef, Arc<dyn SemanticLabel>>,
    pending_control_inputs: HashMap<PortRef, SignalLabel>,
}

impl InputBuffer {
    pub fn new() -> Self {
        Self {
            pending_data_inputs: HashMap::new(),
            pending_control_inputs: HashMap::new(),
        }
    }

    /// 存储数据输入
    pub fn store_data(&mut self, port: PortRef, data: Arc<dyn SemanticLabel>) {
        self.pending_data_inputs.insert(port, data);
    }

    /// 存储控制输入
    pub fn store_control(&mut self, port: PortRef, signal: SignalLabel) {
        self.pending_control_inputs.insert(port, signal);
    }

    /// 消费输入数据，准备执行
    pub fn consume_inputs(&mut self, data_ports: &[PortRef], control_ports: &[PortRef]) -> NodeDataInputs {
        let mut inputs = NodeDataInputs::new();

        // 添加数据输入
        for port in data_ports {
            if let Some(data) = self.pending_data_inputs.remove(port) {
                inputs.insert(port.clone(), data);
            }
        }

        // 添加控制信号
        for port in control_ports {
            if let Some(signal) = self.pending_control_inputs.remove(port) {
                inputs.insert(port.clone(), Arc::new(signal));
            }
        }

        inputs
    }

    /// 检查是否有必需的数据
    pub fn has_required_data(&self, required_ports: &[PortRef]) -> bool {
        for port in required_ports {
            if !self.pending_data_inputs.contains_key(port) {
                return false;
            }
        }
        true
    }

    /// 检查是否有控制输入
    pub fn has_control_input(&self, port: &PortRef) -> bool {
        self.pending_control_inputs.contains_key(port)
    }

    /// 获取待处理输入数量
    pub fn get_pending_count(&self) -> (usize, usize) {
        (self.pending_data_inputs.len(), self.pending_control_inputs.len())
    }

    /// 获取所有可用输入数据（不消费，让engine自己决定需要什么）
    pub fn get_all_available_inputs(&mut self) -> NodeDataInputs {
        let mut inputs = NodeDataInputs::new();

        // 添加所有数据输入并清空缓存
        for (port, data) in self.pending_data_inputs.drain() {
            inputs.insert(port, data);
        }

        // 添加所有控制信号并清空缓存
        for (port, signal) in self.pending_control_inputs.drain() {
            inputs.insert(port, Arc::new(signal));
        }

        inputs
    }
} 