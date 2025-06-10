// AnimaWeave DSL解析器 - 使用Pest进行专业解析
use pest::Parser;
use pest_derive::Parser;
use std::collections::HashMap;
use crate::{AnimaDefinition, NodeDefinition, PortDefinition, GraphDefinition, NodeSpec, ExecutionMode, ControlMode};

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
                
                for line in file_pair.into_inner() {
                    match line.as_rule() {
                        Rule::import_section => {
                            // 处理import section
                            eprintln!("Debug: 处理import section");
                        }
                        Rule::types_section => {
                            self.parse_types_section(line, &mut types)?;
                        }
                        Rule::nodes_section => {
                            self.parse_nodes_section(line, &mut nodes)?;
                        }
                        Rule::EOI => {}
                        _ => {
                            eprintln!("Debug: 未处理的规则: {:?}", line.as_rule());
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
                    nodes: HashMap::new(),
                    data_connections: Vec::new(),
                    control_connections: Vec::new(),
                };
                
                for section in file_pair.into_inner() {
                    match section.as_rule() {
                        Rule::graph_section => {
                            self.parse_graph_section(section, &mut graph)?;
                        }
                        Rule::import_section => {
                            // 处理import section
                            eprintln!("Debug: 处理import section");
                        }
                        Rule::EOI => {}
                        _ => {
                            eprintln!("Debug: 未处理的规则: {:?}", section.as_rule());
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
                    "concurrent" => Ok(ExecutionMode::Concurrent),
                    "sequential" => Ok(ExecutionMode::Sequential),
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
            if inner.as_rule() == Rule::import_statement {
                imports.push(inner.as_str().to_string());
            }
        }
        Ok(())
    }
    
    fn parse_graph_section(&self, graph_section: pest::iterators::Pair<Rule>, graph: &mut GraphDefinition) -> Result<(), String> {
        for content in graph_section.into_inner() {
            match content.as_rule() {
                Rule::graph_body => {
                    for body_content in content.into_inner() {
                        match body_content.as_rule() {
                            Rule::nodes_instance_section => {
                                self.parse_nodes_instance_section(body_content, &mut graph.nodes)?;
                            }
                            Rule::data_connection_section => {
                                // TODO: 解析data connections
                            }
                            Rule::control_connection_section => {
                                // TODO: 解析control connections
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
        for content in nodes_section.into_inner() {
            if content.as_rule() == Rule::node_instances {
                for node_instance in content.into_inner() {
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
} 