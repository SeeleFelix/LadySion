//! Random Node - 随机数生成节点
//!
//! 使用新的Node trait接口实现

use crate::labels::NumberLabel;
use anima_weave_core::{AnimaWeaveError, NodeDataInputs, NodeDataOutputs, PortRef};
use anima_weave_node::{Node, NodeInfo, PortDef, register_node};
use std::boxed::Box;

/// 随机数节点实现
///
/// 生成一个随机数值
#[derive(Debug, Default)]
pub struct RandomNode;

impl RandomNode {
    pub fn new() -> Self {
        Self::default()
    }
}

// 节点信息的静态定义
static RANDOM_NODE_INFO: once_cell::sync::Lazy<NodeInfo> =
    once_cell::sync::Lazy::new(|| NodeInfo {
        name: "RandomNode",
        description: "随机数生成节点，产生一个随机数值",
        input_ports: vec![],
        output_ports: vec![PortDef::output_data::<NumberLabel>("random_value")],
    });

impl Node for RandomNode {
    fn info(&self) -> &'static NodeInfo {
        &RANDOM_NODE_INFO
    }

    fn execute(&self, _inputs: NodeDataInputs) -> Result<NodeDataOutputs, AnimaWeaveError> {
        log::debug!("RandomNode executing");

        // 生成一个随机数 (1-100)
        let random_value = rand::random::<f64>() * 100.0;

        let result = NumberLabel {
            value: random_value,
        };

        // 构造输出
        let mut outputs = NodeDataOutputs::new();
        outputs.insert(
            PortRef {
                node_name: "random".to_string(),
                port_name: "random_value".to_string(),
            },
            Box::new(result),
        );

        log::info!("RandomNode produced random value: {}", random_value);

        Ok(outputs)
    }
}

// 自动注册节点
register_node!(RandomNode);

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_random_node_basic() {
        let node = RandomNode::new();
        assert_eq!(node.node_type(), "RandomNode");

        let info = node.info();
        assert_eq!(info.name, "RandomNode");
        assert_eq!(info.input_ports.len(), 0);
        assert_eq!(info.output_ports.len(), 1);
    }

    #[test]
    fn test_random_node_execution() {
        let node = RandomNode::new();
        let inputs = NodeDataInputs::new();

        let result = node.execute(inputs);
        assert!(result.is_ok());

        let outputs = result.unwrap();
        let result_port = PortRef {
            node_name: "random".to_string(),
            port_name: "random_value".to_string(),
        };
        assert!(outputs.contains_key(&result_port));

        if let Some(result_box) = outputs.get(&result_port) {
            if let Some(number_result) = result_box.as_any().downcast_ref::<NumberLabel>() {
                assert!(number_result.value >= 0.0 && number_result.value <= 100.0);
            } else {
                panic!("Expected NumberLabel result");
            }
        } else {
            panic!("Expected result output");
        }
    }
}
