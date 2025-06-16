// AnimaWeave DSL解析器 - 使用Pest进行专业解析
use pest::Parser;
use pest_derive::Parser;
use std::collections::HashMap;
use crate::{AnimaDefinition, NodeDefinition, PortDefinition, GraphDefinition, NodeSpec, ExecutionMode, ControlMode, Connection};

#[derive(Parser)]
#[grammar = "anima-weave.pest"]
pub struct AnimaWeaveParser;

pub struct PestDslParser;

impl PestDslParser {
    pub fn new() -> Self {
        Self
    }
    
    pub fn parse_anima_file(&self, content: &str) -> Result<AnimaDefinition, String> {
        eprintln!("Debug: 开始解析anima文件，内容长度: {}", content.len());
        
        let result = AnimaWeaveParser::parse(Rule::AnimaWeave_file, content);
        match result {
            Ok(mut pairs) => {
                eprintln!("Debug: 解析成功");
                let file_pair = pairs.next().unwrap();
                
                let mut types = Vec::new();
                let mut nodes = HashMap::new();
                
                for section in file_pair.into_inner() {
                    match section.as_rule() {
                        Rule::file_content => {
                            // 处理file_content，内部应该是definition_file
                            for content_part in section.into_inner() {
                                match content_part.as_rule() {
                                    Rule::definition_file => {
                                        // 处理definition_file内容
                                        for def_part in content_part.into_inner() {
                                            match def_part.as_rule() {
                                                Rule::import_section => {
                                                    eprintln!("Debug: 处理import section");
                                                }
                                                Rule::types_section => {
                                                    eprintln!("Debug: 处理types section");
                                                    self.parse_types_section(def_part, &mut types)?;
                                                }
                                                Rule::nodes_section => {
                                                    eprintln!("Debug: 处理nodes section");
                                                    self.parse_nodes_section(def_part, &mut nodes)?;
                                                }
                                                _ => {
                                                    eprintln!("Debug: definition_file中未处理的规则: {:?}", def_part.as_rule());
                                                }
                                            }
                                        }
                                    }
                                    Rule::graph_file => {
                                        // 对于.anima文件，通常不应该是graph_file
                                        eprintln!("Warning: .anima文件包含graph_file内容");
                                    }
                                    _ => {
                                        eprintln!("Debug: file_content中未处理的规则: {:?}", content_part.as_rule());
                                    }
                                }
                            }
                        }
                        Rule::EOI => {}
                        _ => {
                            eprintln!("Debug: 顶层未处理的规则: {:?}", section.as_rule());
                        }
                    }
                }
                
                Ok(AnimaDefinition {
                    types,
                    nodes,
                })
            }
            Err(e) => {
                eprintln!("Debug: 解析失败: {}", e);
                Err(format!("解析anima文件失败: {}", e))
            }
        }
    }
    
    pub fn parse_graph_file(&self, content: &str) -> Result<GraphDefinition, String> {
        eprintln!("Debug: 开始解析graph文件，内容长度: {}", content.len());
        
        let result = AnimaWeaveParser::parse(Rule::AnimaWeave_file, content);
        match result {
            Ok(mut pairs) => {
                eprintln!("Debug: 解析成功");
                let file_pair = pairs.next().unwrap();
                
                let mut graph = GraphDefinition {
                    imports: Vec::new(),
                    node_instances: HashMap::new(),
                    data_connections: Vec::new(),
                    control_connections: Vec::new(),
                };
                
                for section in file_pair.into_inner() {
                    match section.as_rule() {
                        Rule::file_content => {
                            // 处理file_content，内部可能是graph_file或definition_file
                            for content_part in section.into_inner() {
                                match content_part.as_rule() {
                                    Rule::graph_file => {
                                        // 处理graph_file内容
                                        for graph_part in content_part.into_inner() {
                                            match graph_part.as_rule() {
                                                Rule::import_section => {
                                                    self.parse_import_section_new(graph_part, &mut graph.imports)?;
                                                }
                                                Rule::graph_section => {
                                                    self.parse_graph_section(graph_part, &mut graph)?;
                                                }
                                                _ => {
                                                    eprintln!("Debug: graph_file中未处理的规则: {:?}", graph_part.as_rule());
                                                }
                                            }
                                        }
                                    }
                                    Rule::definition_file => {
                                        // 对于.weave文件，通常不应该是definition_file
                                        eprintln!("Warning: .weave文件包含definition_file内容");
                                    }
                                    _ => {
                                        eprintln!("Debug: file_content中未处理的规则: {:?}", content_part.as_rule());
                                    }
                                }
                            }
                        }
                        Rule::EOI => {}
                        _ => {
                            eprintln!("Debug: 顶层未处理的规则: {:?}", section.as_rule());
                        }
                    }
                }
                
                Ok(graph)
            }
            Err(e) => {
                eprintln!("Debug: 解析失败: {}", e);
                Err(format!("解析.weave文件失败: {}", e))
            }
        }
    }
    
    fn parse_section(&self, section: pest::iterators::Pair<Rule>, types: &mut Vec<String>, nodes: &mut HashMap<String, NodeDefinition>) -> Result<(), String> {
        for inner in section.into_inner() {
            match inner.as_rule() {
                Rule::types_section => {
                    self.parse_types_section(inner, types)?;
                }
                Rule::nodes_section => {
                    self.parse_nodes_section(inner, nodes)?;
                }
                _ => {}
            }
        }
        Ok(())
    }
    
    fn parse_types_section(&self, types_section: pest::iterators::Pair<Rule>, types: &mut Vec<String>) -> Result<(), String> {
        for inner in types_section.into_inner() {
            match inner.as_rule() {
                Rule::type_definition => {
                    for type_pair in inner.into_inner() {
                        if type_pair.as_rule() == Rule::type_name {
                            for name_pair in type_pair.into_inner() {
                                if name_pair.as_rule() == Rule::qualified_name {
                                    types.push(name_pair.as_str().to_string());
                                }
                            }
                        }
                    }
                }
                _ => {}
            }
        }
        Ok(())
    }
    
    fn parse_nodes_section(&self, nodes_section: pest::iterators::Pair<Rule>, nodes: &mut HashMap<String, NodeDefinition>) -> Result<(), String> {
        for node_def in nodes_section.into_inner() {
            if node_def.as_rule() == Rule::node_definition {
                let mut inner = node_def.into_inner();
                let node_name = inner.next().unwrap().as_str().to_string();
                
                let mut mode = ExecutionMode::Concurrent;
                let mut inputs = HashMap::new();
                let mut outputs = HashMap::new();
                
                for content in inner {
                    match content.as_rule() {
                        Rule::mode_declaration => {
                            mode = self.parse_mode_declaration(content)?;
                        }
                        Rule::port_sections => {
                            self.parse_port_sections(content, &mut inputs, &mut outputs)?;
                        }
                        _ => {}
                    }
                }
                
                nodes.insert(node_name.clone(), NodeDefinition {
                    name: node_name,
                    mode,
                    inputs,
                    outputs,
                });
            }
        }
        Ok(())
    }
    
    fn parse_node_definition(&self, node_def: pest::iterators::Pair<Rule>) -> Result<NodeDefinition, String> {
        let mut name = String::new();
        let mut mode = ExecutionMode::Concurrent;
        let mut inputs = HashMap::new();
        let mut outputs = HashMap::new();
        
        for inner in node_def.into_inner() {
            match inner.as_rule() {
                Rule::identifier => {
                    if name.is_empty() {
                        name = inner.as_str().to_string();
                    }
                }
                Rule::mode_declaration => {
                    mode = self.parse_mode_declaration(inner)?;
                }
                Rule::port_sections => {
                    self.parse_port_sections(inner, &mut inputs, &mut outputs)?;
                }
                _ => {}
            }
        }
        
        Ok(NodeDefinition {
            name,
            mode,
            inputs,
            outputs,
        })
    }
    
    fn parse_mode_declaration(&self, mode_decl: pest::iterators::Pair<Rule>) -> Result<ExecutionMode, String> {
        for inner in mode_decl.into_inner() {
            if inner.as_rule() == Rule::concurrent_mode {
                return match inner.as_str() {
                    "Concurrent" => Ok(ExecutionMode::Concurrent),
                    "Sequential" => Ok(ExecutionMode::Sequential),
                    _ => Err(format!("未知的执行模式: {}", inner.as_str())),
                };
            }
        }
        Ok(ExecutionMode::Concurrent)
    }
    
    fn parse_port_sections(&self, port_sections: pest::iterators::Pair<Rule>, inputs: &mut HashMap<String, PortDefinition>, outputs: &mut HashMap<String, PortDefinition>) -> Result<(), String> {
        for section in port_sections.into_inner() {
            match section.as_rule() {
                Rule::in_section => {
                    for port_list in section.into_inner() {
                        if port_list.as_rule() == Rule::port_list {
                            for port_def in port_list.into_inner() {
                                if port_def.as_rule() == Rule::port_definition {
                                    let mut inner = port_def.into_inner();
                                    let name = inner.next().unwrap().as_str().to_string();
                                    let type_name = inner.next().unwrap().as_str().to_string();
                                    
                                    inputs.insert(name.clone(), PortDefinition {
                                        name,
                                        type_name,
                                        optional: false,
                                        control_mode: None,
                                    });
                                }
                            }
                        }
                    }
                }
                Rule::out_section => {
                    for port_list in section.into_inner() {
                        if port_list.as_rule() == Rule::port_list {
                            for port_def in port_list.into_inner() {
                                if port_def.as_rule() == Rule::port_definition {
                                    let mut inner = port_def.into_inner();
                                    let name = inner.next().unwrap().as_str().to_string();
                                    let type_name = inner.next().unwrap().as_str().to_string();
                                    
                                    outputs.insert(name.clone(), PortDefinition {
                                        name,
                                        type_name,
                                        optional: false,
                                        control_mode: None,
                                    });
                                }
                            }
                        }
                    }
                }
                _ => {}
            }
        }
        Ok(())
    }
    
    fn parse_graph_section_content(&self, section: pest::iterators::Pair<Rule>, imports: &mut Vec<String>, nodes: &mut HashMap<String, NodeSpec>) -> Result<(), String> {
        // 这个方法已经不再需要，由parse_graph_section替代
        Ok(())
    }
    
    fn parse_import_section_new(&self, import_section: pest::iterators::Pair<Rule>, imports: &mut Vec<String>) -> Result<(), String> {
        for inner in import_section.into_inner() {
            match inner.as_rule() {
                Rule::import_list => {
                    for import_statement in inner.into_inner() {
                        if import_statement.as_rule() == Rule::import_statement {
                            let mut statement_inner = import_statement.into_inner();
                            if let Some(qualified_name) = statement_inner.next() {
                                imports.push(qualified_name.as_str().to_string());
                            }
                        }
                    }
                }
                _ => {}
            }
        }
        Ok(())
    }
    
    fn parse_graph_section(&self, graph_section: pest::iterators::Pair<Rule>, graph: &mut GraphDefinition) -> Result<(), String> {
        eprintln!("Debug: 开始解析graph_section");
        for content in graph_section.into_inner() {
            eprintln!("Debug: 处理graph_section中的规则: {:?}", content.as_rule());
            match content.as_rule() {
                Rule::graph_body => {
                    for body_content in content.into_inner() {
                        match body_content.as_rule() {
                            Rule::nodes_instance_section => {
                                self.parse_nodes_instance_section(body_content, &mut graph.node_instances)?;
                            }
                            Rule::data_connection_section => {
                                self.parse_data_connections(body_content, &mut graph.data_connections)?;
                            }
                            Rule::control_connection_section => {
                                self.parse_control_connections(body_content, &mut graph.control_connections)?;
                            }
                            _ => {}
                        }
                    }
                }
                _ => {}
            }
        }
        Ok(())
    }
    
    fn parse_nodes_instance_section(&self, nodes_section: pest::iterators::Pair<Rule>, nodes: &mut HashMap<String, NodeSpec>) -> Result<(), String> {
        eprintln!("Debug: 开始解析nodes_instance_section");
        eprintln!("Debug: nodes_section规则: {:?}", nodes_section.as_rule());
        eprintln!("Debug: nodes_section内容: '{}'", nodes_section.as_str());
        
        let inner_count = nodes_section.clone().into_inner().count();
        eprintln!("Debug: nodes_section内部规则数量: {}", inner_count);
        
        for (i, content) in nodes_section.into_inner().enumerate() {
            eprintln!("Debug: 第{}个内部规则: {:?}, 内容: '{}'", i, content.as_rule(), content.as_str());
            if content.as_rule() == Rule::node_instances {
                eprintln!("Debug: 找到node_instances，开始解析");
                for (j, node_instance) in content.into_inner().enumerate() {
                    eprintln!("Debug: 第{}个node_instance: {:?}, 内容: '{}'", j, node_instance.as_rule(), node_instance.as_str());
                    if node_instance.as_rule() == Rule::node_instance {
                        let mut inner = node_instance.into_inner();
                        let instance_name = inner.next().unwrap().as_str().to_string();
                        let qualified_name = inner.next().unwrap().as_str().to_string();
                        
                        // 解析qualified_name为package.node_type
                        let parts: Vec<&str> = qualified_name.split('.').collect();
                        let (package, node_type) = if parts.len() > 1 {
                            (parts[0].to_string(), parts[1].to_string())
                        } else {
                            ("default".to_string(), qualified_name)
                        };
                        
                        eprintln!("Debug: 解析到节点实例: {} -> {}.{}", instance_name, package, node_type);
                        
                        nodes.insert(instance_name.clone(), NodeSpec {
                            instance_name,
                            node_type,
                            package,
                            overrides: None,
                        });
                    }
                }
            }
        }
        Ok(())
    }
    
    fn parse_data_connections(&self, section: pest::iterators::Pair<Rule>, connections: &mut Vec<Connection>) -> Result<(), String> {
        eprintln!("Debug: 开始解析data connections");
        for content in section.into_inner() {
            if content.as_rule() == Rule::connection {
                let connection = self.parse_connection(content)?;
                eprintln!("Debug: 解析到数据连接: {}.{} -> {}.{}", 
                    connection.from_node, connection.from_port,
                    connection.to_node, connection.to_port);
                connections.push(connection);
            }
        }
        Ok(())
    }
    
    fn parse_control_connections(&self, section: pest::iterators::Pair<Rule>, connections: &mut Vec<Connection>) -> Result<(), String> {
        eprintln!("Debug: 开始解析control connections");
        for content in section.into_inner() {
            if content.as_rule() == Rule::connection {
                let connection = self.parse_connection(content)?;
                eprintln!("Debug: 解析到控制连接: {}.{} -> {}.{}", 
                    connection.from_node, connection.from_port,
                    connection.to_node, connection.to_port);
                connections.push(connection);
            }
        }
        Ok(())
    }
    
    fn parse_connection(&self, connection: pest::iterators::Pair<Rule>) -> Result<Connection, String> {
        let mut from_node = String::new();
        let mut from_port = String::new();
        let mut to_node = String::new(); 
        let mut to_port = String::new();
        
        for content in connection.into_inner() {
            match content.as_rule() {
                Rule::connection_source => {
                    let (node, port) = self.parse_port_reference(content)?;
                    from_node = node;
                    from_port = port;
                }
                Rule::connection_target => {
                    let (node, port) = self.parse_port_reference(content)?;
                    to_node = node;
                    to_port = port;
                }
                _ => {}
            }
        }
        
        Ok(Connection {
            from_node,
            from_port,
            to_node,
            to_port,
        })
    }
    
    fn parse_port_reference(&self, port_ref: pest::iterators::Pair<Rule>) -> Result<(String, String), String> {
        let port_str = port_ref.as_str();
        eprintln!("Debug: 解析port_reference: '{}'", port_str);
        
        // 直接用字符串分割，简单粗暴
        let parts: Vec<&str> = port_str.split('.').collect();
        
        if parts.len() != 2 {
            return Err(format!("port_reference格式错误: {}", port_str));
        }
        
        let node_name = parts[0].to_string();
        let port_name = parts[1].to_string();
        
        eprintln!("Debug: 最终解析结果: node='{}', port='{}'", node_name, port_name);
        Ok((node_name, port_name))
    }
} 