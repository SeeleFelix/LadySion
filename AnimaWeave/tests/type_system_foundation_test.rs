#[cfg(test)]
mod type_system_foundation_tests {
    use anima_weave::{awakening, ExecutionStatus, Type};

    /// T1: 类型系统基础计算链验证
    /// 
    /// 验证哲学理念: "类型是计算的基础"
    /// 数学定义1: 𝒯 = {Int, Bool, String, Array[T], Record{...}, ...}
    #[test]
    fn test_type_system_foundation_computation_chain() {
        // 执行接口: awakening("./tests/sanctums", "type_system_foundation")
        let result = awakening("./tests/sanctums", "type_system_foundation");
        
        // 打印执行结果，查看具体失败原因
        println!("执行状态: {:?}", result.status);
        
        // 期望成功执行
        match result.status {
            ExecutionStatus::Success => println!("✅ 执行成功"),
            ExecutionStatus::Error(ref err) => {
                println!("❌ 执行失败: {}", err);
                panic!("类型系统基础计算链执行失败: {}", err);
            }
        }
        
        // 验证输出不为空(基础检查)
        assert!(!result.outputs.is_empty(), "应该有计算输出");
        
        // 检查输出的JSON调试信息
        let outputs_json = result.outputs.to_json();
        println!("✅ 计算输出: {}", outputs_json);
        
        // 验证预期的输出键存在
        assert!(outputs_json.get("checker.result").is_some(), "应该有Bool类型计算结果");
        assert!(outputs_json.get("formatter.formatted").is_some(), "应该有String类型格式化结果");
    }




} 