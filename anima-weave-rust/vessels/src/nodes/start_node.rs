//! Start Node - 图的起始节点
//!
//! 使用新的Node trait接口实现

use crate::labels::{NumberLabel, StringLabel};
use anima_weave_core::{AnimaWeaveError, NodeDataInputs, NodeDataOutputs, PortRef};
use anima_weave_node::{Node, NodeInfo, PortDef, register_node};
use std::boxed::Box;

/// 起始节点实现
///
/// 负责启动图的执行，产生初始信号
#[derive(Debug, Default)]
pub struct StartNode {
    /// 初始数值，如果有的话
    pub initial_number: Option<f64>,
    /// 初始字符串，如果有的话
    pub initial_string: Option<String>,
}

impl StartNode {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn with_number(value: f64) -> Self {
        Self {
            initial_number: Some(value),
            initial_string: None,
        }
    }

    pub fn with_string(value: String) -> Self {
        Self {
            initial_number: None,
            initial_string: Some(value),
        }
    }
}

// 节点信息的静态定义
static START_NODE_INFO: once_cell::sync::Lazy<NodeInfo> = once_cell::sync::Lazy::new(|| {
    NodeInfo {
        name: "StartNode",
        description: "图的起始节点，产生初始信号",
        input_ports: vec![
            // 起始节点通常不需要输入端口
        ],
        output_ports: vec![
            PortDef::output_data::<NumberLabel>("number_value"),
            PortDef::output_data::<StringLabel>("string_value"),
        ],
    }
});

impl Node for StartNode {
    fn info(&self) -> &'static NodeInfo {
        &START_NODE_INFO
    }

    fn execute(&self, _inputs: NodeDataInputs) -> Result<NodeDataOutputs, AnimaWeaveError> {
        log::debug!("StartNode executing");

        let mut outputs = NodeDataOutputs::new();

        // 如果有初始数值，输出它
        if let Some(number) = self.initial_number {
            outputs.insert(
                PortRef {
                    node_name: "start".to_string(),
                    port_name: "number_value".to_string(),
                },
                Box::new(NumberLabel { value: number }),
            );
        }

        // 如果有初始字符串，输出它
        if let Some(string) = &self.initial_string {
            outputs.insert(
                PortRef {
                    node_name: "start".to_string(),
                    port_name: "string_value".to_string(),
                },
                Box::new(StringLabel {
                    value: string.clone(),
                }),
            );
        }

        log::debug!("StartNode produced {} outputs", outputs.len());

        Ok(outputs)
    }
}

// 自动注册节点
register_node!(StartNode);

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_start_node_basic() {
        let node = StartNode::new();
        assert_eq!(node.node_type(), "StartNode");

        let info = node.info();
        assert_eq!(info.name, "StartNode");
        assert_eq!(info.input_ports.len(), 0);
        assert_eq!(info.output_ports.len(), 2);
    }

    #[test]
    fn test_start_node_execution() {
        let node = StartNode::new();
        let inputs = NodeDataInputs::new();

        let result = node.execute(inputs);
        assert!(result.is_ok());

        let outputs = result.unwrap();
        assert!(outputs.contains_key(&PortRef {
            node_name: "start".to_string(),
            port_name: "number_value".to_string(),
        }));

        // 验证输出是Signal类型
        if let Some(number_box) = outputs.get(&PortRef {
            node_name: "start".to_string(),
            port_name: "number_value".to_string(),
        }) {
            assert_eq!(number_box.get_semantic_label_type(), "NumberLabel");
        } else {
            panic!("Expected Number output");
        }
    }

    #[test]
    fn test_start_node_with_number() {
        let node = StartNode::with_number(42.0);

        let inputs = NodeDataInputs::new();
        let result = node.execute(inputs);
        assert!(result.is_ok());

        let outputs = result.unwrap();
        assert!(outputs.contains_key(&PortRef {
            node_name: "start".to_string(),
            port_name: "number_value".to_string(),
        }));
        assert!(outputs.contains_key(&PortRef {
            node_name: "start".to_string(),
            port_name: "string_value".to_string(),
        }));

        // 验证数值输出
        if let Some(number_box) = outputs.get(&PortRef {
            node_name: "start".to_string(),
            port_name: "number_value".to_string(),
        }) {
            assert_eq!(number_box.get_semantic_label_type(), "NumberLabel");
        } else {
            panic!("Expected Number output");
        }
    }

    #[test]
    fn test_start_node_with_string() {
        let node = StartNode::with_string("hello".to_string());

        let inputs = NodeDataInputs::new();
        let result = node.execute(inputs);
        assert!(result.is_ok());

        let outputs = result.unwrap();
        assert!(outputs.contains_key(&PortRef {
            node_name: "start".to_string(),
            port_name: "number_value".to_string(),
        }));
        assert!(outputs.contains_key(&PortRef {
            node_name: "start".to_string(),
            port_name: "string_value".to_string(),
        }));

        // 验证字符串输出
        if let Some(string_box) = outputs.get(&PortRef {
            node_name: "start".to_string(),
            port_name: "string_value".to_string(),
        }) {
            assert_eq!(string_box.get_semantic_label_type(), "StringLabel");
        } else {
            panic!("Expected String output");
        }
    }
}
