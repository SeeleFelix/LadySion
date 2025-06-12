// Basic Plugin Implementation - PHP风格序列化
use std::any::Any;
use std::collections::HashMap;
use serde::{Serialize, Deserialize};
use crate::{
    ExecutionEnginePlugin, TypeSystemPlugin, Type, NodeInputs, NodeOutputs, NodeSpec
};

/// Basic Package Plugin
/// 提供基础数据类型和节点实现
#[derive(Debug)]
pub struct BasicPlugin;

impl BasicPlugin {
    pub fn new() -> Self {
        Self
    }
}

// ===== Basic Package Type Definitions - PHP风格序列化 =====

/// Signal类型 - 表示控制流信号
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Signal {
    pub active: bool,
}

impl Type for Signal {
    fn type_name() -> &'static str {
        "Signal"
    }
    
    fn package_name() -> &'static str {
        "basic"
    }
    
    fn as_any(&self) -> &dyn Any {
        self
    }
    
    fn clone_boxed(&self) -> Box<dyn Any> {
        Box::new(self.clone())
    }
}

/// Int类型 - 表示32位整数
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IntType {
    pub value: i32,
}

impl Type for IntType {
    fn type_name() -> &'static str {
        "Int"
    }
    
    fn package_name() -> &'static str {
        "basic"
    }
    
    fn as_any(&self) -> &dyn Any {
        self
    }
    
    fn clone_boxed(&self) -> Box<dyn Any> {
        Box::new(self.clone())
    }
}

/// Bool类型 - 表示布尔值
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BoolType {
    pub value: bool,
}

impl Type for BoolType {
    fn type_name() -> &'static str {
        "Bool"
    }
    
    fn package_name() -> &'static str {
        "basic"
    }
    
    fn as_any(&self) -> &dyn Any {
        self
    }
    
    fn clone_boxed(&self) -> Box<dyn Any> {
        Box::new(self.clone())
    }
}

/// String类型 - 表示字符串
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StringType {
    pub value: String,
}

impl Type for StringType {
    fn type_name() -> &'static str {
        "String"
    }
    
    fn package_name() -> &'static str {
        "basic"
    }
    
    fn as_any(&self) -> &dyn Any {
        self
    }
    
    fn clone_boxed(&self) -> Box<dyn Any> {
        Box::new(self.clone())
    }
}

/// UUID类型 - 表示唯一标识符
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UUIDType {
    pub value: String,
}

impl Type for UUIDType {
    fn type_name() -> &'static str {
        "UUID"
    }
    
    fn package_name() -> &'static str {
        "basic"
    }
    
    fn as_any(&self) -> &dyn Any {
        self
    }
    
    fn clone_boxed(&self) -> Box<dyn Any> {
        Box::new(self.clone())
    }
}

// ===== Basic Package Node Implementations =====

impl ExecutionEnginePlugin for BasicPlugin {
    fn execute_node(&self, node_type: &str, inputs: &NodeInputs) -> Result<NodeOutputs, String> {
        match node_type {
            "Start" => execute_start_node(inputs),
            "GetTimestamp" => execute_get_timestamp_node(inputs),
            "IsEven" => execute_is_even_node(inputs),
            "FormatNumber" => execute_format_number_node(inputs),
            _ => Err(format!("不支持的节点类型: {}", node_type)),
        }
    }
    
    fn supported_node_types(&self) -> Vec<String> {
        vec![
            "Start".to_string(),
            "GetTimestamp".to_string(),
            "IsEven".to_string(),
            "FormatNumber".to_string(),
        ]
    }
}

fn execute_start_node(inputs: &NodeInputs) -> Result<NodeOutputs, String> {
    let mut outputs = NodeOutputs::new();
    
    // 生成激活信号
    let signal = Signal { active: true };
    outputs.insert("signal", &signal)
        .map_err(|e| format!("插入signal失败: {}", e))?;
    
    // 生成执行ID
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis();
    let uuid = UUIDType {
        value: format!("uuid-{}", timestamp),
    };
    outputs.insert("execution_id", &uuid)
        .map_err(|e| format!("插入execution_id失败: {}", e))?;
    
    Ok(outputs)
}

fn execute_get_timestamp_node(inputs: &NodeInputs) -> Result<NodeOutputs, String> {
    // 检查触发信号（简化版本 - 只检查是否存在触发信号）
    if inputs.get_raw("trigger").is_none() {
        return Err("GetTimestamp需要触发信号".to_string());
    }
    
    let mut outputs = NodeOutputs::new();
    
    // 生成时间戳
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i32;
    
    let timestamp_value = IntType { value: timestamp };
    outputs.insert("timestamp", &timestamp_value)
        .map_err(|e| format!("插入timestamp失败: {}", e))?;
    
    // 生成完成信号
    let done_signal = Signal { active: true };
    outputs.insert("done", &done_signal)
        .map_err(|e| format!("插入done失败: {}", e))?;
    
    Ok(outputs)
}

fn execute_is_even_node(inputs: &NodeInputs) -> Result<NodeOutputs, String> {
    // 获取数字输入
    let number_input: IntType = inputs.get("number")
        .map_err(|e| format!("获取number输入失败: {}", e))?;
    
    let mut outputs = NodeOutputs::new();
    
    // 计算是否为偶数
    let is_even = BoolType { value: number_input.value % 2 == 0 };
    outputs.insert("result", &is_even)
        .map_err(|e| format!("插入result失败: {}", e))?;
    
    // 生成完成信号
    let done_signal = Signal { active: true };
    outputs.insert("done", &done_signal)
        .map_err(|e| format!("插入done失败: {}", e))?;
    
    Ok(outputs)
}

fn execute_format_number_node(inputs: &NodeInputs) -> Result<NodeOutputs, String> {
    // 获取数字输入
    let number_input: IntType = inputs.get("number")
        .map_err(|e| format!("获取number输入失败: {}", e))?;
    
    let mut outputs = NodeOutputs::new();
    
    // 格式化数字
    let formatted = StringType {
        value: format!("timestamp_{}", number_input.value),
    };
    outputs.insert("formatted", &formatted)
        .map_err(|e| format!("插入formatted失败: {}", e))?;
    
    // 生成完成信号
    let done_signal = Signal { active: true };
    outputs.insert("done", &done_signal)
        .map_err(|e| format!("插入done失败: {}", e))?;
    
    Ok(outputs)
} 