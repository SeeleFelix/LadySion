// AnimaWeave 核心架构 - 完全插件化设计
// 命名体系：AnimaWeave (灵魂编织)
// - awakening: 觉醒 (execute_dsl)
// - sanctum: 圣所 (source_files) 
// - genesis: 创世 (entry_graph)
// - FateEcho: 命运回音 (ExecutionResult)

use std::collections::HashMap;
use serde_json;

// 导入插件模块 (内部使用)
mod plugins;
mod plugin_registry;
mod types;
mod parser;

// 重新导出核心类型
pub use types::{TypedValue, NodeInputs, NodeOutputs, Type};
pub use plugin_registry::PluginRegistry;
// parser函数通过内部调用，不需要重新导出

// 重新导出插件接口
pub trait ExecutionEnginePlugin: Send + Sync {
    fn execute_node(&self, node_type: &str, inputs: &NodeInputs) -> Result<NodeOutputs, String>;
    fn supported_node_types(&self) -> Vec<String>;
}

pub trait TypeSystemPlugin: Send + Sync {
    fn create_default_typed_value(&self, type_name: &str) -> Result<TypedValue, String>;
    fn supported_types(&self) -> Vec<String>;
}

// ===== 对外接口 - 最小化暴露 =====

/// AnimaWeave主执行函数
pub fn awakening(sanctum_path: &str, weave_filename: &str) -> FateEcho {
    // 1. 初始化插件注册表
    let mut plugin_registry = PluginRegistry::new();
    if let Err(e) = plugin_registry.initialize_basic_plugins() {
        return FateEcho {
            status: ExecutionStatus::Error(format!("插件初始化失败: {}", e)),
            outputs: "{}".to_string(),
        };
    }

    // 2. 解析weave文件
    let weave_file_path = format!("{}/{}.weave", sanctum_path, weave_filename);
    let weave_content = match std::fs::read_to_string(&weave_file_path) {
        Ok(content) => content,
        Err(e) => {
            return FateEcho {
                status: ExecutionStatus::Error(format!("读取weave文件失败: {}", e)),
                outputs: "{}".to_string(),
            };
        }
    };

    let parser = parser::PestDslParser::new();
    let graph_definition = match parser.parse_graph_file(&weave_content) {
        Ok(def) => def,
        Err(e) => {
            return FateEcho {
                status: ExecutionStatus::Error(format!("解析weave文件失败: {}", e)),
                outputs: "{}".to_string(),
            };
        }
    };

    // 3. 执行图 - 真正的图执行引擎
    let execution_result = execute_graph(&graph_definition, &plugin_registry);
    let all_outputs = match execution_result {
        Ok(outputs) => outputs,
        Err(e) => {
            return FateEcho {
                status: ExecutionStatus::Error(e),
                outputs: "{}".to_string(),
            };
        }
    };

    // 5. 返回执行结果
    FateEcho {
        status: ExecutionStatus::Success,
        outputs: serialize_outputs(&all_outputs),
    }
}

/// 图执行引擎 - 事件驱动的动态执行模型
fn execute_graph(graph: &GraphDefinition, registry: &PluginRegistry) -> Result<HashMap<String, NodeOutputs>, String> {
    let mut all_outputs: HashMap<String, NodeOutputs> = HashMap::new();
    let mut executed_nodes: std::collections::HashSet<String> = std::collections::HashSet::new();
    let mut ready_nodes: Vec<String> = Vec::new();
    
    // 1. 找到所有的Start节点作为入口点
    for (node_name, node_spec) in &graph.node_instances {
        if node_spec.node_type == "Start" {
            ready_nodes.push(node_name.clone());
            eprintln!("Debug: 找到启动节点: {}", node_name);
        }
    }
    
    if ready_nodes.is_empty() {
        return Err("图中没有找到Start节点作为执行入口".to_string());
    }
    
    // 2. 事件驱动循环：持续执行直到没有就绪节点
    while !ready_nodes.is_empty() {
        let mut next_ready_nodes = Vec::new();
        
        // 并行执行所有就绪节点
        for node_name in ready_nodes {
            if executed_nodes.contains(&node_name) {
                continue; // 跳过已执行的节点
            }
            
            let node_spec = &graph.node_instances[&node_name];
            
            // 构建节点输入：从共享输出空间收集数据和控制信号
            let mut node_inputs = NodeInputs::new();
            
            // 查找所有指向当前节点的数据连接
            for connection in &graph.data_connections {
                if connection.to_node == node_name {
                    if let Some(upstream_outputs) = all_outputs.get(&connection.from_node) {
                        if let Some(output_value) = upstream_outputs.get_raw(&connection.from_port) {
                            node_inputs.insert_raw(&connection.to_port, output_value.clone());
                            eprintln!("Debug: 数据流 {}.{} -> {}.{}", 
                                connection.from_node, connection.from_port,
                                connection.to_node, connection.to_port);
                        }
                    }
                }
            }
            
            // 查找所有指向当前节点的控制连接
            for connection in &graph.control_connections {
                if connection.to_node == node_name {
                    if let Some(upstream_outputs) = all_outputs.get(&connection.from_node) {
                        if let Some(control_signal) = upstream_outputs.get_raw(&connection.from_port) {
                            node_inputs.insert_raw(&connection.to_port, control_signal.clone());
                            eprintln!("Debug: 控制流输入 {}.{} -> {}.{}", 
                                connection.from_node, connection.from_port,
                                connection.to_node, connection.to_port);
                        }
                    }
                }
            }
            
            // 执行节点
            let full_node_type = format!("{}.{}", node_spec.package, node_spec.node_type);
            eprintln!("Debug: 执行节点 {} ({})", node_name, full_node_type);
            eprintln!("Debug: 输入端口数: {}", node_inputs.0.len());
            
            match registry.execute_node(&full_node_type, &node_inputs) {
                Ok(node_output) => {
                    eprintln!("Debug: 节点 {} 执行成功，输出端口数: {}", node_name, node_output.0.len());
                    
                    // 将输出保存到共享输出空间
                    all_outputs.insert(node_name.clone(), node_output);
                    executed_nodes.insert(node_name.clone());
                    
                    // 检查控制信号：找到所有被这个节点触发的下游节点
                    for connection in &graph.control_connections {
                        if connection.from_node == node_name {
                            // 检查控制信号是否存在
                            if let Some(outputs) = all_outputs.get(&node_name) {
                                if outputs.get_raw(&connection.from_port).is_some() {
                                    // 触发下游节点
                                    if !executed_nodes.contains(&connection.to_node) {
                                        next_ready_nodes.push(connection.to_node.clone());
                                        eprintln!("Debug: 控制流触发 {}.{} -> {}.{}", 
                                            connection.from_node, connection.from_port,
                                            connection.to_node, connection.to_port);
                                    }
                                }
                            }
                        }
                    }
                }
                Err(e) => {
                    return Err(format!("节点 {} 执行失败: {}", node_name, e));
                }
            }
        }
        
        // 去重下一轮就绪节点
        next_ready_nodes.sort();
        next_ready_nodes.dedup();
        ready_nodes = next_ready_nodes;
        
        eprintln!("Debug: 下一轮就绪节点: {:?}", ready_nodes);
    }
    
    eprintln!("Debug: 图执行完成，已执行节点: {:?}", executed_nodes);
    
    // 过滤输出：只保留没有被其他节点消费的"终端端口"
    let filtered_outputs = filter_terminal_outputs(&all_outputs, graph);
    Ok(filtered_outputs)
}

/// 过滤输出：只保留没有被其他节点消费的"终端端口"
fn filter_terminal_outputs(all_outputs: &HashMap<String, NodeOutputs>, graph: &GraphDefinition) -> HashMap<String, NodeOutputs> {
    let mut filtered_outputs = HashMap::new();
    
    for (node_name, node_outputs) in all_outputs {
        let mut filtered_node_outputs = NodeOutputs::new();
        
        // 检查每个输出端口是否被消费
        for (port_name, output_value) in &node_outputs.0 {
            let mut is_consumed = false;
            
            // 检查数据连接：这个输出是否被其他节点的输入消费
            for connection in &graph.data_connections {
                if connection.from_node == *node_name && connection.from_port == *port_name {
                    is_consumed = true;
                    eprintln!("Debug: 过滤掉被消费的数据输出 {}.{} -> {}.{}", 
                        connection.from_node, connection.from_port,
                        connection.to_node, connection.to_port);
                    break;
                }
            }
            
            // 检查控制连接：这个输出是否被其他节点的控制输入消费
            if !is_consumed {
                for connection in &graph.control_connections {
                    if connection.from_node == *node_name && connection.from_port == *port_name {
                        is_consumed = true;
                        eprintln!("Debug: 过滤掉被消费的控制输出 {}.{} -> {}.{}", 
                            connection.from_node, connection.from_port,
                            connection.to_node, connection.to_port);
                        break;
                    }
                }
            }
            
            // 只保留未被消费的输出端口
            if !is_consumed {
                filtered_node_outputs.insert_raw(port_name, output_value.clone());
                eprintln!("Debug: 保留终端输出 {}.{}", node_name, port_name);
            }
        }
        
        // 只有当节点还有输出端口时才加入结果
        if !filtered_node_outputs.is_empty() {
            filtered_outputs.insert(node_name.clone(), filtered_node_outputs);
        }
    }
    
    eprintln!("Debug: 过滤后的输出节点数: {}", filtered_outputs.len());
    filtered_outputs
}

/// 序列化节点输出为字符串格式
pub fn serialize_outputs(outputs: &HashMap<String, NodeOutputs>) -> String {
    // 使用JSON序列化，保留完整的类型信息
    match serde_json::to_string_pretty(outputs) {
        Ok(json) => json,
        Err(e) => format!("{{\"error\": \"序列化失败: {}\"}}", e),
    }
}

/// 反序列化输出字符串为NodeOutputs映射
pub fn deserialize_outputs(outputs_str: &str) -> Result<HashMap<String, NodeOutputs>, String> {
    serde_json::from_str(outputs_str)
        .map_err(|e| format!("反序列化失败: {}", e))
}

/// 执行状态
#[derive(Debug, Clone, PartialEq)]
pub enum ExecutionStatus {
    Success,
    Error(String),
}

/// 命运回音 - 执行结果
#[derive(Debug, Clone)]
pub struct FateEcho {
    pub status: ExecutionStatus,
    pub outputs: String, // 序列化的所有节点输出端口
}

impl FateEcho {
    /// 获取反序列化的输出映射
    pub fn get_outputs(&self) -> Result<HashMap<String, NodeOutputs>, String> {
        deserialize_outputs(&self.outputs)
    }
}

// ===== 插件接口定义 - 已在上面定义，这里删除重复定义 =====

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
    pub node_instances: HashMap<String, NodeSpec>, // 改名以匹配awakening函数中的使用
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_plugin_registry() {
        let mut registry = PluginRegistry::new();
        // 这行代码在awakening函数中已经有了，这里应该删除
    }
}