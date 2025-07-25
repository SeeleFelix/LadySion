//! Node registration system

use anima_weave_core::Node;

pub struct NodeRegistration {
    pub name: &'static str,
    pub constructor: fn() -> Box<dyn Node>,
}

impl NodeRegistration {
    pub const fn new(name: &'static str, constructor: fn() -> Box<dyn Node>) -> Self {
        Self { name, constructor }
    }
}

inventory::collect!(NodeRegistration);
