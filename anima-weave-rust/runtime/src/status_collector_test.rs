use anima_weave_core::actor::status_collector::{StatusCollector, GetStatusQuery};
use anima_weave_core::actor::types::{NodeStatusEvent, ExecutionStatus};
use kameo::Actor;
use std::time::Duration;
use uuid::Uuid;

/// 直接测试StatusCollector是否能正确处理事件
#[tokio::test]
async fn test_status_collector_direct() {
    println!("🔍 开始StatusCollector直接测试...");
    
    // 创建StatusCollector
    let status_collector = <StatusCollector as Actor>::spawn(StatusCollector::new());
    println!("✅ StatusCollector已创建");

    // 直接发送ExecutionStarted事件
    let execution_id = Uuid::new_v4().to_string();
    println!("📤 直接发送ExecutionStarted事件...");
    
    status_collector.tell(NodeStatusEvent::ExecutionStarted {
        node_name: "test_node".to_string(),
        execution_id: execution_id.clone(),
        input_count: 1,
    }).await.expect("Failed to send ExecutionStarted");
    
    println!("✅ ExecutionStarted事件已发送");
    
    // 等待处理
    tokio::time::sleep(Duration::from_millis(100)).await;
    
    // 发送ExecutionCompleted事件
    println!("📤 直接发送ExecutionCompleted事件...");
    
    status_collector.tell(NodeStatusEvent::ExecutionCompleted {
        node_name: "test_node".to_string(),
        execution_id: execution_id.clone(),
        output_count: 1,
        duration: Duration::from_millis(50),
    }).await.expect("Failed to send ExecutionCompleted");
    
    println!("✅ ExecutionCompleted事件已发送");
    
    // 等待处理
    tokio::time::sleep(Duration::from_millis(100)).await;
    
    // 查询状态
    let status: ExecutionStatus = status_collector.ask(GetStatusQuery).await
        .expect("Failed to get status");
        
    println!("📊 StatusCollector统计:");
    println!("  - 总执行次数: {}", status.total_executions);
    println!("  - 成功执行: {}", status.successful_executions);
    println!("  - 失败执行: {}", status.failed_executions);

    // 断言
    assert!(status.total_executions > 0, "应该有执行记录");
    assert!(status.successful_executions > 0, "应该有成功执行");
    assert_eq!(status.failed_executions, 0, "不应该有失败执行");

    println!("✅ StatusCollector直接测试通过!");
} 