use anima_weave_core::graph::Graph;
use anima_weave_runtime::launcher::DistributedGraphLauncher;
use anima_weave_vessels::create_node_factory;
use clap::Parser;
use log::info;
use std::fs;

mod demo;

/// Command-line arguments for the Anima Weave Engine
#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Cli {
    /// Path to the graph definition file (.json)
    #[arg(short, long)]
    file: String,

    /// The name of the node to start the execution from
    #[arg(long)]
    start_node: String,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    env_logger::init();
    let cli = Cli::parse();

    info!("🚀 Anima Weave Engine is starting up...");

    let graph_json = fs::read_to_string(cli.file)?;
    let graph_spec: Graph = serde_json::from_str(&graph_json)?;
    let graph = std::sync::Arc::new(anima_weave_core::in_memory_graph::InMemoryGraph::new(
        graph_spec,
    ));

    // 使用新的Node系统
    let node_factory = create_node_factory();

    info!("🔧 Anima Weave Engine is setting up...");
    let mut launcher = DistributedGraphLauncher::new(graph, node_factory);
    launcher.setup().await.map_err(|e| anyhow::anyhow!(e))?;
    info!("🛠️  Engine setup complete.");

    info!("✨ Anima Weave Engine is launching...");
    launcher.launch_and_wait(&cli.start_node).await;
    info!("🏁 Anima Weave Engine has launched.");

    // Keep the main thread alive to allow actors to run.
    // In a real service, this would be a proper shutdown handling loop.
    tokio::signal::ctrl_c().await?;
    info!("Received Ctrl-C, shutting down.");

    Ok(())
}
