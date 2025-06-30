//! 系统级别类型别名和通用类型定义
//!
//! 这里集中管理所有跨模块使用的类型别名，让代码更清晰易懂

pub use crate::event::types::PortRef;
use crate::SemanticLabel;
use std::collections::HashMap;

/// =========================
/// 基础标识类型别名
/// =========================

/// 节点名称 - 图中节点的唯一标识
pub type NodeName = String;

/// 端口名称 - 节点内端口的标识
pub type PortName = String;

/// 执行ID - 每次节点执行的唯一标识
pub type ExecutionId = String;

/// =========================
/// 数据结构类型别名  
/// =========================

/// 节点输入数据集合 - 目标节点输入端口到数据的映射
///
/// 用于NodeExecuteEvent中传递给目标节点的数据输入
pub type NodeDataInputs = HashMap<PortRef, Box<dyn SemanticLabel>>;

/// 节点控制输入集合 - 目标节点控制端口到信号的映射
///
/// 用于NodeExecuteEvent中传递给目标节点的控制信号
pub type NodeControlInputs = HashMap<PortRef, crate::SignalLabel>;

/// 节点输出数据集合 - 目标节点输出端口到数据的映射
/// 数据输出集合 - 数据端口到数据的映射
pub type NodeDataOutputs = HashMap<PortRef, Box<dyn SemanticLabel>>;

/// 控制输出集合 - 控制端口到信号的映射
pub type NodeControlOutputs = HashMap<PortRef, crate::SignalLabel>;

#[cfg(test)]
mod tests {
    use super::*;
    use crate::SignalLabel;

    #[test]
    fn test_type_aliases() {
        let node_name: NodeName = "test_node".to_string();
        let port_name: PortName = "input_port".to_string();
        let exec_id: ExecutionId = "exec_123".to_string();

        // 类型别名应该和String兼容
        assert_eq!(node_name, "test_node");
        assert_eq!(port_name, "input_port");
        assert_eq!(exec_id, "exec_123");
    }

    #[test]
    fn test_node_data_inputs() {
        let mut data_inputs: NodeDataInputs = HashMap::new();
        // 目标节点的数据输入端口
        let input_port1 = PortRef::new("target_node", "data_input1");
        let input_port2 = PortRef::new("target_node", "data_input2");

        data_inputs.insert(input_port1, Box::new(SignalLabel::active()));
        data_inputs.insert(input_port2, Box::new(SignalLabel::inactive()));

        assert_eq!(data_inputs.len(), 2);
    }

    #[test]
    fn test_node_control_inputs() {
        let mut control_inputs: NodeControlInputs = HashMap::new();
        // 目标节点的控制输入端口
        let control_port1 = PortRef::new("target_node", "control_input1");
        let control_port2 = PortRef::new("target_node", "control_input2");

        control_inputs.insert(control_port1, SignalLabel::active());
        control_inputs.insert(control_port2, SignalLabel::inactive());

        assert_eq!(control_inputs.len(), 2);
    }

    #[test]
    fn test_node_outputs() {
        let mut outputs: NodeDataOutputs = HashMap::new();
        // 目标节点的输出端口
        let output_port = PortRef::new("target_node", "output");
        outputs.insert(output_port, Box::new(SignalLabel::active()));

        assert_eq!(outputs.len(), 1);
    }
}
