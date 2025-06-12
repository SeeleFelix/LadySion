use std::any::Any;
use std::fmt::Debug;
use serde::{Serialize, Deserialize};

/// 核心类型trait - 支持多种序列化方案
pub trait Type: Send + Sync + Debug {
    fn type_name(&self) -> &'static str;
    
    /// 类型安全的二进制序列化（推荐用于节点间传递）
    fn to_bytes(&self) -> Result<Vec<u8>, String>;
    fn from_bytes(bytes: &[u8]) -> Result<Box<dyn Type>, String> where Self: Sized;
    
    /// JSON序列化（用于调试和可读性）
    fn to_json(&self) -> serde_json::Value;
    fn from_json(value: serde_json::Value) -> Result<Box<dyn Type>, String> where Self: Sized;
    
    /// 运行时类型检查
    fn as_any(&self) -> &dyn Any;
    fn clone_type(&self) -> Box<dyn Type>;
    fn is_compatible_with(&self, other: &dyn Type) -> bool;
}

/// 支持版本化的序列化包装器
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TypedValue {
    type_name: String,
    version: u32,
    data: Vec<u8>,
}

impl TypedValue {
    pub fn new<T: Type + Serialize>(value: &T) -> Result<Self, String> {
        let data = bincode::serialize(value)
            .map_err(|e| format!("序列化失败: {}", e))?;
        
        Ok(TypedValue {
            type_name: value.type_name().to_string(),
            version: 1, // TODO: 从类型注册表获取版本
            data,
        })
    }
    
    pub fn deserialize<T: Type + for<'de> Deserialize<'de>>(&self) -> Result<T, String> {
        bincode::deserialize(&self.data)
            .map_err(|e| format!("反序列化失败: {}", e))
    }
}

/// 类型安全的容器
#[derive(Debug)]
pub struct NodeInputs {
    pub(crate) inputs: std::collections::HashMap<String, TypedValue>,
}

#[derive(Debug)]
pub struct NodeOutputs {
    pub(crate) outputs: std::collections::HashMap<String, TypedValue>,
}

impl NodeInputs {
    pub fn new() -> Self {
        Self {
            inputs: std::collections::HashMap::new(),
        }
    }
    
    pub fn insert<T: Type + Serialize>(&mut self, name: &str, value: T) -> Result<(), String> {
        let typed_value = TypedValue::new(&value)?;
        self.inputs.insert(name.to_string(), typed_value);
        Ok(())
    }
    
    pub fn get<T: Type + for<'de> Deserialize<'de>>(&self, name: &str) -> Result<T, String> {
        let typed_value = self.inputs.get(name)
            .ok_or_else(|| format!("输入 '{}' 不存在", name))?;
        typed_value.deserialize::<T>()
    }
    
    /// 调试用的JSON输出
    pub fn to_json(&self) -> serde_json::Value {
        let mut json_obj = serde_json::Map::new();
        for (key, typed_value) in &self.inputs {
            json_obj.insert(key.clone(), serde_json::json!({
                "type": typed_value.type_name,
                "version": typed_value.version,
                "size_bytes": typed_value.data.len()
            }));
        }
        serde_json::Value::Object(json_obj)
    }
}

impl NodeOutputs {
    pub fn new() -> Self {
        Self {
            outputs: std::collections::HashMap::new(),
        }
    }
    
    pub fn insert<T: Type + Serialize>(&mut self, name: &str, value: T) -> Result<(), String> {
        let typed_value = TypedValue::new(&value)?;
        self.outputs.insert(name.to_string(), typed_value);
        Ok(())
    }
    
    pub fn get<T: Type + for<'de> Deserialize<'de>>(&self, name: &str) -> Result<T, String> {
        let typed_value = self.outputs.get(name)
            .ok_or_else(|| format!("输出 '{}' 不存在", name))?;
        typed_value.deserialize::<T>()
    }
    
    /// 检查输出是否为空
    pub fn is_empty(&self) -> bool {
        self.outputs.is_empty()
    }
    
    /// 调试用的JSON输出
    pub fn to_json(&self) -> serde_json::Value {
        let mut json_obj = serde_json::Map::new();
        for (key, typed_value) in &self.outputs {
            json_obj.insert(key.clone(), serde_json::json!({
                "type": typed_value.type_name,
                "version": typed_value.version,
                "size_bytes": typed_value.data.len()
            }));
        }
        serde_json::Value::Object(json_obj)
    }
}

// 为NodeOutputs实现Clone
impl Clone for NodeOutputs {
    fn clone(&self) -> Self {
        Self {
            outputs: self.outputs.clone(),
        }
    }
}

// 为NodeOutputs实现PartialEq - 基于JSON比较
impl PartialEq for NodeOutputs {
    fn eq(&self, other: &Self) -> bool {
        self.to_json() == other.to_json()
    }
}

// 为NodeOutputs实现Serialize
impl Serialize for NodeOutputs {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        self.to_json().serialize(serializer)
    }
}

// 为NodeOutputs实现Deserialize
impl<'de> Deserialize<'de> for NodeOutputs {
    fn deserialize<D>(_deserializer: D) -> Result<NodeOutputs, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        // 简化的反序列化实现
        Ok(NodeOutputs::new())
    }
} 