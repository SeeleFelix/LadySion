//! Node factory system

use crate::node::Node;
use crate::registry::NodeRegistration;
use once_cell::sync::Lazy;
use std::collections::HashMap;

static GLOBAL_NODE_FACTORY: Lazy<HashMap<&'static str, fn() -> Box<dyn Node>>> = Lazy::new(|| {
    inventory::iter::<NodeRegistration>()
        .map(|reg| (reg.name, reg.constructor))
        .collect()
});

pub fn create_node_factory() -> &'static HashMap<&'static str, fn() -> Box<dyn Node>> {
    &GLOBAL_NODE_FACTORY
}

pub fn create_node_by_type(node_type: &str) -> Option<Box<dyn Node>> {
    GLOBAL_NODE_FACTORY
        .get(node_type)
        .map(|constructor| constructor())
}

pub fn get_registered_node_types() -> Vec<&'static str> {
    GLOBAL_NODE_FACTORY.keys().copied().collect()
}
