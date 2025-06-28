//! 系统级别类型别名和通用类型定义
//! 
//! 这里集中管理所有跨模块使用的类型别名，让代码更清晰易懂

use std::collections::HashMap;
use crate::SemanticLabel;

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

/// 节点输入数据集合 - 端口名到数据的映射
/// 
/// 用于NodeExecuteEvent中传递完整的输入数据
pub type NodeInputs = HashMap<PortName, Box<dyn SemanticLabel>>;

/// 节点输出数据集合 - 端口名到数据的映射
/// 
/// 用于NodeActor执行完成后返回结果
pub type NodeOutputs = HashMap<PortName, Box<dyn SemanticLabel>>;

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
    fn test_node_inputs() {
        let mut inputs: NodeInputs = HashMap::new();
        inputs.insert("port1".to_string(), Box::new(SignalLabel::active()));
        inputs.insert("port2".to_string(), Box::new(SignalLabel::inactive()));
        
        assert_eq!(inputs.len(), 2);
        assert!(inputs.contains_key("port1"));
        assert!(inputs.contains_key("port2"));
        assert!(!inputs.contains_key("port3"));
    }

    #[test]
    fn test_node_outputs() {
        let mut outputs: NodeOutputs = HashMap::new();
        outputs.insert("result".to_string(), Box::new(SignalLabel::active()));
        
        assert_eq!(outputs.len(), 1);
        assert!(outputs.contains_key("result"));
    }
} 