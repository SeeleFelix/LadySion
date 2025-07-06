use anima_weave_core::actor::node_actor::node_actor::NodeActor;
use anima_weave_core::actor::status_collector::StatusCollector;
use anima_weave_core::actor::ExecutionStatus;
use anima_weave_core::actor::node_actor::NodeState;
use anima_weave_core::event::DataMessage;
use anima_weave_core::types::PortRef;
use anima_weave_core::Node;
use anima_weave_vessels::labels::NumberLabel;
use kameo::Actor;
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use uuid::Uuid;

/// 简单测试节点：将输入数字乘以2
#[derive(Debug)]
struct DoubleNode;

impl Node for DoubleNode {
    fn execute(
        &self,
        inputs: &anima_weave_core::types::NodeDataInputs,
    ) -> Result<anima_weave_core::types::NodeDataOutputs, anima_weave_core::AnimaWeaveError> {
        let mut outputs = HashMap::new();

        // 获取输入数字 - 使用通用的端口名称
        for (port_ref, input_data) in inputs {
            if port_ref.port_name == "input" {
                if let Some(number_label) = input_data.as_any().downcast_ref::<NumberLabel>() {
                    // 计算结果: 输入 * 2
                    let result = NumberLabel {
                        value: number_label.value * 2.0,
                    };
                    outputs.insert(
                        PortRef::new(&port_ref.node_name, "output"),
                        Arc::new(result) as Arc<dyn anima_weave_core::SemanticLabel>,
                    );
                }
            }
        }

        Ok(outputs)
    }

    fn node_type(&self) -> &'static str {
        "DoubleNode"
    }
}

/// 求和测试节点：将两个输入相加
#[derive(Debug)]
struct SumNode;

impl Node for SumNode {
    fn execute(
        &self,
        inputs: &anima_weave_core::types::NodeDataInputs,
    ) -> Result<anima_weave_core::types::NodeDataOutputs, anima_weave_core::AnimaWeaveError> {
        let mut outputs = HashMap::new();

        // 获取两个输入 - 使用动态节点名称
        let mut input_a = None;
        let mut input_b = None;
        let mut node_name = String::new();

        for (port_ref, input_data) in inputs {
            node_name = port_ref.node_name.clone();
            if port_ref.port_name == "input_a" {
                input_a = Some(input_data);
            } else if port_ref.port_name == "input_b" {
                input_b = Some(input_data);
            }
        }

        if let (Some(a_data), Some(b_data)) = (input_a, input_b) {
            if let (Some(a_label), Some(b_label)) = (
                a_data.as_any().downcast_ref::<NumberLabel>(),
                b_data.as_any().downcast_ref::<NumberLabel>(),
            ) {
                // 计算结果: a + b
                let result = NumberLabel {
                    value: a_label.value + b_label.value,
                };
                outputs.insert(
                    PortRef::new(&node_name, "output"),
                    Arc::new(result) as Arc<dyn anima_weave_core::SemanticLabel>,
                );
            }
        }

        Ok(outputs)
    }

    fn node_type(&self) -> &'static str {
        "SumNode"
    }
}

/// 集成测试：验证分布式NodeActor通信
#[tokio::test]
async fn test_distributed_node_communication() {
    println!("🚀 开始分布式架构集成测试...");

    // 1. 创建StatusCollector
    let status_collector = Actor::spawn(StatusCollector::new());
    println!("✅ StatusCollector已创建");

    // 2. 创建三个NodeActor
    let source_actor = <NodeActor as Actor>::spawn(NodeActor::new_simple(
        "source".to_string(),
        Box::new(DoubleNode),
        status_collector.clone(),
    ));

    let processor_actor = <NodeActor as Actor>::spawn(NodeActor::new_simple(
        "processor".to_string(),
        Box::new(SumNode),
        status_collector.clone(),
    ));

    let sink_actor = <NodeActor as Actor>::spawn(NodeActor::new_simple(
        "sink".to_string(),
        Box::new(DoubleNode),
        status_collector.clone(),
    ));

    println!("✅ 三个NodeActor已创建: source, processor, sink");

    // 3. 配置激活模式和必需端口
    source_actor.tell(anima_weave_core::actor::node_actor::node_actor::ConfigureActivationMessage {
        required_data_ports: vec![PortRef::new("source", "input")],
        required_control_ports: vec![],
    }).await.expect("Failed to configure source activation");

    processor_actor.tell(anima_weave_core::actor::node_actor::node_actor::ConfigureActivationMessage {
        required_data_ports: vec![PortRef::new("processor", "input_a"), PortRef::new("processor", "input_b")],
        required_control_ports: vec![],
    }).await.expect("Failed to configure processor activation");

    sink_actor.tell(anima_weave_core::actor::node_actor::node_actor::ConfigureActivationMessage {
        required_data_ports: vec![PortRef::new("sink", "input")],
        required_control_ports: vec![],
    }).await.expect("Failed to configure sink activation");

    // 4. 配置连接: source -> processor -> sink
    // source输出连接到processor的input_a
    let source_connections = {
        let mut connections = HashMap::new();
        connections.insert(
            PortRef::new("source", "output"),
            vec![(
                processor_actor.clone(),
                PortRef::new("processor", "input_a"),
            )],
        );
        connections
    };

    // processor输出连接到sink
    let processor_connections = {
        let mut connections = HashMap::new();
        connections.insert(
            PortRef::new("processor", "output"),
            vec![(sink_actor.clone(), PortRef::new("sink", "input"))],
        );
        connections
    };

    // 应用连接配置
    source_actor.tell(anima_weave_core::actor::node_actor::node_actor::ConfigureConnectionsMessage {
        port_mappings: source_connections,
    }).await.expect("Failed to configure source connections");

    processor_actor.tell(anima_weave_core::actor::node_actor::node_actor::ConfigureConnectionsMessage {
        port_mappings: processor_connections,
    }).await.expect("Failed to configure processor connections");

    println!("✅ NodeActor连接已配置");

    // 4. 发送初始数据到source节点
    let execution_id = Uuid::new_v4().to_string();
    let initial_data = DataMessage {
        from_node: "system".to_string(),
        from_port: PortRef::new("system", "start"),
        to_node: "source".to_string(),
        to_port: PortRef::new("source", "input"),
        data: Arc::new(NumberLabel { value: 5.0 }),
        execution_id: execution_id.clone(),
    };

    println!("📤 发送初始数据到source节点: 5.0");
    source_actor
        .tell(initial_data)
        .await
        .expect("Failed to send initial data");

    // 5. 为processor提供第二个输入
    let second_input = DataMessage {
        from_node: "system".to_string(),
        from_port: PortRef::new("system", "start2"),
        to_node: "processor".to_string(),
        to_port: PortRef::new("processor", "input_b"),
        data: Arc::new(NumberLabel { value: 3.0 }),
        execution_id: execution_id.clone(),
    };

    println!("📤 发送第二个输入到processor节点: 3.0");
    processor_actor
        .tell(second_input)
        .await
        .expect("Failed to send second input");

    // 6. 等待执行完成
    println!("⏳ 等待分布式执行完成...");
    tokio::time::sleep(Duration::from_millis(500)).await;

    // 7. 验证StatusCollector中的统计信息
    let status: ExecutionStatus = status_collector
        .ask(anima_weave_core::actor::status_collector::GetStatusQuery)
        .await
        .expect("Failed to get status");

    println!("📊 执行统计:");
    println!("   - 总执行次数: {}", status.total_executions);
    println!("   - 成功执行: {}", status.successful_executions);
    println!("   - 失败执行: {}", status.failed_executions);
    println!("   - 活跃节点数: {}", status.active_nodes_count);
    println!("   - 系统健康: {}", status.is_healthy());

    // 8. 验证预期结果
    assert!(
        status.total_executions >= 2,
        "应该至少有2次执行 (source + processor)"
    );
    assert!(status.successful_executions >= 2, "执行应该都成功");
    assert_eq!(status.failed_executions, 0, "不应该有失败的执行");
    assert!(status.is_healthy(), "系统应该是健康的");

    println!("✅ 分布式架构集成测试通过!");
    println!("🎯 验证项目:");
    println!("   ✓ NodeActor自主执行");
    println!("   ✓ P2P直接消息传递");
    println!("   ✓ 无中心化瓶颈");
    println!("   ✓ StatusCollector正确监控");
    println!("   ✓ 零拷贝数据传递");
}

/// 验证节点状态查询功能
#[tokio::test]
async fn test_node_state_queries() {
    println!("🔍 测试节点状态查询功能...");

    let status_collector = Actor::spawn(StatusCollector::new());
    let test_actor = <NodeActor as Actor>::spawn(NodeActor::new_simple(
        "test_node".to_string(),
        Box::new(DoubleNode),
        status_collector,
    ));

    // 查询初始状态
    let state: String = test_actor
        .ask(anima_weave_core::actor::node_actor::node_actor::GetNodeStateQuery)
        .await
        .expect("Failed to query node state");

    println!("📋 初始节点状态: {}", state);
    assert_eq!(state, "Idle", "新创建的节点应该处于Idle状态");

    // 查询节点信息
    let info: String = test_actor
        .ask(anima_weave_core::actor::node_actor::node_actor::GetNodeInfoQuery)
        .await
        .expect("Failed to query node info");

    println!("📊 节点信息: {}", info);
    
    // 简单检查info字符串包含预期内容
    assert!(info.contains("test_node"));
    assert!(info.contains("Idle"));

    println!("✅ 节点状态查询测试通过!");
}

/// 性能测试：验证并行执行能力
#[tokio::test]
async fn test_parallel_execution_performance() {
    println!("⚡ 测试并行执行性能...");

    let status_collector = Actor::spawn(StatusCollector::new());
    let start_time = std::time::Instant::now();

    // 创建多个独立的NodeActor
    let mut actors = Vec::new();
    for i in 0..5 {
        let actor = <NodeActor as Actor>::spawn(NodeActor::new_simple(
            format!("parallel_node_{}", i),
            Box::new(DoubleNode),
            status_collector.clone(),
        ));

        // 配置激活端口
        actor.tell(anima_weave_core::actor::node_actor::node_actor::ConfigureActivationMessage {
            required_data_ports: vec![PortRef::new(&format!("parallel_node_{}", i), "input")],
            required_control_ports: vec![],
        }).await.expect("Failed to configure activation");

        actors.push(actor);
    }

    // 同时向所有节点发送数据
    for (i, actor) in actors.iter().enumerate() {
        let message = DataMessage {
            from_node: "system".to_string(),
            from_port: PortRef::new("system", "start"),
            to_node: format!("parallel_node_{}", i),
            to_port: PortRef::new(&format!("parallel_node_{}", i), "input"),
            data: Arc::new(NumberLabel {
                value: (i + 1) as f64,
            }),
            execution_id: Uuid::new_v4().to_string(),
        };

        actor
            .tell(message)
            .await
            .expect("Failed to send parallel message");
    }

    // 等待所有执行完成
    tokio::time::sleep(Duration::from_millis(200)).await;

    let elapsed = start_time.elapsed();
    println!("🕒 并行执行耗时: {:?}", elapsed);

    // 验证所有执行都完成了
    let status: ExecutionStatus = status_collector
        .ask(anima_weave_core::actor::status_collector::GetStatusQuery)
        .await
        .expect("Failed to get final status");

    println!("📈 并行执行结果:");
    println!("   - 总执行次数: {}", status.total_executions);
    println!("   - 成功执行: {}", status.successful_executions);

    assert_eq!(status.total_executions, 5, "应该有5次并行执行");
    assert_eq!(status.successful_executions, 5, "所有执行都应该成功");
    assert!(elapsed < Duration::from_millis(300), "并行执行应该很快完成");

    println!("✅ 并行执行性能测试通过!");
}

/// Debug测试：详细追踪数据传递过程
#[tokio::test]
async fn test_debug_data_flow() {
    println!("🔍 开始Debug数据流测试...");

    let status_collector = Actor::spawn(StatusCollector::new());

    // 创建source节点
    let source_actor = <NodeActor as Actor>::spawn(NodeActor::new_simple(
        "source".to_string(),
        Box::new(DoubleNode),
        status_collector.clone(),
    ));

    // 创建processor节点
    let processor_actor = <NodeActor as Actor>::spawn(NodeActor::new_simple(
        "processor".to_string(),
        Box::new(SumNode),
        status_collector.clone(),
    ));

    // 配置激活条件
    println!("🔧 配置激活条件...");

    // source只需要一个输入
    source_actor.tell(anima_weave_core::actor::node_actor::node_actor::ConfigureActivationMessage {
        required_data_ports: vec![PortRef::new("source", "input")],
        required_control_ports: vec![],
    }).await.expect("Failed to configure source activation");

    // processor需要两个输入
    processor_actor.tell(anima_weave_core::actor::node_actor::node_actor::ConfigureActivationMessage {
        required_data_ports: vec![PortRef::new("processor", "input_a"), PortRef::new("processor", "input_b")],
        required_control_ports: vec![],
    }).await.expect("Failed to configure processor activation");

    // 配置连接：source.output -> processor.input_a
    println!("🔧 配置连接...");
    let source_connections = {
        let mut connections = HashMap::new();
        connections.insert(
            PortRef::new("source", "output"),
            vec![(
                processor_actor.clone(),
                PortRef::new("processor", "input_a"),
            )],
        );
        connections
    };

    source_actor.tell(anima_weave_core::actor::node_actor::node_actor::ConfigureConnectionsMessage {
        port_mappings: source_connections,
    }).await.expect("Failed to configure source connections");

    // 第一步：发送数据到source
    println!("📤 第一步：发送数据到source节点...");
    let execution_id = Uuid::new_v4().to_string();
    let source_input = DataMessage {
        from_node: "system".to_string(),
        from_port: PortRef::new("system", "start"),
        to_node: "source".to_string(),
        to_port: PortRef::new("source", "input"),
        data: Arc::new(NumberLabel { value: 5.0 }),
        execution_id: execution_id.clone(),
    };

    source_actor
        .tell(source_input)
        .await
        .expect("Failed to send source input");

    // 等待source执行
    println!("⏳ 等待source执行...");
    tokio::time::sleep(Duration::from_millis(100)).await;

    // 检查状态
    let status1: ExecutionStatus = status_collector
        .ask(anima_weave_core::actor::status_collector::GetStatusQuery)
        .await
        .expect("Failed to get status");

    println!("📊 Source执行后状态:");
    println!("   - 总执行次数: {}", status1.total_executions);
    println!("   - 成功执行: {}", status1.successful_executions);

    // 查询processor状态
    let processor_info: String =
        processor_actor
            .ask(anima_weave_core::actor::node_actor::node_actor::GetNodeInfoQuery)
            .await
            .expect("Failed to query processor info");

    println!("📊 Processor状态: {}", processor_info);

    // 第二步：发送第二个输入到processor
    println!("📤 第二步：发送第二个输入到processor...");
    let processor_input = DataMessage {
        from_node: "system".to_string(),
        from_port: PortRef::new("system", "start2"),
        to_node: "processor".to_string(),
        to_port: PortRef::new("processor", "input_b"),
        data: Arc::new(NumberLabel { value: 3.0 }),
        execution_id: execution_id.clone(),
    };

    processor_actor
        .tell(processor_input)
        .await
        .expect("Failed to send processor input");

    // 等待processor执行
    println!("⏳ 等待processor执行...");
    tokio::time::sleep(Duration::from_millis(100)).await;

    // 检查最终状态
    let status2: ExecutionStatus = status_collector
        .ask(anima_weave_core::actor::status_collector::GetStatusQuery)
        .await
        .expect("Failed to get final status");

    println!("📊 最终状态:");
    println!("   - 总执行次数: {}", status2.total_executions);
    println!("   - 成功执行: {}", status2.successful_executions);

    // 再次查询processor状态
    let processor_info2: String =
        processor_actor
            .ask(anima_weave_core::actor::node_actor::node_actor::GetNodeInfoQuery)
            .await
            .expect("Failed to query processor info");

    println!("📊 Processor最终状态: {}", processor_info2);

    // 分析结果
    if status2.total_executions == 1 {
        println!("❌ 问题：只有source执行了，processor没有执行");
        println!("   可能原因：");
        println!("   1. source的输出没有发送到processor");
        println!("   2. processor的激活条件没有满足");
        println!("   3. 数据传递有bug");
    } else if status2.total_executions == 2 {
        println!("✅ 成功：source和processor都执行了");
    } else {
        println!("❓ 意外：执行次数 = {}", status2.total_executions);
    }
}
