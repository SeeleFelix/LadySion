//! Node registration macros

#[macro_export]
macro_rules! register_node {
    ($name:expr, $node_type:ty) => {
        inventory::submit! {
            $crate::registry::NodeRegistration::new($name, || {
                Box::new(<$node_type>::default())
            })
        }
    };
}
