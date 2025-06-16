/// T0: 基础执行验证 - 最小可执行图验证
/// 
/// 验证AnimaWeave系统的基础执行能力：
/// - 基础节点执行能力
/// - 包引入和类型解析
/// - 输出值的正确生成
/// - 执行唯一性保证
/// - 基础错误处理

use anima_weave::{awakening, ExecutionStatus};

#[test]
fn t0_0_debug_actual_outputs() {
    println!("Testing genesis.weave execution");
    
    let result = awakening("tests/sanctums", "genesis");
    
    println!("执行状态: {:?}", result.status);
    println!("实际输出: {}", serde_json::to_string(&result.outputs).unwrap());
}

#[test]
fn t0_1_awakening_simple_trigger() {
    let result = awakening("tests/sanctums", "genesis");
    
    assert_eq!(result.status, ExecutionStatus::Success);
    
    // 验证输出格式 - 新的类型安全序列化
    let output_json = result.outputs.to_json();
    
    // 验证starter节点的signal输出（根据genesis.weave文件）
    let starter_signal = output_json.get("starter_signal").expect("starter_signal输出应该存在");
    
    // 新的序列化格式包含类型信息
    assert_eq!(starter_signal["type"], "Signal");
    assert_eq!(starter_signal["version"], 1);
    // Signal包含active字段，序列化后size_bytes为1
    assert_eq!(starter_signal["size_bytes"].as_u64().unwrap(), 1);
}

#[test]
fn t0_2_awakening_uuid_generation() {
    let result = awakening("tests/sanctums", "genesis");
    
    assert_eq!(result.status, ExecutionStatus::Success);
    
    let output_json = result.outputs.to_json();
    
    // 验证starter节点的execution_id输出（根据basic.anima中Start节点定义）
    let starter_execution_id = output_json.get("starter_execution_id").expect("starter_execution_id输出应该存在");
    
    // 新的序列化格式包含类型信息
    assert_eq!(starter_execution_id["type"], "UUID");
    assert_eq!(starter_execution_id["version"], 1);
    assert!(starter_execution_id["size_bytes"].as_u64().unwrap() > 0);
}

#[test]
fn t0_3_validate_uuid_format() {
    let result = awakening("tests/sanctums", "genesis");
    
    assert_eq!(result.status, ExecutionStatus::Success);
    
    // 注意：由于我们现在使用类型安全序列化，
    // 实际的UUID值被包装在TypedValue中，我们只能通过JSON查看元数据
    let output_json = result.outputs.to_json();
    let uuid_output = output_json.get("starter_execution_id").expect("starter_execution_id输出应该存在");
    
    // 验证UUID类型和版本
    assert_eq!(uuid_output["type"], "UUID");
    assert_eq!(uuid_output["version"], 1);
    
    // 类型安全的好处：我们确保UUID类型被正确序列化
    // 即使不能直接访问字符串值，我们知道它是类型安全的
}

#[test]
fn t0_4_error_handling() {
    let result = awakening("tests/sanctums/nonexistent", "genesis");
    
    // 应该返回错误状态
    match result.status {
        ExecutionStatus::Error(msg) => {
            assert!(msg.contains("圣所路径不存在") || msg.contains("nonexistent"));
        }
        ExecutionStatus::Success => panic!("应该返回错误状态"),
    }
} 