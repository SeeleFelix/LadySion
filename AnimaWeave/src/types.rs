use std::any::Any;
use std::collections::HashMap;
use std::fmt::Debug;
use serde::{Serialize, Deserialize};

/// 类型描述符 - 包含类型的完整信息
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct TypeDescriptor {
    pub package: String,
    pub type_name: String,
    pub qualified_name: String, // package.type_name
}

impl TypeDescriptor {
    pub fn new(package: &str, type_name: &str) -> Self {
        Self {
            package: package.to_string(),
            type_name: type_name.to_string(),
            qualified_name: format!("{}.{}", package, type_name),
        }
    }
}

/// 类型化值 - 保留完整类型信息的值容器
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct TypedValue {
    pub type_descriptor: TypeDescriptor,
    pub data: serde_json::Value, // 使用JSON存储，简单有效
}

impl TypedValue {
    /// 从任意可序列化值创建TypedValue
    pub fn new<T: Serialize>(type_desc: TypeDescriptor, value: &T) -> Result<Self, String> {
        let data = serde_json::to_value(value)
            .map_err(|e| format!("序列化失败: {}", e))?;
        
        Ok(Self {
            type_descriptor: type_desc,
            data,
        })
    }
    
    /// 反序列化为指定类型
    pub fn deserialize<T: for<'de> Deserialize<'de>>(&self) -> Result<T, String> {
        serde_json::from_value(self.data.clone())
            .map_err(|e| format!("反序列化失败: {}", e))
    }
    
    /// 获取完全限定的类型名称
    pub fn qualified_type_name(&self) -> &str {
        &self.type_descriptor.qualified_name
    }
}

/// 核心类型trait - 专注类型信息和实例创建
pub trait Type: Send + Sync + Debug {
    /// 类型名称（不含包名）
    fn type_name() -> &'static str where Self: Sized;
    
    /// 包名称
    fn package_name() -> &'static str where Self: Sized;
    
    /// 完全限定的类型名称（包名.类型名）
    fn qualified_type_name() -> String where Self: Sized {
        format!("{}.{}", Self::package_name(), Self::type_name())
    }
    
    /// 获取类型描述符
    fn type_descriptor() -> TypeDescriptor where Self: Sized {
        TypeDescriptor::new(Self::package_name(), Self::type_name())
    }
    
    /// 转换为TypedValue
    fn to_typed_value(&self) -> Result<TypedValue, String> where Self: Serialize + Sized {
        TypedValue::new(Self::type_descriptor(), self)
    }
    
    /// 从TypedValue创建实例
    fn from_typed_value(typed_value: &TypedValue) -> Result<Self, String> 
    where 
        Self: Sized + for<'de> Deserialize<'de> 
    {
        // 检查类型匹配
        let expected = Self::qualified_type_name();
        if typed_value.qualified_type_name() != expected {
            return Err(format!(
                "类型不匹配: 期望 {}, 实际 {}", 
                expected, 
                typed_value.qualified_type_name()
            ));
        }
        
        typed_value.deserialize()
    }
    
    /// 运行时类型检查
    fn as_any(&self) -> &dyn Any;
    
    /// 克隆为新的动态类型实例
    fn clone_boxed(&self) -> Box<dyn Any>;
}

/// 节点输入容器
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct NodeInputs {
    pub inputs: HashMap<String, TypedValue>, // 存储类型化值
}

impl NodeInputs {
    pub fn new() -> Self {
        Self {
            inputs: HashMap::new(),
        }
    }
    
    /// 插入值 - 自动序列化
    pub fn insert<T: Type + Serialize>(&mut self, name: &str, value: &T) -> Result<(), String> {
        let typed_value = value.to_typed_value()?;
        self.inputs.insert(name.to_string(), typed_value);
        Ok(())
    }
    
    /// 获取值 - 自动反序列化和类型检查
    pub fn get<T: Type + for<'de> Deserialize<'de>>(&self, name: &str) -> Result<T, String> {
        let typed_value = self.inputs.get(name)
            .ok_or_else(|| format!("输入端口 {} 不存在", name))?;
        
        T::from_typed_value(typed_value)
    }
    
    /// 获取原始TypedValue
    pub fn get_raw(&self, name: &str) -> Option<&TypedValue> {
        self.inputs.get(name)
    }
    
    /// 插入原始TypedValue
    pub fn insert_raw(&mut self, name: &str, typed_value: TypedValue) {
        self.inputs.insert(name.to_string(), typed_value);
    }
    
    /// 检查是否包含指定端口
    pub fn contains(&self, name: &str) -> bool {
        self.inputs.contains_key(name)
    }
    
    /// 获取所有输入的类型信息
    pub fn get_type_info(&self) -> HashMap<String, String> {
        self.inputs.iter()
            .map(|(name, value)| (name.clone(), value.qualified_type_name().to_string()))
            .collect()
    }
}

/// 节点输出容器
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct NodeOutputs {
    pub outputs: HashMap<String, TypedValue>, // 存储类型化值
}

impl NodeOutputs {
    pub fn new() -> Self {
        Self {
            outputs: HashMap::new(),
        }
    }
    
    /// 插入值 - 自动序列化
    pub fn insert<T: Type + Serialize>(&mut self, name: &str, value: &T) -> Result<(), String> {
        let typed_value = value.to_typed_value()?;
        self.outputs.insert(name.to_string(), typed_value);
        Ok(())
    }
    
    /// 获取值 - 自动反序列化和类型检查
    pub fn get<T: Type + for<'de> Deserialize<'de>>(&self, name: &str) -> Result<T, String> {
        let typed_value = self.outputs.get(name)
            .ok_or_else(|| format!("输出端口 {} 不存在", name))?;
        
        T::from_typed_value(typed_value)
    }
    
    /// 获取原始TypedValue
    pub fn get_raw(&self, name: &str) -> Option<&TypedValue> {
        self.outputs.get(name)
    }
    
    /// 插入原始TypedValue
    pub fn insert_raw(&mut self, name: &str, typed_value: TypedValue) {
        self.outputs.insert(name.to_string(), typed_value);
    }
    
    /// 检查是否包含指定端口
    pub fn contains(&self, name: &str) -> bool {
        self.outputs.contains_key(name)
    }
    
    /// 获取所有输出的类型信息
    pub fn get_type_info(&self) -> HashMap<String, String> {
        self.outputs.iter()
            .map(|(name, value)| (name.clone(), value.qualified_type_name().to_string()))
            .collect()
    }
}
