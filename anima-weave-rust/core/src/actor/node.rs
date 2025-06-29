//! NodeExecutor 抽象定义
//!
//! NodeExecutor是AnimaWeave系统的计算执行单元，负责：
//! - 执行业务逻辑：inputs → process → outputs
//! - 提供节点元信息：类型、端口定义等
//!
//! 设计原则：
//! - 纯函数风格：execute()方法无副作用，只做数据转换
//! - 职责单一：只管业务逻辑执行，不管验证、监控、配置等
//! - 接口简单：只有2个核心方法，外部容易使用和测试

use crate::{actor::NodeExecutionError, NodeControlInputs, NodeDataInputs, NodeDataOutputs, NodeControlOutputs};
use async_trait::async_trait;

/// NodeExecutor 核心接口
///
/// 这个trait定义了节点的纯执行能力，专注于业务逻辑转换
///
/// # 设计哲学
///
/// NodeExecutor就像一个**纯函数**，给定输入，产生确定的输出。
/// 所有复杂的系统职责都交给外部处理：
///
/// - **输入验证** → Coordinator在调用前验证
/// - **监控统计** → 外部监控系统收集
/// - **重试策略** → Coordinator负责重试逻辑
/// - **资源管理** → 运行时系统分配资源
/// - **配置管理** → 构造时传入，运行时不变
///
/// # 职责边界
///
/// ## NodeExecutor 应该做的：
/// - 实现核心业务逻辑（数学运算、字符串处理、AI推理等）
/// - 声明端口定义（输入输出类型、是否必需等）
/// - 返回执行结果或错误
///
/// ## NodeExecutor 不应该做的：
/// - 验证输入数据合法性（Coordinator的职责）
/// - 管理配置和参数（构造时确定）
/// - 处理重试和错误恢复（Coordinator的职责）
/// - 收集监控数据（外部系统的职责）
/// - 管理生命周期（运行时的职责）
///
/// # Examples
///
/// ```rust
/// use anima_weave_core::actor::{NodeExecutor, NodeExecutionError};
/// use anima_weave_core::actor::node::{NodeInfo, PortDef};
/// use anima_weave_core::{NodeDataInputs, NodeControlInputs, NodeDataOutputs, NodeControlOutputs, PortRef, SignalLabel};
/// use std::collections::HashMap;
/// use async_trait::async_trait;
///
/// struct EchoNode;
///
/// #[async_trait]
/// impl NodeExecutor for EchoNode {
///     async fn execute(&self, data_inputs: NodeDataInputs, control_inputs: NodeControlInputs) -> Result<(NodeDataOutputs, NodeControlOutputs), NodeExecutionError> {
///         let input_port = PortRef::new("echo_node", "input");
///         let output_port = PortRef::new("echo_node", "output");
///         
///         let input_data = data_inputs.get(&input_port)
///             .ok_or_else(|| NodeExecutionError::input_error("input", "missing required input"))?;
///         
///         // 纯业务逻辑：简单的回显（创建新的SignalLabel）
///         let mut data_outputs: NodeDataOutputs = HashMap::new();
///         let control_outputs: NodeControlOutputs = HashMap::new();
///         data_outputs.insert(output_port, Box::new(SignalLabel::active()));
///         Ok((data_outputs, control_outputs))
///     }
///
///     fn get_node_info(&self) -> &NodeInfo {
///         use std::sync::OnceLock;
///         static NODE_INFO: OnceLock<NodeInfo> = OnceLock::new();
///         NODE_INFO.get_or_init(|| {
///             NodeInfo {
///                 node_type: "EchoNode",
///                 input_ports: vec![
///                     PortDef { name: "input", semantic_type: "SignalLabel", required: true },
///                 ],
///                 output_ports: vec![
///                     PortDef { name: "output", semantic_type: "SignalLabel", required: false },
///                 ],
///             }
///         })
///     }
/// }
/// ```
#[async_trait]
pub trait NodeExecutor: Send + Sync {
    /// 执行节点业务逻辑
    ///
    /// 这是NodeExecutor的唯一核心方法，实现 inputs → process → outputs 的转换。
    /// 该方法应该是无副作用的纯函数风格，给定相同输入总是产生相同输出。
    ///
    /// # 参数
    /// - `data_inputs`: 数据输入集合，端口名到数据的映射
    /// - `control_inputs`: 控制输入集合，端口名到信号的映射
    ///
    /// # 返回
    /// - `Ok(outputs)`: 执行成功，返回输出数据集合
    /// - `Err(NodeExecutionError)`: 执行失败，包含错误信息
    ///
    /// # 实现指导
    ///
    /// 1. **只做业务逻辑**：专注于数据转换，不要处理系统级关注点
    /// 2. **假设输入有效**：Coordinator会在调用前验证输入，所以可以安全地unwrap
    /// 3. **处理类型转换**：使用`try_convert_to()`进行SemanticLabel转换
    /// 4. **返回明确错误**：失败时返回有意义的错误信息
    ///
    /// # 错误处理
    ///
    /// 只处理业务逻辑相关的错误：
    /// - 类型转换失败
    /// - 计算溢出
    /// - 业务规则违反
    ///
    /// 不要处理系统级错误（网络、IO等），这些应该在构造时处理。
    async fn execute(
        &self,
        data_inputs: NodeDataInputs,
        control_inputs: NodeControlInputs,
    ) -> Result<(NodeDataOutputs, NodeControlOutputs), NodeExecutionError>;

    /// 获取节点元信息
    ///
    /// 返回节点的静态信息，用于图构建时的兼容性检查和文档生成。
    /// 这些信息在节点生命周期内不会改变。
    ///
    /// # 返回
    /// 节点的完整元信息，包括类型、输入输出端口定义等
    ///
    /// # 实现指导
    ///
    /// 1. **静态定义**：通常返回静态的NodeInfo实例
    /// 2. **准确描述**：端口定义必须与execute()方法的实际行为一致
    /// 3. **语义类型**：使用明确的SemanticLabel类型名称
    fn get_node_info(&self) -> &NodeInfo;
}

/// 节点元信息
///
/// 描述节点的静态特征，用于图构建和验证
#[derive(Debug, Clone, PartialEq)]
pub struct NodeInfo {
    /// 节点类型标识符
    ///
    /// 用于识别节点类型，如 "AddNode", "StringConcatNode" 等
    pub node_type: &'static str,

    /// 输入端口定义列表
    ///
    /// 描述节点期望的所有输入端口
    pub input_ports: Vec<PortDef>,

    /// 输出端口定义列表
    ///
    /// 描述节点会产生的所有输出端口
    pub output_ports: Vec<PortDef>,
}

/// 端口定义
///
/// 描述单个端口的特征
#[derive(Debug, Clone, PartialEq)]
pub struct PortDef {
    /// 端口名称
    pub name: &'static str,

    /// 语义类型名称
    ///
    /// 对应SemanticLabel的类型，如 "NumberLabel", "StringLabel" 等
    pub semantic_type: &'static str,

    /// 是否必需（仅对输入端口有意义）
    ///
    /// - `true`: 必需端口，执行前必须有数据
    /// - `false`: 可选端口，可以没有数据
    pub required: bool,
}

impl PortDef {
    /// 创建必需输入端口定义
    pub fn required(name: &'static str, semantic_type: &'static str) -> Self {
        Self {
            name,
            semantic_type,
            required: true,
        }
    }

    /// 创建可选输入端口定义
    pub fn optional(name: &'static str, semantic_type: &'static str) -> Self {
        Self {
            name,
            semantic_type,
            required: false,
        }
    }

    /// 创建输出端口定义
    ///
    /// 输出端口的required字段总是false，因为输出端口不存在"必需"概念
    pub fn output(name: &'static str, semantic_type: &'static str) -> Self {
        Self {
            name,
            semantic_type,
            required: false,
        }
    }
}

impl NodeInfo {
    /// 创建新的节点信息
    pub fn new(
        node_type: &'static str,
        input_ports: Vec<PortDef>,
        output_ports: Vec<PortDef>,
    ) -> Self {
        Self {
            node_type,
            input_ports,
            output_ports,
        }
    }

    /// 获取必需输入端口名称列表
    pub fn get_required_input_ports(&self) -> Vec<&str> {
        self.input_ports
            .iter()
            .filter(|port| port.required)
            .map(|port| port.name)
            .collect()
    }

    /// 获取可选输入端口名称列表
    pub fn get_optional_input_ports(&self) -> Vec<&str> {
        self.input_ports
            .iter()
            .filter(|port| !port.required)
            .map(|port| port.name)
            .collect()
    }

    /// 获取输出端口名称列表
    pub fn get_output_port_names(&self) -> Vec<&str> {
        self.output_ports.iter().map(|port| port.name).collect()
    }

    /// 检查输入端口是否存在
    pub fn has_input_port(&self, port_name: &str) -> bool {
        self.input_ports.iter().any(|port| port.name == port_name)
    }

    /// 检查输出端口是否存在
    pub fn has_output_port(&self, port_name: &str) -> bool {
        self.output_ports.iter().any(|port| port.name == port_name)
    }

    /// 获取端口的语义类型
    pub fn get_port_semantic_type(&self, port_name: &str) -> Option<&str> {
        self.input_ports
            .iter()
            .chain(self.output_ports.iter())
            .find(|port| port.name == port_name)
            .map(|port| port.semantic_type)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_port_def_creation() {
        let required_port = PortDef::required("input", "StringLabel");
        assert_eq!(required_port.name, "input");
        assert_eq!(required_port.semantic_type, "StringLabel");
        assert!(required_port.required);

        let optional_port = PortDef::optional("config", "NumberLabel");
        assert!(!optional_port.required);

        let output_port = PortDef::output("result", "StringLabel");
        assert!(!output_port.required);
    }

    #[test]
    fn test_node_info_queries() {
        let node_info = NodeInfo::new(
            "TestNode",
            vec![
                PortDef::required("required_input", "StringLabel"),
                PortDef::optional("optional_input", "NumberLabel"),
            ],
            vec![PortDef::output("output", "StringLabel")],
        );

        assert_eq!(node_info.get_required_input_ports(), vec!["required_input"]);
        assert_eq!(node_info.get_optional_input_ports(), vec!["optional_input"]);
        assert_eq!(node_info.get_output_port_names(), vec!["output"]);

        assert!(node_info.has_input_port("required_input"));
        assert!(node_info.has_output_port("output"));
        assert!(!node_info.has_input_port("nonexistent"));

        assert_eq!(
            node_info.get_port_semantic_type("required_input"),
            Some("StringLabel")
        );
        assert_eq!(node_info.get_port_semantic_type("nonexistent"), None);
    }
}
