//! StartNode - 起始节点实现
//!
//! 生成一个数值信号，用于启动图执行

use anima_weave_core::{
    actor::{NodeExecutor, NodeExecutionError},
    actor::node::{NodeInfo, PortDef},
    NodeDataInputs, NodeControlInputs, NodeDataOutputs, NodeControlOutputs,
    PortRef, SignalLabel
};
use crate::NumberLabel;
use async_trait::async_trait;
use std::collections::HashMap;

/// StartNode - 生成数值信号的起始节点
pub struct StartNode {
    /// 要生成的数值
    value: f64,
}

impl StartNode {
    /// 创建新的StartNode
    pub fn new(value: f64) -> Self {
        Self { value }
    }
}

#[async_trait]
impl NodeExecutor for StartNode {
    async fn execute(
        &self,
        _data_inputs: NodeDataInputs,
        _control_inputs: NodeControlInputs,
    ) -> Result<(NodeDataOutputs, NodeControlOutputs), NodeExecutionError> {
        // StartNode不需要任何输入，直接生成输出
        let mut data_outputs = NodeDataOutputs::new();
        let mut control_outputs = NodeControlOutputs::new();

        // 生成数值输出到"value"端口
        let output_port = PortRef::new("start", "value");
        let number_value = NumberLabel { value: self.value };
        data_outputs.insert(output_port, Box::new(number_value));

        // 同时生成控制信号到"signal"端口
        let signal_port = PortRef::new("start", "signal");
        control_outputs.insert(signal_port, SignalLabel::active());

        println!("🚀 StartNode generated value: {}", self.value);

        Ok((data_outputs, control_outputs))
    }

    fn get_node_info(&self) -> &NodeInfo {
        use std::sync::OnceLock;
        static NODE_INFO: OnceLock<NodeInfo> = OnceLock::new();
        NODE_INFO.get_or_init(|| {
            NodeInfo::new(
                "StartNode",
                vec![], // 无输入端口
                vec![
                    PortDef::output("value", "NumberLabel"),
                    PortDef::output("signal", "SignalLabel"),
                ],
            )
        })
    }
} 