use anima_weave_core::graph::{Connection, Graph, NodeRef, PortRef};
use anima_weave_runtime::graph_runner::GraphRunner;
use anima_weave_vessels::{create_node_factory, get_registered_node_types};
use anyhow::Result;
use clap::{Parser, Subcommand};
use tokio::runtime::Runtime;

/// Anima Weave CLI – 简化版
#[derive(Parser, Debug)]
#[command(author, version, about = "Anima Weave simplified CLI", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand, Debug)]
enum Command {
    /// 列出已注册的节点类型
    ListNodes,
    /// 测试自动关机逻辑
    TestShutdown,
}

fn main() -> anyhow::Result<()> {
    env_logger::init();
    let cli = Cli::parse();

    match cli.command {
        Command::ListNodes => list_nodes(),
        Command::TestShutdown => test_shutdown()?,
    }

    Ok(())
}

fn list_nodes() {
    let factory = create_node_factory();
    println!("🌟 已注册节点类型 ({}):", factory.len());
    for node_type in get_registered_node_types() {
        println!(" - {}", node_type);
    }
}

fn test_shutdown() -> Result<()> {
    let rt = Runtime::new()?;
    rt.block_on(async {
        println!("🚀 开始停机测试...");

        // 构建简单图
        let graph = build_simple_graph();
        println!("📊 构建了图: {} 个节点", graph.nodes.len());

        // 钩子 - 这里不直接退出，只打印
        let hook: Option<Box<dyn Fn() + Send + Sync + 'static>> = Some(Box::new(|| {
            println!("🎯 Shutdown triggered! All nodes have completed at least once.");
        }));

        println!("🔧 构建GraphRunner...");
        // build runner
        let runner = GraphRunner::build_from_graph(graph, hook).await?;

        println!("🚀 启动图执行...");
        // launch
        runner.launch().await?;

        println!("⏳ 等待5秒观察执行...");
        // 为了测试，添加延迟观察
        tokio::time::sleep(std::time::Duration::from_secs(5)).await;

        println!("✅ 测试完成");

        Ok(())
    })
}

fn build_simple_graph() -> Graph {
    let random1 = NodeRef {
        name: "random1".to_string(),
        node_type: "RandomNode".to_string(),
    };
    let random2 = NodeRef {
        name: "random2".to_string(),
        node_type: "RandomNode".to_string(),
    };
    let add = NodeRef {
        name: "add".to_string(),
        node_type: "AddNode".to_string(),
    };

    // RandomNode1 -> AddNode (a)
    let conn1 = Connection {
        from: PortRef {
            node_name: "random1".to_string(),
            port_name: "random_value".to_string(),
        },
        to: PortRef {
            node_name: "add".to_string(),
            port_name: "a".to_string(),
        },
    };

    // RandomNode2 -> AddNode (b)
    let conn2 = Connection {
        from: PortRef {
            node_name: "random2".to_string(),
            port_name: "random_value".to_string(),
        },
        to: PortRef {
            node_name: "add".to_string(),
            port_name: "b".to_string(),
        },
    };

    Graph {
        nodes: vec![random1, random2, add],
        data_connections: vec![conn1, conn2],
    }
}
