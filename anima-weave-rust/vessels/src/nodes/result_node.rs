use anima_weave_core::node::{Node, NodeInfo};
use anima_weave_core::types::{NodeDataInputs, NodeDataOutputs};
use anima_weave_node::register_node;
use once_cell::sync::Lazy;
use std::collections::HashMap;
use std::fmt::Debug;

#[derive(Debug, Default)]
pub struct ResultNode;

static NODE_INFO: Lazy<NodeInfo> = Lazy::new(|| NodeInfo {
    name: "ResultNode",
    description: "Collects outputs from all leaf nodes in one-shot execution.",
    input_ports: Vec::new(), // dynamic inputs allowed
    output_ports: Vec::new(),
});

impl ResultNode {
    fn info_static() -> &'static NodeInfo {
        &NODE_INFO
    }
}

impl Node for ResultNode {
    fn info(&self) -> &'static NodeInfo {
        Self::info_static()
    }

    fn execute(&self, inputs: NodeDataInputs) -> Result<NodeDataOutputs, anyhow::Error> {
        // For now, simply log all inputs and return empty outputs.
        log::info!("ResultNode collected {} inputs", inputs.len());
        for (port, data) in &inputs {
            log::info!(
                "  - {}: {}",
                port.port_name,
                data.as_ref().get_semantic_label_type()
            );
        }
        Ok(HashMap::new())
    }
}

register_node!(ResultNode);
