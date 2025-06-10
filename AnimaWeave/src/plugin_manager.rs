// AnimaWeave 插件管理器 - 真正的插件架构

use std::collections::HashMap;
use std::fs;
use std::path::Path;
use serde::{Serialize, Deserialize};

// ===== 插件接口定义 =====

pub trait AnimaPlugin: Send + Sync {
    fn name(&self) -> &str;
    fn version(&self) -> &str;
    fn get_types(&self) -> HashMap<String, TypeSpec>;
    fn get_nodes(&self) -> HashMap<String, NodeSpec>;
    fn execute_node(&self, node_name: &str, inputs: HashMap<String, PluginValue>) -> Result<HashMap<String, PluginValue>, String>;
}

// ===== 插件系统的通用类型 =====

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum PluginValue {
    // 基础类型
    Int(i32),
    Double(f64),
    String(String),
    Bool(bool),
    
    // 扩展类型 - 使用通用容器
    Custom {
        type_name: String,
        data: serde_json::Value,
    }
}

impl PluginValue {
    pub fn is_signal(&self) -> bool {
        match self {
            PluginValue::Custom { type_name, .. } => type_name == "Signal",
            _ => false,
        }
    }
    
    pub fn is_uuid(&self) -> bool {
        match self {
            PluginValue::Custom { type_name, .. } => type_name == "UUID",
            _ => false,
        }
    }
}

#[derive(Debug, Clone)]
pub struct TypeSpec {
    pub name: String,
    pub package: String,
    pub serializable: bool,
}

#[derive(Debug, Clone)]
pub struct NodeSpec {
    pub name: String,
    pub package: String,
    pub inputs: HashMap<String, String>,  // input_name -> type_name
    pub outputs: HashMap<String, String>, // output_name -> type_name
    pub concurrent: bool,
}

// ===== 插件注册表 =====

pub struct PluginRegistry {
    plugins: HashMap<String, Box<dyn AnimaPlugin>>,
}

impl PluginRegistry {
    pub fn new() -> Self {
        Self {
            plugins: HashMap::new(),
        }
    }
    
    /// 动态注册插件
    pub fn register_plugin(&mut self, plugin: Box<dyn AnimaPlugin>) -> Result<(), String> {
        let name = plugin.name().to_string();
        
        // 检查重复注册
        if self.plugins.contains_key(&name) {
            return Err(format!("Plugin {} already registered", name));
        }
        
        // 验证插件
        self.validate_plugin(&*plugin)?;
        
        self.plugins.insert(name, plugin);
        Ok(())
    }
    
    /// 获取插件
    pub fn get_plugin(&self, name: &str) -> Option<&dyn AnimaPlugin> {
        self.plugins.get(name).map(|p| &**p)
    }
    
    /// 获取所有已注册的插件名称
    pub fn list_plugins(&self) -> Vec<String> {
        self.plugins.keys().cloned().collect()
    }
    
    /// 根据DSL导入声明加载所需插件
    pub fn load_required_plugins(&mut self, sanctum_path: &Path) -> Result<(), String> {
        // 扫描.anima文件，解析import声明
        let mut required_plugins = std::collections::HashSet::new();
        
        for entry in fs::read_dir(sanctum_path).map_err(|e| format!("Failed to read sanctum: {}", e))? {
            let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
            let path = entry.path();
            
            if path.extension().map_or(false, |ext| ext == "anima") {
                let content = fs::read_to_string(&path).map_err(|e| format!("Failed to read file: {}", e))?;
                
                // 解析文件名作为包名 (basic.anima -> basic)
                if let Some(stem) = path.file_stem() {
                    if let Some(package_name) = stem.to_str() {
                        required_plugins.insert(package_name.to_string());
                    }
                }
            }
        }
        
        // 首先加载静态插件
        // self.load_static_plugins()?; // 暂时注释掉，因为宏系统还在调试中
        
        // 开发时直接注册basic插件
        // TODO: 这里需要通过其他机制加载插件，避免循环依赖
        // #[cfg(test)]
        // {
        //     if !self.plugins.contains_key("basic") {
        //         let plugin = anima_plugin_basic::create_plugin();
        //         self.register_plugin(plugin)?;
        //     }
        // }
        
        // 然后动态加载所需插件
        for package_name in required_plugins {
            if !self.plugins.contains_key(&package_name) {
                self.try_load_plugin(&package_name)?;
            }
        }
        
        Ok(())
    }
    
    /// 动态发现和加载插件
    fn discover_and_load_plugin(&mut self, package_name: &str) -> Result<(), String> {
        // 策略1: 查找同名的.so动态库
        let plugin_paths = [
            format!("plugins/lib{}.so", package_name),
            format!("target/release/deps/lib{}.so", package_name),
            format!("./lib{}.so", package_name),
        ];
        
        for plugin_path in &plugin_paths {
            if Path::new(plugin_path).exists() {
                return self.load_dynamic_plugin(plugin_path);
            }
        }
        
        // 策略2: 尝试从静态注册的插件中查找
        // 这里不再硬编码任何特定插件，而是依赖插件自己注册
        
        Err(format!("Plugin '{}' not found. Please ensure the plugin is installed or properly registered.", package_name))
    }
    
    /// 加载动态库插件
    fn load_dynamic_plugin(&mut self, path: &str) -> Result<(), String> {
        #[cfg(feature = "dynamic-plugins")]
        {
            use crate::plugin_macros::dynamic::load_dynamic_plugin;
            let dynamic_plugin = load_dynamic_plugin(path)?;
            self.register_plugin(dynamic_plugin.plugin)?;
            Ok(())
        }
        
        #[cfg(not(feature = "dynamic-plugins"))]
        {
            Err(format!("Dynamic plugin loading is disabled. Plugin path: {}", path))
        }
    }
    
    /// 验证插件的合法性
    fn validate_plugin(&self, plugin: &dyn AnimaPlugin) -> Result<(), String> {
        let types = plugin.get_types();
        let nodes = plugin.get_nodes();
        
        // 验证节点引用的类型都存在
        for (node_name, node_spec) in &nodes {
            for (_, type_name) in &node_spec.inputs {
                if !types.contains_key(type_name) {
                    return Err(format!("Node {} references unknown input type: {}", node_name, type_name));
                }
            }
            for (_, type_name) in &node_spec.outputs {
                if !types.contains_key(type_name) {
                    return Err(format!("Node {} references unknown output type: {}", node_name, type_name));
                }
            }
        }
        
        Ok(())
    }
    
    /// 从静态注册表加载插件
    pub fn load_static_plugins(&mut self) -> Result<(), String> {
        use crate::plugin_macros::load_static_plugins;
        load_static_plugins(self)
    }
    
    /// 尝试从各种来源加载插件
    pub fn try_load_plugin(&mut self, package_name: &str) -> Result<(), String> {
        // 首先尝试从已注册的静态插件中查找
        // 这里可以通过某种机制（比如全局注册表）来查找
        
        // 如果静态插件中没有，再尝试动态加载
        self.discover_and_load_plugin(package_name)
    }
} 