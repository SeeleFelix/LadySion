// AnimaWeave 核心架构 - 完全插件化设计
// 命名体系：AnimaWeave (灵魂编织)
// - awakening: 觉醒 (execute_dsl)
// - sanctum: 圣所 (source_files) 
// - genesis: 创世 (entry_graph)
// - FateEcho: 命运回音 (ExecutionResult)

use std::collections::HashMap;
use std::path::Path;
use serde::{Deserialize, Serialize};
use std::any::Any;
use std::fmt::Debug;

// 导入插件模块 (内部使用)
mod plugins {
    pub mod basic;
}
mod plugin_registry;
mod types;
mod parser;
mod dsl {
    pub use crate::{NodeSpec, NodeOverrides, ExecutionMode, ControlMode};
}

use plugin_registry::PluginRegistry;
use parser::PestDslParser;
pub use types::{Type, NodeInputs, NodeOutputs, TypedValue};

// ===== 对外接口 - 最小化暴露 =====

/// 觉醒函数 - 系统唯一对外接口
/// 
/// # 参数
/// - `sanctum`: 圣所路径，包含所有DSL源文件的目录
/// - `genesis`: 创世图名称，不含扩展名
/// 
/// # 返回
/// - `FateEcho`: 执行结果，包含状态、输出和元数据
pub fn awakening(sanctum: &str, genesis: &str) -> FateEcho {
    let system = match AnimaSystem::initialize(sanctum) {
        Ok(system) => system,
        Err(e) => return FateEcho::error(format!("系统初始化失败: {}", e)),
    };
    
    system.execute_genesis(genesis)
}

/// 执行状态
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum ExecutionStatus {
    Success,
    Error(String),
}

/// 命运回音 - 执行结果
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct FateEcho {
    pub status: ExecutionStatus,
    pub outputs: NodeOutputs,
    pub metadata: HashMap<String, String>,
}

impl FateEcho {
    pub fn success(outputs: NodeOutputs) -> Self {
        Self {
            status: ExecutionStatus::Success,
            outputs,
            metadata: HashMap::new(),
        }
    }
    
    pub fn error(message: String) -> Self {
        Self {
            status: ExecutionStatus::Error(message),
            outputs: NodeOutputs::new(),
            metadata: HashMap::new(),
        }
    }
}

// ===== 插件接口定义 =====

/// 执行引擎插件接口  
pub trait ExecutionEnginePlugin: Send + Sync {
    /// 执行单个节点
    fn execute_node(&self, node_spec: &NodeSpec, inputs: NodeInputs) -> Result<NodeOutputs, String>;
    
    /// 获取支持的节点类型
    fn supported_node_types(&self) -> Vec<String> {
        vec![] // 默认实现
    }
}

/// 类型系统插件接口
pub trait TypeSystemPlugin: Send + Sync {
    /// 注册类型到全局注册表
    fn register_types(&self, registry: &mut HashMap<String, Box<dyn Type>>);
    
    /// 创建指定类型的默认值
    fn create_default_value(&self, type_name: &str) -> Result<Box<dyn Type>, String>;
}

// ===== DSL结构定义 =====

#[derive(Debug, Clone)]
pub struct AnimaDefinition {
    pub types: Vec<String>,
    pub nodes: HashMap<String, NodeDefinition>,
}

#[derive(Debug, Clone)]
pub struct NodeDefinition {
    pub name: String,
    pub mode: ExecutionMode,
    pub inputs: HashMap<String, PortDefinition>,
    pub outputs: HashMap<String, PortDefinition>,
}

#[derive(Debug, Clone)]
pub struct PortDefinition {
    pub name: String,
    pub type_name: String,
    pub optional: bool,
    pub control_mode: Option<ControlMode>,
}

#[derive(Debug, Clone)]
pub enum ExecutionMode {
    Concurrent,
    Sequential,
}

#[derive(Debug, Clone)]
pub enum ControlMode {
    And,
    Or,
    Xor,
}

#[derive(Debug, Clone)]
pub struct GraphDefinition {
    pub imports: Vec<String>,
    pub nodes: HashMap<String, NodeSpec>,
    pub data_connections: Vec<Connection>,
    pub control_connections: Vec<Connection>,
}

/// 节点规格 - 公开给插件使用
#[derive(Debug, Clone)]
pub struct NodeSpec {
    pub instance_name: String,
    pub node_type: String,
    pub package: String,
    pub overrides: Option<NodeOverrides>,
}

#[derive(Debug, Clone)]
pub struct NodeOverrides {
    pub mode: Option<ExecutionMode>,
    pub port_modes: HashMap<String, ControlMode>,
}

#[derive(Debug, Clone)]
pub struct Connection {
    pub from_node: String,
    pub from_port: String,
    pub to_node: String,
    pub to_port: String,
}

// ===== 核心系统实现 =====

struct AnimaSystem {
    parser: PestDslParser,
    plugin_registry: PluginRegistry,
    sanctum_path: String,
}

impl AnimaSystem {
    /// 初始化系统
    fn initialize(sanctum_path: &str) -> Result<Self, String> {
        if !Path::new(sanctum_path).exists() {
            return Err(format!("圣所路径不存在: {}", sanctum_path));
        }
        
        let mut plugin_registry = PluginRegistry::new();
        
        // 注册内置插件
        plugin_registry.discover_builtin_plugins()?;
        
        Ok(Self {
            parser: PestDslParser::new(),
            plugin_registry,
            sanctum_path: sanctum_path.to_string(),
        })
    }
    
    /// 执行创世图
    fn execute_genesis(&self, genesis: &str) -> FateEcho {
        // 1. 加载和解析图定义
        let graph = match self.load_and_parse_graph(genesis) {
            Ok(graph) => graph,
            Err(e) => return FateEcho::error(e),
        };
        
        // 2. 加载依赖包
        let anima_defs = match self.load_dependencies(&graph.imports) {
            Ok(defs) => defs,
            Err(e) => return FateEcho::error(e),
        };
        
        // 3. 验证图
        if let Err(e) = self.validate_graph(&graph, &anima_defs) {
            return FateEcho::error(e);
        }
        
        // 4. 执行图
        self.execute_graph(&graph)
    }
    
    fn load_and_parse_graph(&self, genesis: &str) -> Result<GraphDefinition, String> {
        let graph_path = format!("{}/{}.weave", self.sanctum_path, genesis);
        
        if !Path::new(&graph_path).exists() {
            return Err(format!("创世图文件不存在: {}", graph_path));
        }
        
        let content = std::fs::read_to_string(&graph_path)
            .map_err(|e| format!("读取创世图文件失败: {}", e))?;
            
        self.parser.parse_graph_file(&content)
    }
    
    fn load_dependencies(&self, imports: &[String]) -> Result<HashMap<String, AnimaDefinition>, String> {
        let mut anima_defs = HashMap::new();
        
        for package_name in imports {
            let anima_def = self.find_and_parse_anima_file(package_name)?;
            
            // 统一包名：去掉.anima后缀，以便与节点引用的包名匹配
            let normalized_package_name = if package_name.ends_with(".anima") {
                &package_name[..package_name.len() - 6]
            } else {
                package_name
            };
            
            anima_defs.insert(normalized_package_name.to_string(), anima_def);
        }
        
        Ok(anima_defs)
    }
    
    fn find_and_parse_anima_file(&self, package_name: &str) -> Result<AnimaDefinition, String> {
        // 处理包名：如果是basic.anima形式，提取基础名称
        let base_package_name = if package_name.ends_with(".anima") {
            &package_name[..package_name.len() - 6] // 去掉.anima后缀
        } else {
            package_name
        };
        
        // 首先检查指定圣所目录
        let sanctum_path = format!("{}/{}.anima", self.sanctum_path, base_package_name);
        if Path::new(&sanctum_path).exists() {
            let content = std::fs::read_to_string(&sanctum_path)
                .map_err(|e| format!("读取包文件失败: {}", e))?;
            return self.parser.parse_anima_file(&content);
        }
        
        // 然后检查插件类路径
        let classpath_dirs = self.plugin_registry.get_package_classpath(base_package_name)?;
        for dir in classpath_dirs {
            let file_path = format!("{}/{}.anima", dir, base_package_name);
            if Path::new(&file_path).exists() {
                let content = std::fs::read_to_string(&file_path)
                    .map_err(|e| format!("读取包文件失败: {}", e))?;
                return self.parser.parse_anima_file(&content);
            }
        }
        
        Err(format!("包定义文件未找到: {}", base_package_name))
    }
    
    fn validate_graph(&self, graph: &GraphDefinition, anima_defs: &HashMap<String, AnimaDefinition>) -> Result<(), String> {
        // 验证所有节点都有对应的类型定义
        for (instance_name, node_spec) in &graph.nodes {
            let anima_def = anima_defs.get(&node_spec.package)
                .ok_or_else(|| format!("节点 {} 引用的包 {} 未找到", instance_name, node_spec.package))?;
                
            if !anima_def.nodes.contains_key(&node_spec.node_type) {
                return Err(format!("节点 {} 的类型 {} 在包 {} 中未定义", 
                    instance_name, node_spec.node_type, node_spec.package));
            }
        }
        
        // TODO: 验证连接的合法性
        
        Ok(())
    }
    
    fn execute_graph(&self, graph: &GraphDefinition) -> FateEcho {
        // 简化的执行逻辑：按顺序执行所有节点
        let mut outputs = NodeOutputs::new();
        
        eprintln!("Debug: 开始执行图，节点数量: {}", graph.nodes.len());
        for (name, spec) in &graph.nodes {
            eprintln!("Debug: 节点 {} -> 类型 {}.{}", name, spec.package, spec.node_type);
        }
        
        for (instance_name, node_spec) in &graph.nodes {
            // 准备节点输入
            let inputs = NodeInputs::new(); // TODO: 从连接中获取实际输入
            
            // 执行节点
            match self.plugin_registry.execute_node(node_spec, inputs) {
                Ok(node_outputs) => {
                    // 将节点输出合并到最终输出
                    for (port_name, value) in node_outputs.outputs {
                        let full_port_name = format!("{}_{}", instance_name, port_name);
                        outputs.outputs.insert(full_port_name, value);
                    }
                }
                Err(e) => return FateEcho::error(format!("节点 {} 执行失败: {}", instance_name, e)),
            }
        }
        
        FateEcho::success(outputs)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_plugin_registry() {
        let mut registry = PluginRegistry::new();
        registry.discover_builtin_plugins().unwrap();
    }
}