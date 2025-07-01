//! MathNode - 数学运算节点
//!
//! 接收数值输入并执行加法运算

use anima_weave_core::{
    actor::{NodeExecutor, NodeExecutionError},
    actor::node::{NodeInfo, PortDef},
    NodeDataInputs, NodeControlInputs, NodeDataOutputs, NodeControlOutputs,
    PortRef, SignalLabel
};
use crate::NumberLabel;
use async_trait::async_trait;
use log;

/// MathNode - 执行加法运算的节点
pub struct MathNode {
    /// 要添加的固定值
    add_value: f64,
}

impl MathNode {
    /// 创建新的MathNode
    pub fn new(add_value: f64) -> Self {
        Self { add_value }
    }
}

#[async_trait]
impl NodeExecutor for MathNode {
    async fn execute(
        &self,
        data_inputs: NodeDataInputs,
        _control_inputs: NodeControlInputs,
    ) -> Result<(NodeDataOutputs, NodeControlOutputs), NodeExecutionError> {
        log::info!("(MathNode) Executing...");
        let a = data_inputs
            .get(&PortRef::new("math", "a"))
            .and_then(|label| label.as_any().downcast_ref::<NumberLabel>())
            .map(|n| n.value)
            .ok_or_else(|| NodeExecutionError::InputError {
                port_name: "a".to_string(),
                reason: "Input 'a' is missing or not a NumberLabel".to_string(),
            })?;

        let result = a + self.add_value;
        log::info!("(MathNode) Calculation result: {}", result);

        let mut data_outputs = NodeDataOutputs::new();
        data_outputs.insert(PortRef::new("math", "result"), Box::new(NumberLabel { value: result }));

        let mut control_outputs = NodeControlOutputs::new();
        control_outputs.insert(PortRef::new("math", "done"), SignalLabel::active());

        Ok((data_outputs, control_outputs))
    }

    fn get_node_info(&self) -> &NodeInfo {
        use std::sync::OnceLock;
        static NODE_INFO: OnceLock<NodeInfo> = OnceLock::new();
        NODE_INFO.get_or_init(|| {
            NodeInfo::new(
                "MathNode",
                vec![
                    PortDef::required("a", "NumberLabel"),
                ],
                vec![
                    PortDef::output("result", "NumberLabel"),
                    PortDef::output("done", "SignalLabel"),
                ],
            )
        })
    }
} 