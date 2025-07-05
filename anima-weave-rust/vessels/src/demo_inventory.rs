//! Inventory registration demo

use anima_weave_node::create_node_factory;

pub fn demo_inventory_registration() {
    println!("=== AnimaWeave Node Registration Demo ===");

    let factory = create_node_factory();

    println!("Found {} registered nodes:", factory.len());

    for (node_type, constructor) in factory {
        println!("  - {}", node_type);

        let node = constructor();
        let info = node.info();

        println!("    Description: {}", info.description);
        println!("    Input ports: {}", info.input_ports.len());
        println!("    Output ports: {}", info.output_ports.len());

        if !info.input_ports.is_empty() {
            println!("    Inputs:");
            for port in &info.input_ports {
                let required_str = if port.required {
                    "required"
                } else {
                    "optional"
                };
                println!(
                    "      - {} ({}): {}",
                    port.name, port.port_type, required_str
                );
            }
        }

        if !info.output_ports.is_empty() {
            println!("    Outputs:");
            for port in &info.output_ports {
                println!("      - {} ({})", port.name, port.port_type);
            }
        }

        println!();
    }

    println!("=== Node Composition Demo ===");

    if factory.contains_key("StartNode") && factory.contains_key("AddNode") {
        println!("✅ Found StartNode and AddNode, can compose together");
        println!("   StartNode -> produces value -> AddNode -> calculates result");
    } else {
        println!("❌ Missing required node types");
    }

    println!("=== Extensibility Demo ===");
    println!("💡 To add new nodes, simply:");
    println!("   1. Create a struct implementing Node trait");
    println!("   2. Call register_node!(\"NodeName\", NodeStruct)");
    println!("   3. System auto-discovers and registers, no other code changes needed");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_inventory_contains_our_nodes() {
        let factory = create_node_factory();

        assert!(
            factory.contains_key("StartNode"),
            "StartNode should be registered"
        );
        assert!(
            factory.contains_key("AddNode"),
            "AddNode should be registered"
        );

        if let Some(start_constructor) = factory.get("StartNode") {
            let start_node = start_constructor();
            assert_eq!(start_node.node_type(), "StartNode");
        }

        if let Some(add_constructor) = factory.get("AddNode") {
            let add_node = add_constructor();
            assert_eq!(add_node.node_type(), "AddNode");
        }
    }

    #[test]
    fn test_no_recipient_needed() {
        let factory = create_node_factory();

        println!("All nodes created through same factory, no different type parameters needed:");

        for (node_type, constructor) in factory {
            let node = constructor();
            println!("  {}: type = Box<dyn Node>", node_type);
            assert_eq!(node.node_type(), *node_type);
        }
    }
}
