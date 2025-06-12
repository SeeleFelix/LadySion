#[cfg(test)]
mod type_system_foundation_tests {
    use anima_weave::{awakening, serialize_outputs, deserialize_outputs};

    /// T1: 类型系统基础计算链验证
    /// 
    /// 验证哲学理念: "类型是计算的基础"
    /// 数学定义1: 𝒯 = {Int, Bool, String, Array[T], Record{...}, ...}
    /// 
    /// 🎯 正确的架构验证：
    /// - FateEcho保持结构化（status, metadata）
    /// - outputs序列化为字符串，支持图间传递
    /// - 框架统一处理序列化，插件专注业务逻辑
    #[test]
    fn test_type_system_foundation_computation_chain() {
        // 执行接口: awakening返回结构化的FateEcho
        let fate_echo = awakening("./tests/sanctums", "type_system_foundation");
        
        // 🎯 关键验证1: 结构化状态检查
        match fate_echo.status {
            anima_weave::ExecutionStatus::Success => {
                println!("✅ 图执行成功");
            }
            anima_weave::ExecutionStatus::Error(ref err) => {
                panic!("❌ 图执行失败: {}", err);
            }
        }
        
        // 🎯 关键验证2: outputs应该是序列化字符串
        println!("🔍 序列化的outputs字符串:");
        println!("{}", fate_echo.outputs);
        
        // 验证outputs是有效的JSON字符串
        assert!(fate_echo.outputs.contains("{"), "outputs应该是JSON格式");
        assert!(!fate_echo.outputs.is_empty(), "outputs不应为空");
        
        // 🎯 关键验证3: 能够反序列化outputs进行处理
        let node_outputs = fate_echo.get_outputs()
            .expect("outputs字符串应该能成功反序列化");
        
        // 验证终端输出节点（经过过滤后）
        assert!(node_outputs.contains_key("starter"), "应该包含starter节点的部分输出");
        assert!(!node_outputs.contains_key("timer"), "timer节点的输出被完全消费，不应出现在终端输出中");
        assert!(node_outputs.contains_key("checker"), "应该包含checker节点的终端输出");
        assert!(node_outputs.contains_key("formatter"), "应该包含formatter节点的终端输出");
        
        // 🎯 核心验证: 实际计算结果和类型验证
        // 注意：node_outputs是HashMap<String, NodeOutputs>，我们需要检查序列化的字符串
        
        // 验证只有终端节点的输出被保留（过滤掉了被消费的中间输出）
        assert!(!node_outputs.contains_key("timer"), "timer的输出都被其他节点消费，不应该在最终输出中");
        assert!(node_outputs.contains_key("checker"), "应该有checker节点的终端输出"); 
        assert!(node_outputs.contains_key("formatter"), "应该有formatter节点的终端输出");
        assert!(node_outputs.contains_key("starter"), "应该有starter节点的部分输出（execution_id未被消费）");
        
        // 检查序列化后的完整输出字符串
        let serialized_outputs = &fate_echo.outputs;
        println!("🔍 完整序列化输出:");
        println!("{}", serialized_outputs);
        
        // 原来的timer输出已被过滤掉（timestamp被其他节点消费了）
        // 现在我们验证过滤后的输出不包含中间数据
        assert!(!serialized_outputs.contains("\"timestamp\""), "timestamp应该被过滤掉，因为被其他节点消费了");
        
        // 验证checker输出：应该是basic.Bool类型的偶数判断结果
        assert!(serialized_outputs.contains("basic.Bool"), "输出应该包含basic.Bool类型");
        assert!(serialized_outputs.contains("\"result\""), "应该有result字段");
        
        // 验证formatter输出：应该是basic.String类型的格式化结果
        assert!(serialized_outputs.contains("basic.String"), "输出应该包含basic.String类型");
        assert!(serialized_outputs.contains("\"formatted\""), "应该有formatted字段");
        
        // 验证starter输出：应该包含Signal和UUID
        assert!(serialized_outputs.contains("basic.Signal"), "输出应该包含basic.Signal类型");
        assert!(serialized_outputs.contains("basic.UUID"), "输出应该包含basic.UUID类型");
        
        // 验证具体的计算逻辑
        if serialized_outputs.contains("\"result\"") {
            assert!(
                serialized_outputs.contains("\"value\": true") || serialized_outputs.contains("\"value\": false"),
                "result字段应该是布尔值"
            );
        }
        
        if serialized_outputs.contains("\"formatted\"") {
            assert!(serialized_outputs.contains("\"timestamp_"), "formatted字段应该包含格式化的时间戳");
        }
        
        println!("🎯 终端输出验证:");
        println!("  - starter.execution_id (basic.UUID): 未被消费的标识符");
        println!("  - checker.result (basic.Bool): 偶数判断的最终结果");
        println!("  - formatter.formatted (basic.String): 格式化的最终结果");
        println!("  - 各种done信号 (basic.Signal): 未被消费的完成标记");
        
        println!("✅ T1.1 类型系统基础验证通过 - 只保留终端输出，过滤掉中间数据流");
    }
    
    /// T1.2: 类型安全约束验证
    /// 
    /// 验证哲学理念: 类型系统提供安全约束
    /// 测试类型不匹配时应该失败
    #[test] 
    fn test_type_safety_constraints() {
        // TODO: 创建一个故意类型不匹配的weave文件
        // 验证当连接不兼容类型时，系统能够检测并拒绝执行
        println!("📝 待实现: 类型安全约束验证");
        println!("   需要创建类型不匹配的测试场景，验证系统拒绝错误连接");
        println!("   错误应该在FateEcho.status中体现为Error状态");
        println!("   outputs应该为空字符串'{{}}'");
    }
} 