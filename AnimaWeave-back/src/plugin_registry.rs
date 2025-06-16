// 插件注册表 - 管理所有插件的生命周期和classpath
use std::collections::HashMap;
use crate::{ExecutionEnginePlugin, TypeSystemPlugin, NodeInputs, NodeOutputs};
use crate::types::TypedValue;

/// 插件注册表 - 管理所有可用的插件
#[derive(Clone)]
pub struct PluginRegistry {
    execution_plugins: HashMap<String, std::sync::Arc<dyn ExecutionEnginePlugin + Send + Sync>>, // 执行引擎插件
    type_plugins: HashMap<String, std::sync::Arc<dyn TypeSystemPlugin + Send + Sync>>, // 类型系统插件
}

impl PluginRegistry {
    pub fn new() -> Self {
        Self {
            execution_plugins: HashMap::new(),
            type_plugins: HashMap::new(),
        }
    }

    /// 注册执行引擎插件
    pub fn register_execution_plugin(&mut self, package: String, plugin: Box<dyn ExecutionEnginePlugin>) {
        self.execution_plugins.insert(package, plugin);
    }

    /// 注册类型系统插件
    pub fn register_type_plugin(&mut self, package: String, plugin: Box<dyn TypeSystemPlugin>) {
        self.type_plugins.insert(package, plugin);
    }

    /// 执行节点
    pub fn execute_node(&self, node_type: &str, inputs: &NodeInputs) -> Result<NodeOutputs, String> {
        // 从node_type解析包名，格式：package.NodeType
        let (package, type_name) = if let Some(dot_pos) = node_type.find('.') {
            let package = &node_type[..dot_pos];
            let type_name = &node_type[dot_pos + 1..];
            (package, type_name)
        } else {
            return Err(format!("无效的节点类型格式: {}, 应该为 package.NodeType", node_type));
        };

        // 查找对应的执行插件
        if let Some(plugin) = self.execution_plugins.get(package) {
            plugin.execute_node(type_name, inputs)
        } else {
            Err(format!("未找到包的执行插件: {}", package))
        }
    }

    /// 创建类型的默认值
    pub fn create_default_typed_value(&self, qualified_type_name: &str) -> Result<TypedValue, String> {
        // 从qualified_type_name解析包名，格式：package.TypeName
        let (package, type_name) = if let Some(dot_pos) = qualified_type_name.find('.') {
            let package = &qualified_type_name[..dot_pos];
            let type_name = &qualified_type_name[dot_pos + 1..];
            (package, type_name)
        } else {
            return Err(format!("无效的类型名格式: {}, 应该为 package.TypeName", qualified_type_name));
        };

        // 查找对应的类型插件
        if let Some(plugin) = self.type_plugins.get(package) {
            plugin.create_default_typed_value(type_name)
        } else {
            Err(format!("未找到包的类型插件: {}", package))
        }
    }

    /// 初始化基础插件
    pub fn initialize_basic_plugins(&mut self) -> Result<(), String> {
        use crate::plugins::basic::plugin::BasicPlugin;
        
        let basic_plugin = BasicPlugin::new();
        
        // 只注册执行引擎插件
        self.register_execution_plugin("basic".to_string(), Box::new(basic_plugin));
        
        Ok(())
    }
} 