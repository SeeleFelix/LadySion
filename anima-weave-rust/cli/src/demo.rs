//! CLI演示 - 展示新的Node trait + inventory架构
//!
//! 这个演示展示了重构后的架构优势：
//! 1. 统一的Node trait
//! 2. 自动节点注册
//! 3. 简化的NodeActor（无需复杂的recipient传递）

use anima_weave_node::create_node_factory;
use anima_weave_vessels::demo_inventory::demo_inventory_registration;

pub fn run_demo() {
    println!("========================================");
    println!("  AnimaWeave v2 架构演示");
    println!("  基于trait object + inventory注册");
    println!("========================================");
    println!();

    // 运行inventory演示
    demo_inventory_registration();

    println!();
    println!("=== 架构优势总结 ===");
    println!("✅ 统一NodeActor类型: UnifiedNodeActor");
    println!("   - 所有NodeActor都是同一个类型");
    println!("   - 组合Box<dyn Node>实现不同功能");
    println!("   - 通过node_name索引，通过node_type查找实现");
    println!();

    println!("✅ 自动节点注册: inventory crate");
    println!("   - 编译时自动收集所有register_node!调用");
    println!("   - 运行时通过create_node_factory()获取");
    println!("   - 新节点只需创建文件+注册，无需修改其他代码");
    println!();

    println!("✅ 去除recipient复杂度:");
    println!("   - Coordinator通过node_name直接查找NodeActor");
    println!("   - NodeActor通过统一接口发送消息给Coordinator");
    println!("   - 不需要为每个节点类型传递不同的recipient");
    println!();

    println!("✅ 真正的组合而非继承:");
    println!("   - NodeActor组合Box<dyn Node>，不继承不同类型");
    println!("   - 符合Rust的设计哲学：组合优于继承");
    println!("   - 类似汽车引擎的例子：汽车不关心引擎品牌，只要有启动接口");
    println!();

    demonstrate_extensibility();
}

fn demonstrate_extensibility() {
    println!("=== 扩展性演示 ===");
    println!("💡 添加新节点的步骤:");
    println!("1. 创建新文件 vessels/src/my_new_node.rs");
    println!("2. 实现Node trait:");
    println!(
        r#"
   #[derive(Debug, Default)]
   pub struct MyNewNode;
   
   impl Node for MyNewNode {{
       fn info(&self) -> &'static NodeInfo {{ ... }}
       fn execute(&self, inputs: &NodeDataInputs) -> Result<NodeDataOutputs, AnimaWeaveError> {{ ... }}
   }}
   
   register_node!("MyNewNode", MyNewNode);
"#
    );
    println!("3. 在lib.rs中添加 pub mod my_new_node;");
    println!("4. 完成！系统自动发现并注册新节点");
    println!();

    let factory = create_node_factory();
    println!("当前系统支持 {} 种节点类型，可无限扩展。", factory.len());
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_demo_runs_without_panic() {
        // 确保演示程序可以正常运行而不崩溃
        run_demo();
    }
}
