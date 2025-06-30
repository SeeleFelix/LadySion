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
use std::collections::HashMap;

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
        // 获取输入值
        let input_port = PortRef::new("math", "input");
        let input_data = data_inputs.get(&input_port)
            .ok_or_else(|| NodeExecutionError::input_error("input", "missing required input"))?;

        // 尝试转换为NumberLabel
        let input_number = input_data.as_any()
            .downcast_ref::<NumberLabel>()
            .ok_or_else(|| NodeExecutionError::input_error("input", "expected NumberLabel"))?;

        // 执行加法运算
        let result = input_number.value + self.add_value;

        // 生成输出
        let mut data_outputs = NodeDataOutputs::new();
        let mut control_outputs = NodeControlOutputs::new();

        let output_port = PortRef::new("math", "result");
        let result_value = NumberLabel { value: result };
        data_outputs.insert(output_port, Box::new(result_value));

        // 生成完成信号
        let signal_port = PortRef::new("math", "done");
        control_outputs.insert(signal_port, SignalLabel::active());

        println!("🔢 MathNode: {} + {} = {}", input_number.value, self.add_value, result);

        Ok((data_outputs, control_outputs))
    }

    fn get_node_info(&self) -> &NodeInfo {
        use std::sync::OnceLock;
        static NODE_INFO: OnceLock<NodeInfo> = OnceLock::new();
        NODE_INFO.get_or_init(|| {
            NodeInfo::new(
                "MathNode",
                vec![
                    PortDef::required("input", "NumberLabel"),
                ],
                vec![
                    PortDef::output("result", "NumberLabel"),
                    PortDef::output("done", "SignalLabel"),
                ],
            )
        })
    }
} 