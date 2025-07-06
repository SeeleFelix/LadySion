use anima_weave_core::actor::node_actor::distributed_node_actor::DistributedNodeActor;
use anima_weave_core::actor::status_collector::StatusCollector;
use anima_weave_core::actor::ExecutionStatus;
use anima_weave_core::event::DataMessage;
use anima_weave_core::types::PortRef;
use anima_weave_core::Node;
use anima_weave_vessels::labels::NumberLabel;
use kameo::Actor;
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use uuid::Uuid;

/// 简单Debug节点
#[derive(Debug)]
struct DebugNode;

impl Node for DebugNode {
    fn execute(
        &self,
        inputs: &anima_weave_core::types::NodeDataInputs,
    ) -> Result<anima_weave_core::types::NodeDataOutputs, anima_weave_core::AnimaWeaveError> {
        println!("🔍 DebugNode.execute called with {} inputs", inputs.len());
        for (port, data) in inputs {
            println!("  📤 Input port: {:?}", port);
            if let Some(number_label) = data.as_any().downcast_ref::<NumberLabel>() {
                println!("  📊 Number value: {}", number_label.value);
            }
        }

        let mut outputs = HashMap::new();

        // 获取输入数字
        if let Some(input_data) = inputs.get(&PortRef::new("debug", "input")) {
            if let Some(number_label) = input_data.as_any().downcast_ref::<NumberLabel>() {
                println!("  ✅ Found number input: {}", number_label.value);
                // 计算结果: 输入 * 2
                let result = NumberLabel {
                    value: number_label.value * 2.0,
                };
                outputs.insert(
                    PortRef::new("debug", "output"),
                    Arc::new(result) as Arc<dyn anima_weave_core::SemanticLabel>,
                );
                println!("  📤 Output: {}", number_label.value * 2.0);
            } else {
                println!("  ❌ Input is not a NumberLabel");
            }
        } else {
            println!("  ❌ No input found for debug.input");
        }

        println!("  📋 Returning {} outputs", outputs.len());
        Ok(outputs)
    }

    fn node_type(&self) -> &'static str {
        "DebugNode"
    }
}

/// 调试测试：详细检查节点行为
#[tokio::test]
async fn test_debug_node_behavior() {
    println!("🔍 开始调试节点行为...");

    // 创建StatusCollector
    let status_collector = <StatusCollector as Actor>::spawn(StatusCollector::new());
    println!("✅ StatusCollector已创建");

    // 创建NodeActor
    let debug_actor = <DistributedNodeActor as Actor>::spawn(DistributedNodeActor::new(
        "debug".to_string(),
        Box::new(DebugNode),
        status_collector.clone(),
    ));
    println!("✅ DebugNodeActor已创建");

    // 配置激活端口
    println!("📝 配置激活端口...");
    debug_actor.tell(anima_weave_core::actor::node_actor::distributed_node_actor::ConfigureActivationMessage {
        required_data_ports: vec![PortRef::new("debug", "input")],
        required_control_ports: vec![],
    }).await.expect("Failed to configure activation");
    println!("✅ 激活端口已配置");

    // 等待配置完成
    tokio::time::sleep(Duration::from_millis(100)).await;

    // 查询节点状态
    let info = debug_actor
        .ask(anima_weave_core::actor::node_actor::distributed_node_actor::GetNodeInfoQuery)
        .await
        .expect("Failed to query node info");
    println!("📊 节点状态:");
    println!("  - 名称: {}", info.name);
    println!("  - 状态: {:?}", info.state);
    println!("  - 待处理数据: {}", info.pending_data_count);
    println!("  - 待处理控制: {}", info.pending_control_count);

    // 发送数据
    println!("📤 发送数据到debug节点...");
    let data_message = DataMessage {
        from_node: "system".to_string(),
        from_port: PortRef::new("system", "start"),
        to_node: "debug".to_string(),
        to_port: PortRef::new("debug", "input"),
        data: Arc::new(NumberLabel { value: 42.0 }),
        execution_id: Uuid::new_v4().to_string(),
    };

    debug_actor
        .tell(data_message)
        .await
        .expect("Failed to send data");
    println!("✅ 数据已发送");

    // 等待执行
    println!("⏳ 等待执行...");
    tokio::time::sleep(Duration::from_millis(500)).await;

    // 等待更长时间确保异步消息处理完成
    println!("⏳ 等待StatusCollector处理事件...");
    tokio::time::sleep(Duration::from_millis(1000)).await;

    // 再次检查是否收到了StatusCollector事件
    println!("📝 验证StatusCollector是否接收到事件...");

    // 查询执行后的状态
    let final_info = debug_actor
        .ask(anima_weave_core::actor::node_actor::distributed_node_actor::GetNodeInfoQuery)
        .await
        .expect("Failed to query final node info");
    println!("📊 执行后节点状态:");
    println!("  - 名称: {}", final_info.name);
    println!("  - 状态: {:?}", final_info.state);
    println!("  - 待处理数据: {}", final_info.pending_data_count);
    println!("  - 待处理控制: {}", final_info.pending_control_count);

    // 查询StatusCollector
    let status: ExecutionStatus = status_collector
        .ask(anima_weave_core::actor::status_collector::GetStatusQuery)
        .await
        .expect("Failed to get status");
    println!("📊 StatusCollector统计:");
    println!("  - 总执行次数: {}", status.total_executions);
    println!("  - 成功执行: {}", status.successful_executions);
    println!("  - 失败执行: {}", status.failed_executions);

    // 简单断言
    assert!(status.total_executions > 0, "应该有执行记录");
    assert!(status.successful_executions > 0, "应该有成功执行");
    assert_eq!(status.failed_executions, 0, "不应该有失败执行");

    println!("✅ 调试测试完成!");
}
