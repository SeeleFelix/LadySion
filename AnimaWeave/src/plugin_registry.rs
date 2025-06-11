// 插件注册表 - 管理所有插件的生命周期和classpath
use std::collections::HashMap;
use crate::{ExecutionEnginePlugin, TypeSystemPlugin, Type, NodeInputs, NodeOutputs, NodeSpec};

/// 插件注册表 - 统一管理所有插件和classpath
pub struct PluginRegistry {
    execution_plugins: HashMap<String, Box<dyn ExecutionEnginePlugin>>,
    type_plugins: HashMap<String, Box<dyn TypeSystemPlugin>>,
    package_classpaths: HashMap<String, Vec<String>>, // 包名 -> classpath目录列表
    global_type_registry: HashMap<String, Box<dyn Type>>, // 全局类型注册表
}

impl PluginRegistry {
    pub fn new() -> Self {
        Self {
            execution_plugins: HashMap::new(),
            type_plugins: HashMap::new(),
            package_classpaths: HashMap::new(),
            global_type_registry: HashMap::new(),
        }
    }
    
    /// 注册执行引擎插件
    pub fn register_execution_plugin(&mut self, package_name: String, plugin: Box<dyn ExecutionEnginePlugin>) {
        self.execution_plugins.insert(package_name, plugin);
    }
    
    /// 注册类型系统插件并注册类型
    pub fn register_type_plugin(&mut self, package_name: String, plugin: Box<dyn TypeSystemPlugin>) {
        // 让插件注册其类型到全局注册表
        plugin.register_types(&mut self.global_type_registry);
        self.type_plugins.insert(package_name, plugin);
    }
    
    /// 注册包的classpath
    pub fn register_package_classpath(&mut self, package_name: String, classpath_dirs: Vec<String>) {
        self.package_classpaths.insert(package_name, classpath_dirs);
    }
    
    /// 获取指定包的classpath目录列表
    pub fn get_package_classpath(&self, package_name: &str) -> Result<Vec<String>, String> {
        self.package_classpaths.get(package_name)
            .cloned()
            .ok_or_else(|| format!("包 {} 的classpath未注册", package_name))
    }
    
    /// 自动发现并注册内置插件
    pub fn discover_builtin_plugins(&mut self) -> Result<(), String> {
        // 注册basic插件
        use crate::plugins::basic::BasicPlugin;
        
        let basic_plugin = BasicPlugin;
        
        // 注册basic包的classpath - 指向统一的sanctums目录
        let basic_classpath = vec![
            "sanctums".to_string(),
        ];
        self.register_package_classpath("basic".to_string(), basic_classpath);
        
        // 注册类型系统插件（会自动注册类型）
        self.register_type_plugin("basic".to_string(), Box::new(basic_plugin));
        
        // 注册执行引擎插件
        let basic_execution = BasicPlugin;
        self.register_execution_plugin("basic".to_string(), Box::new(basic_execution));
        
        Ok(())
    }
    
    /// 执行指定包的节点
    pub fn execute_node(&self, node_spec: &NodeSpec, inputs: NodeInputs) -> Result<NodeOutputs, String> {
        if let Some(plugin) = self.execution_plugins.get(&node_spec.package) {
            plugin.execute_node(node_spec, inputs)
        } else {
            Err(format!("未找到包的执行插件: {}", node_spec.package))
        }
    }
    
    /// 创建指定类型的默认值
    pub fn create_default_value(&self, package: &str, type_name: &str) -> Result<Box<dyn Type>, String> {
        if let Some(plugin) = self.type_plugins.get(package) {
            plugin.create_default_value(type_name)
        } else {
            Err(format!("未找到包的类型插件: {}", package))
        }
    }
    
    /// 获取全局类型注册表
    pub fn get_type_registry(&self) -> &HashMap<String, Box<dyn Type>> {
        &self.global_type_registry
    }
    
    /// 获取所有已注册的包列表
    pub fn list_packages(&self) -> Vec<String> {
        let mut packages: Vec<String> = self.execution_plugins.keys().cloned().collect();
        packages.sort();
        packages
    }
    
    /// 验证包是否已注册
    pub fn is_package_registered(&self, package: &str) -> bool {
        self.execution_plugins.contains_key(package) && self.type_plugins.contains_key(package)
    }
} 