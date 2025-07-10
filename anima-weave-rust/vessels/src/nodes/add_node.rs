//! Add Node - 数学加法节点
//!
//! 使用新的Node trait接口实现

use crate::labels::NumberLabel;
use anima_weave_core::{AnimaWeaveError, NodeDataInputs, NodeDataOutputs, PortRef};
use anima_weave_node::{Node, NodeInfo, PortDef, register_node};
use anyhow::anyhow;
use std::boxed::Box;

/// 加法节点实现
///
/// 接收两个数字输入，输出它们的和
#[derive(Debug, Default)]
pub struct AddNode;

impl AddNode {
    pub fn new() -> Self {
        Self::default()
    }
}

// 节点信息的静态定义
static ADD_NODE_INFO: once_cell::sync::Lazy<NodeInfo> = once_cell::sync::Lazy::new(|| NodeInfo {
    name: "AddNode",
    description: "数学加法节点，计算两个数的和",
    input_ports: vec![
        PortDef::required_data::<NumberLabel>("a"),
        PortDef::required_data::<NumberLabel>("b"),
    ],
    output_ports: vec![PortDef::output_data::<NumberLabel>("result")],
});

impl Node for AddNode {
    fn info(&self) -> &'static NodeInfo {
        &ADD_NODE_INFO
    }

    fn execute(&self, inputs: NodeDataInputs) -> Result<NodeDataOutputs, AnimaWeaveError> {
        log::debug!("AddNode executing with {} inputs", inputs.len());

        // 获取输入参数
        let a_port = PortRef {
            node_name: "add".to_string(),
            port_name: "a".to_string(),
        };
        let b_port = PortRef {
            node_name: "add".to_string(),
            port_name: "b".to_string(),
        };

        let a = inputs
            .get(&a_port)
            .ok_or_else(|| anyhow!("Missing required input 'a'"))?;

        let b = inputs
            .get(&b_port)
            .ok_or_else(|| anyhow!("Missing required input 'b'"))?;

        // 尝试转换为NumberLabel
        let a_number = a
            .as_any()
            .downcast_ref::<NumberLabel>()
            .ok_or_else(|| anyhow!("Input 'a' must be a number"))?;

        let b_number = b
            .as_any()
            .downcast_ref::<NumberLabel>()
            .ok_or_else(|| anyhow!("Input 'b' must be a number"))?;

        // 执行加法运算
        let result_value = a_number.value + b_number.value;
        let result = NumberLabel {
            value: result_value,
        };

        // 构造输出
        let mut outputs = NodeDataOutputs::new();
        outputs.insert(
            PortRef {
                node_name: "add".to_string(),
                port_name: "result".to_string(),
            },
            Box::new(result),
        );

        log::debug!("AddNode produced result: {}", result_value);

        Ok(outputs)
    }
}

// 自动注册节点
register_node!(AddNode);

#[cfg(test)]
mod tests {
    use super::*;
    use crate::labels::{NumberLabel, StringLabel};
    use anima_weave_core::PortRef;
    use anyhow;

    #[test]
    fn test_add_node_basic() {
        let node = AddNode::new();
        assert_eq!(node.node_type(), "AddNode");

        let info = node.info();
        assert_eq!(info.name, "AddNode");
        assert_eq!(info.input_ports.len(), 2);
        assert_eq!(info.output_ports.len(), 1);
    }

    #[test]
    fn test_add_node_addition() {
        let node = AddNode::new();
        let mut inputs = NodeDataInputs::new();
        inputs.insert(
            PortRef {
                node_name: "add".to_string(),
                port_name: "a".to_string(),
            },
            Box::new(NumberLabel { value: 5.0 }),
        );
        inputs.insert(
            PortRef {
                node_name: "add".to_string(),
                port_name: "b".to_string(),
            },
            Box::new(NumberLabel { value: 3.0 }),
        );

        let result = node.execute(inputs);
        assert!(result.is_ok());

        let outputs = result.unwrap();
        let result_port = PortRef {
            node_name: "add".to_string(),
            port_name: "result".to_string(),
        };
        assert!(outputs.contains_key(&result_port));

        if let Some(result_box) = outputs.get(&result_port) {
            if let Some(number_result) = result_box.as_any().downcast_ref::<NumberLabel>() {
                assert_eq!(number_result.value, 8.0);
            } else {
                panic!("Expected NumberLabel result");
            }
        } else {
            panic!("Expected result output");
        }
    }

    #[test]
    fn test_add_node_missing_input() {
        let node = AddNode::new();
        let mut inputs = NodeDataInputs::new();
        inputs.insert(
            PortRef {
                node_name: "add".to_string(),
                port_name: "a".to_string(),
            },
            Box::new(NumberLabel { value: 5.0 }),
        );
        // 缺少 'b' 输入

        let result = node.execute(inputs);
        assert!(result.is_err());

        assert!(result.unwrap_err().is::<anyhow::Error>());
    }

    #[test]
    fn test_add_node_invalid_type() {
        let node = AddNode::new();
        let mut inputs = NodeDataInputs::new();
        inputs.insert(
            PortRef {
                node_name: "add".to_string(),
                port_name: "a".to_string(),
            },
            Box::new(StringLabel {
                value: "not a number".to_string(),
            }),
        );
        inputs.insert(
            PortRef {
                node_name: "add".to_string(),
                port_name: "b".to_string(),
            },
            Box::new(NumberLabel { value: 5.0 }),
        );

        let result = node.execute(inputs);
        assert!(result.is_err());

        assert!(result.unwrap_err().is::<anyhow::Error>());
    }
}
