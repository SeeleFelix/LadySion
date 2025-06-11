// Basic Plugin Implementation - 使用类型安全序列化系统
use std::any::Any;
use std::collections::HashMap;
use serde::{Serialize, Deserialize};
use crate::{
    ExecutionEnginePlugin, TypeSystemPlugin, Type, NodeInputs, NodeOutputs, NodeSpec
};

/// Basic包插件 - 提供Signal、UUID类型和trigger、uuid_gen节点
pub struct BasicPlugin;

// ===== Basic Package Type Definitions =====

/// Signal类型 - 表示控制流信号
/// 
/// 语义：
/// 1. `active = true`  表示激活信号 (+)
/// 2. `active = false` 表示失活信号 (−)
///   目前暂不实现 `No_Signal (⊥)`，由 Option<Signal> 表示缺失。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Signal {
    pub active: bool,
}

impl Type for Signal {
    fn type_name(&self) -> &'static str {
        "Signal"
    }
    
    fn to_bytes(&self) -> Result<Vec<u8>, String> {
        // 序列化为单字节：0 = inactive, 1 = active
        Ok(vec![if self.active { 1u8 } else { 0u8 }])
    }
    
    fn from_bytes(bytes: &[u8]) -> Result<Box<dyn Type>, String> {
        if bytes.len() != 1 {
            return Err("Signal字节流长度应为1".to_string());
        }
        let active = bytes[0] != 0;
        Ok(Box::new(Signal { active }))
    }
    
    fn to_json(&self) -> serde_json::Value {
        serde_json::json!({
            "state": if self.active { "active" } else { "inactive" }
        })
    }
    
    fn from_json(_value: serde_json::Value) -> Result<Box<dyn Type>, String> {
        match _value {
            serde_json::Value::Object(map) => {
                let state = map.get("state")
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| "Signal JSON缺少state字段".to_string())?;
                Ok(Box::new(Signal { active: state == "active" }))
            }
            _ => Err("Signal JSON格式错误".to_string()),
        }
    }
    
    fn as_any(&self) -> &dyn Any {
        self
    }
    
    fn clone_type(&self) -> Box<dyn Type> {
        Box::new(self.clone())
    }
    
    fn is_compatible_with(&self, other: &dyn Type) -> bool {
        other.type_name() == "Signal"
    }
}

/// UUID类型 - 表示唯一标识符
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UUIDType {
    pub value: String,
}

impl Type for UUIDType {
    fn type_name(&self) -> &'static str {
        "UUID"
    }
    
    fn to_bytes(&self) -> Result<Vec<u8>, String> {
        bincode::serialize(self)
            .map_err(|e| format!("UUID序列化失败: {}", e))
    }
    
    fn from_bytes(bytes: &[u8]) -> Result<Box<dyn Type>, String> {
        let uuid: UUIDType = bincode::deserialize(bytes)
            .map_err(|e| format!("UUID反序列化失败: {}", e))?;
        Ok(Box::new(uuid))
    }
    
    fn to_json(&self) -> serde_json::Value {
        serde_json::Value::String(self.value.clone())
    }
    
    fn from_json(value: serde_json::Value) -> Result<Box<dyn Type>, String> {
        match value {
            serde_json::Value::String(s) => Ok(Box::new(UUIDType { value: s })),
            _ => Err("UUID类型需要字符串值".to_string()),
        }
    }
    
    fn as_any(&self) -> &dyn Any {
        self
    }
    
    fn clone_type(&self) -> Box<dyn Type> {
        Box::new(self.clone())
    }
    
    fn is_compatible_with(&self, other: &dyn Type) -> bool {
        other.type_name() == "UUID"
    }
}

// ===== Plugin Implementations =====

impl ExecutionEnginePlugin for BasicPlugin {
    fn execute_node(&self, node_spec: &NodeSpec, inputs: NodeInputs) -> Result<NodeOutputs, String> {
        match node_spec.node_type.as_str() {
            "Start" => self.execute_start(inputs),
            "trigger" => self.execute_trigger(inputs),
            "uuid_gen" => self.execute_uuid_gen(inputs),
            _ => Err(format!("不支持的节点类型: {}", node_spec.node_type)),
        }
    }
    
    fn supported_node_types(&self) -> Vec<String> {
        vec!["Start".to_string(), "trigger".to_string(), "uuid_gen".to_string()]
    }
}

impl TypeSystemPlugin for BasicPlugin {
    fn register_types(&self, registry: &mut HashMap<String, Box<dyn Type>>) {
        registry.insert("Signal".to_string(), Box::new(Signal { active: true }));
        registry.insert("UUID".to_string(), Box::new(UUIDType { value: String::new() }));
    }
    
    fn create_default_value(&self, type_name: &str) -> Result<Box<dyn Type>, String> {
        match type_name {
            "Signal" => Ok(Box::new(Signal { active: true })),
            "UUID" => Ok(Box::new(UUIDType { value: String::new() })),
            _ => Err(format!("未知类型: {}", type_name)),
        }
    }
}

impl BasicPlugin {
    fn execute_start(&self, _inputs: NodeInputs) -> Result<NodeOutputs, String> {
        let mut outputs = NodeOutputs::new();
        
        // Start节点输出signal和execution_id
        outputs.insert("signal", Signal { active: true })?;
        
        let uuid = UUIDType {
            value: format!("uuid-{}", chrono::Utc::now().timestamp_millis()),
        };
        outputs.insert("execution_id", uuid)?;
        
        Ok(outputs)
    }
    
    fn execute_trigger(&self, _inputs: NodeInputs) -> Result<NodeOutputs, String> {
        let mut outputs = NodeOutputs::new();
        outputs.insert("signal", Signal { active: true })?;
        Ok(outputs)
    }
    
    fn execute_uuid_gen(&self, inputs: NodeInputs) -> Result<NodeOutputs, String> {
        // 验证输入信号
        let _signal: Signal = inputs.get("trigger")?;
        
        // 生成UUID
        let uuid = UUIDType {
            value: format!("uuid-{}", chrono::Utc::now().timestamp_millis()),
        };
        
        let mut outputs = NodeOutputs::new();
        outputs.insert("uuid", uuid)?;
        Ok(outputs)
    }
} 