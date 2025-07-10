//! Node registration macros

#[macro_export]
macro_rules! register_node {
    // Form 1: only type, derive name via stringify!
    ($node_type:ty) => {
        $crate::register_node!(stringify!($node_type), $node_type);
    };
    // Form 2: custom name and type
    ($name:expr, $node_type:ty) => {
        inventory::submit! {
            $crate::registry::NodeRegistration::new($name, || {
                Box::new(<$node_type>::default())
            })
        }
    };
    // Form 3: custom constructor closure returning Box<dyn Node>
    ($name:expr, $constructor:expr) => {
        inventory::submit! {
            $crate::registry::NodeRegistration::new($name, $constructor)
        }
    };
}
