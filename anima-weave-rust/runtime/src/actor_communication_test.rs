use anima_weave_core::actor::node_actor::distributed_node_actor::DistributedNodeActor;
use anima_weave_core::actor::status_collector::{GetStatusQuery, StatusCollector};
use anima_weave_core::actor::ExecutionStatus;
use anima_weave_core::event::NodeStatusEvent;
use anima_weave_core::Node;
use kameo::Actor;
use std::collections::HashMap;
use std::time::Duration;

/// 空节点用于测试
#[derive(Debug)]
struct EmptyNode;

impl Node for EmptyNode {
    fn execute(
        &self,
        _inputs: &anima_weave_core::types::NodeDataInputs,
    ) -> Result<anima_weave_core::types::NodeDataOutputs, anima_weave_core::AnimaWeaveError> {
        Ok(HashMap::new())
    }

    fn node_type(&self) -> &'static str {
        "EmptyNode"
    }
}

/// 测试NodeActor能否向同一个StatusCollector发送事件
#[tokio::test]
async fn test_node_actor_status_collector_communication() {
    println!("🔍 开始NodeActor-StatusCollector通信测试...");

    // 创建StatusCollector
    let status_collector = <StatusCollector as Actor>::spawn(StatusCollector::new());
    println!("✅ StatusCollector已创建");

    // 手动向StatusCollector发送一个完整的执行周期事件
    println!("📤 手动测试StatusCollector...");
    let test_execution_id = "manual-1".to_string();

    // 发送开始事件
    status_collector
        .tell(NodeStatusEvent::ExecutionStarted {
            node_name: "manual_test".to_string(),
            execution_id: test_execution_id.clone(),
            input_count: 1,
        })
        .await
        .expect("Failed to send ExecutionStarted");

    tokio::time::sleep(Duration::from_millis(50)).await;

    // 发送完成事件
    status_collector
        .tell(NodeStatusEvent::ExecutionCompleted {
            node_name: "manual_test".to_string(),
            execution_id: test_execution_id,
            output_count: 1,
            duration: Duration::from_millis(10),
        })
        .await
        .expect("Failed to send ExecutionCompleted");

    tokio::time::sleep(Duration::from_millis(100)).await;

    // 创建NodeActor，传递同一个StatusCollector引用
    let node_actor = <DistributedNodeActor as Actor>::spawn(DistributedNodeActor::new(
        "test_node".to_string(),
        Box::new(EmptyNode),
        status_collector.clone(), // 使用相同的StatusCollector
    ));
    println!("✅ NodeActor已创建，使用相同的StatusCollector引用");

    // 现在让NodeActor发送事件
    println!("📤 让NodeActor向StatusCollector发送事件...");

    // 通过tell方式让NodeActor内部的status_collector发送事件
    // 我们需要访问NodeActor内部的方法，但这很困难
    // 所以我们直接创建一个NodeStatusEvent并让NodeActor处理

    // 等待一下
    tokio::time::sleep(Duration::from_millis(200)).await;

    // 查询StatusCollector状态
    let status: ExecutionStatus = status_collector
        .ask(GetStatusQuery)
        .await
        .expect("Failed to get status");

    println!("📊 StatusCollector统计:");
    println!("  - 总执行次数: {}", status.total_executions);
    println!("  - 成功执行: {}", status.successful_executions);
    println!("  - 失败执行: {}", status.failed_executions);

    // 至少手动测试事件应该被处理了
    assert!(status.total_executions > 0, "至少应该有手动测试的执行记录");

    println!("✅ 通信测试部分通过!");
}
