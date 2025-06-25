use serde::{Deserialize, Serialize};
use std::any::Any;
use std::fmt;

/// 动态语义标签trait，支持运行时类型检查和序列化
pub trait DynamicLabel: Any + Send + Sync {
    fn type_name(&self) -> &'static str;
    fn clone_box(&self) -> Box<dyn DynamicLabel>;
    fn as_any(&self) -> &dyn Any;
    fn serialize_json(&self) -> Result<String, serde_json::Error>;
}

impl fmt::Debug for dyn DynamicLabel {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "DynamicLabel({})", self.type_name())
    }
}

impl Clone for Box<dyn DynamicLabel> {
    fn clone(&self) -> Self {
        self.clone_box()
    }
}

/// 具体语义标签的实现宏
#[macro_export]
macro_rules! impl_dynamic_label {
    ($type:ty) => {
        impl DynamicLabel for $type {
            fn type_name(&self) -> &'static str {
                std::any::type_name::<$type>()
            }
            
            fn clone_box(&self) -> Box<dyn DynamicLabel> {
                Box::new(self.clone())
            }
            
            fn as_any(&self) -> &dyn Any {
                self
            }
            
            fn serialize_json(&self) -> Result<String, serde_json::Error> {
                serde_json::to_string(self)
            }
        }
    };
}

/// 基础语义标签类型
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct IntLabel(pub i64);

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct BoolLabel(pub bool);

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct StringLabel(pub String);

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SignalLabel(pub ControlSignal);

/// 控制信号类型
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum ControlSignal {
    Active,
    Inactive,
    None,
}

// 为基础类型实现DynamicLabel
impl_dynamic_label!(IntLabel);
impl_dynamic_label!(BoolLabel);
impl_dynamic_label!(StringLabel);
impl_dynamic_label!(SignalLabel);

/// 语义标签转换工具
impl IntLabel {
    pub fn new(value: i64) -> Self {
        Self(value)
    }
    
    pub fn value(&self) -> i64 {
        self.0
    }
}

impl BoolLabel {
    pub fn new(value: bool) -> Self {
        Self(value)
    }
    
    pub fn value(&self) -> bool {
        self.0
    }
}

impl StringLabel {
    pub fn new(value: String) -> Self {
        Self(value)
    }
    
    pub fn value(&self) -> &str {
        &self.0
    }
}

impl SignalLabel {
    pub fn new(signal: ControlSignal) -> Self {
        Self(signal)
    }
    
    pub fn signal(&self) -> &ControlSignal {
        &self.0
    }
} 