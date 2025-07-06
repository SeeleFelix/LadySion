use crate::actor::status_collector::StatusCollector;
use crate::actor::types::*;
use crate::label::SemanticLabel;
use crate::signal::SignalLabel;
use crate::types::{ExecutionId, NodeName, PortRef};
use crate::Node;
use kameo::actor::{ActorRef, WeakActorRef};
use kameo::error::ActorStopReason;
use kameo::message::{Context, Message};
use kameo::Actor;
use kameo::Reply;
use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, SystemTime};
use uuid::Uuid;

/// 分布式NodeActor - 完全自主的执行单元
/// 每个Actor维护自己的状态和数据，直接与其他NodeActor通信
pub struct DistributedNodeActor {
    /// 节点身份
    node_name: NodeName,
    node_implementation: Box<dyn Node>,

    /// 分布式状态管理
    pending_data_inputs: HashMap<PortRef, Arc<dyn SemanticLabel>>,
    pending_control_inputs: HashMap<PortRef, SignalLabel>,

    /// 直接连接的下游Actor
    downstream_data_connections: HashMap<PortRef, Vec<ActorRef<Self>>>,
    downstream_control_connections: HashMap<PortRef, Vec<ActorRef<Self>>>,

    /// 端口连接映射 (从端口到下游端口)
    port_mappings: HashMap<PortRef, Vec<(ActorRef<Self>, PortRef)>>,

    /// 激活控制
    control_activation_modes: HashMap<PortRef, ActivationMode>,
    required_data_ports: Vec<PortRef>,
    required_control_ports: Vec<PortRef>,

    /// 当前执行状态
    current_execution_id: Option<ExecutionId>,
    current_state: NodeState,

    /// StatusCollector引用
    status_collector: ActorRef<StatusCollector>,

    /// 性能统计
    last_execution_start: Option<SystemTime>,
    message_processing_times: Vec<Duration>,
}

impl DistributedNodeActor {
    pub fn new(
        node_name: NodeName,
        node_implementation: Box<dyn Node>,
        status_collector: ActorRef<StatusCollector>,
    ) -> Self {
        Self {
            node_name,
            node_implementation,
            pending_data_inputs: HashMap::new(),
            pending_control_inputs: HashMap::new(),
            downstream_data_connections: HashMap::new(),
            downstream_control_connections: HashMap::new(),
            port_mappings: HashMap::new(),
            control_activation_modes: HashMap::new(),
            required_data_ports: Vec::new(),
            required_control_ports: Vec::new(),
            current_execution_id: None,
            current_state: NodeState::Idle,
            status_collector,
            last_execution_start: None,
            message_processing_times: Vec::new(),
        }
    }

    /// 配置节点的连接关系
    pub fn configure_connections(
        &mut self,
        data_connections: HashMap<PortRef, Vec<ActorRef<Self>>>,
        control_connections: HashMap<PortRef, Vec<ActorRef<Self>>>,
        port_mappings: HashMap<PortRef, Vec<(ActorRef<Self>, PortRef)>>,
    ) {
        self.downstream_data_connections = data_connections;
        self.downstream_control_connections = control_connections;
        self.port_mappings = port_mappings;
    }

    /// 配置激活模式
    pub fn configure_activation(
        &mut self,
        control_modes: HashMap<PortRef, ActivationMode>,
        required_data_ports: Vec<PortRef>,
        required_control_ports: Vec<PortRef>,
    ) {
        self.control_activation_modes = control_modes;
        self.required_data_ports = required_data_ports;
        self.required_control_ports = required_control_ports;
    }

    /// 检查是否可以开始执行
    fn can_execute(&self) -> bool {
        // 1. 检查所有必需的数据端口是否有数据
        for port in &self.required_data_ports {
            if !self.pending_data_inputs.contains_key(port) {
                return false;
            }
        }

        // 2. 检查所有必需的控制端口是否满足激活条件
        for port in &self.required_control_ports {
            if !self.is_control_port_activated(port) {
                return false;
            }
        }

        // 3. 检查当前没有正在执行的任务
        self.current_execution_id.is_none()
    }

    /// 检查控制端口是否激活
    fn is_control_port_activated(&self, port: &PortRef) -> bool {
        match self.control_activation_modes.get(port) {
            Some(ActivationMode::XOR) => {
                // 任意一个输入激活
                self.pending_control_inputs.contains_key(port)
            }
            Some(ActivationMode::OR) => {
                // 至少一个输入激活 (与XOR相同)
                self.pending_control_inputs.contains_key(port)
            }
            Some(ActivationMode::AND) => {
                // 所有预期的输入都激活
                // 这里需要额外的配置信息来知道应该有多少个输入
                // 简化实现：只要有输入就认为激活
                self.pending_control_inputs.contains_key(port)
            }
            None => {
                // 没有激活模式要求，认为总是激活
                true
            }
        }
    }

    /// 开始执行节点
    async fn start_execution(&mut self, ctx: &mut Context<Self, ()>) -> Result<(), String> {
        if !self.can_execute() {
            return Err("Node not ready for execution".to_string());
        }

        let execution_id = Uuid::new_v4().to_string();
        self.current_execution_id = Some(execution_id.clone());
        self.current_state = NodeState::Running;
        self.last_execution_start = Some(SystemTime::now());

        // 发送开始执行事件
        let _ = self
            .status_collector
            .tell(NodeStatusEvent::ExecutionStarted {
                node_name: self.node_name.clone(),
                execution_id: execution_id.clone(),
                input_count: self.pending_data_inputs.len() + self.pending_control_inputs.len(),
            })
            .await;

        // 执行节点逻辑
        match self.execute_node().await {
            Ok(outputs) => {
                self.handle_execution_success(execution_id, outputs, ctx)
                    .await;
            }
            Err(error) => {
                self.handle_execution_failure(execution_id, error, ctx)
                    .await;
            }
        }

        Ok(())
    }

    /// 直接执行节点（不需要Context）
    async fn direct_execution(&mut self) {
        if !self.can_execute() {
            return;
        }

        let execution_id = Uuid::new_v4().to_string();
        self.current_execution_id = Some(execution_id.clone());
        self.current_state = NodeState::Running;
        self.last_execution_start = Some(SystemTime::now());

        // 发送开始执行事件
        let _ = self
            .status_collector
            .tell(NodeStatusEvent::ExecutionStarted {
                node_name: self.node_name.clone(),
                execution_id: execution_id.clone(),
                input_count: self.pending_data_inputs.len() + self.pending_control_inputs.len(),
            })
            .await;

        // 执行节点逻辑
        match self.execute_node().await {
            Ok(outputs) => {
                self.handle_execution_success_direct(execution_id, outputs)
                    .await;
            }
            Err(error) => {
                self.handle_execution_failure_direct(execution_id, error)
                    .await;
            }
        }
    }

    /// 执行节点的具体逻辑
    async fn execute_node(
        &mut self,
    ) -> Result<HashMap<PortRef, Vec<Arc<dyn SemanticLabel>>>, String> {
        use crate::types::NodeDataInputs;

        // 准备输入数据 - 使用NodeDataInputs格式
        let mut inputs = NodeDataInputs::new();

        // 添加数据输入
        for port in &self.required_data_ports {
            if let Some(data) = self.pending_data_inputs.remove(port) {
                inputs.insert(port.clone(), data);
            }
        }

        // 添加控制信号
        for port in &self.required_control_ports {
            if let Some(signal) = self.pending_control_inputs.remove(port) {
                inputs.insert(port.clone(), Arc::new(signal));
            }
        }

        // 执行节点
        match self.node_implementation.execute(&inputs) {
            Ok(outputs) => {
                // 转换输出格式
                let mut organized_outputs = HashMap::new();
                for (port, data) in outputs.into_iter() {
                    organized_outputs.insert(port, vec![data]);
                }
                Ok(organized_outputs)
            }
            Err(error) => Err(error.to_string()),
        }
    }

    /// 处理执行成功
    async fn handle_execution_success(
        &mut self,
        execution_id: ExecutionId,
        outputs: HashMap<PortRef, Vec<Arc<dyn SemanticLabel>>>,
        ctx: &mut Context<Self, ()>,
    ) {
        let duration = self
            .last_execution_start
            .and_then(|start| SystemTime::now().duration_since(start).ok())
            .unwrap_or_default();

        let total_outputs = outputs.values().map(|v| v.len()).sum();

        // 发送输出数据到下游
        for (port, data_list) in outputs {
            self.send_data_to_downstream(port, data_list, execution_id.clone(), ctx)
                .await;
        }

        // 更新状态
        self.current_execution_id = None;
        self.current_state = NodeState::Completed;

        // 发送完成事件
        let _ = self
            .status_collector
            .tell(NodeStatusEvent::ExecutionCompleted {
                node_name: self.node_name.clone(),
                execution_id,
                output_count: total_outputs,
                duration,
            })
            .await;

        // 检查是否可以立即开始下一次执行
        if self.can_execute() {
            let _ = Box::pin(self.start_execution(ctx)).await;
        }
    }

    /// 处理执行成功（直接版本）
    async fn handle_execution_success_direct(
        &mut self,
        execution_id: ExecutionId,
        outputs: HashMap<PortRef, Vec<Arc<dyn SemanticLabel>>>,
    ) {
        let duration = self
            .last_execution_start
            .and_then(|start| SystemTime::now().duration_since(start).ok())
            .unwrap_or_default();

        let total_outputs = outputs.values().map(|v| v.len()).sum();

        // 发送输出数据到下游
        for (port, data_list) in outputs {
            self.send_data_to_downstream_direct(port, data_list, execution_id.clone())
                .await;
        }

        // 更新状态
        self.current_execution_id = None;
        self.current_state = NodeState::Completed;

        // 发送完成事件
        let _ = self
            .status_collector
            .tell(NodeStatusEvent::ExecutionCompleted {
                node_name: self.node_name.clone(),
                execution_id,
                output_count: total_outputs,
                duration,
            })
            .await;
    }

    /// 处理执行失败（直接版本）
    async fn handle_execution_failure_direct(&mut self, execution_id: ExecutionId, error: String) {
        let duration = self
            .last_execution_start
            .and_then(|start| SystemTime::now().duration_since(start).ok())
            .unwrap_or_default();

        // 更新状态
        self.current_execution_id = None;
        self.current_state = NodeState::Idle;

        // 发送失败事件
        let _ = self
            .status_collector
            .tell(NodeStatusEvent::ExecutionFailed {
                node_name: self.node_name.clone(),
                execution_id,
                error,
                duration,
            })
            .await;
    }

    /// 处理执行失败
    async fn handle_execution_failure(
        &mut self,
        execution_id: ExecutionId,
        error: String,
        _ctx: &mut Context<Self, ()>,
    ) {
        let duration = self
            .last_execution_start
            .and_then(|start| SystemTime::now().duration_since(start).ok())
            .unwrap_or_default();

        // 更新状态
        self.current_execution_id = None;
        self.current_state = NodeState::Idle;

        // 发送失败事件
        let _ = self
            .status_collector
            .tell(NodeStatusEvent::ExecutionFailed {
                node_name: self.node_name.clone(),
                execution_id,
                error,
                duration,
            })
            .await;
    }

    /// 发送数据到下游节点
    async fn send_data_to_downstream(
        &mut self,
        from_port: PortRef,
        data_list: Vec<Arc<dyn SemanticLabel>>,
        execution_id: ExecutionId,
        _ctx: &mut Context<Self, ()>,
    ) {
        if let Some(connections) = self.port_mappings.get(&from_port) {
            for (downstream_actor, to_port) in connections {
                for data in &data_list {
                    let message = DataMessage {
                        from_node: self.node_name.clone(),
                        from_port: from_port.clone(),
                        to_node: "unknown".to_string(), // 下游节点名称
                        to_port: to_port.clone(),
                        data: data.clone(),
                        execution_id: execution_id.clone(),
                    };

                    let _ = downstream_actor.tell(message).await;
                }
            }
        }
    }

    /// 发送数据到下游节点（直接版本，不需要Context）
    async fn send_data_to_downstream_direct(
        &mut self,
        from_port: PortRef,
        data_list: Vec<Arc<dyn SemanticLabel>>,
        execution_id: ExecutionId,
    ) {
        if let Some(connections) = self.port_mappings.get(&from_port) {
            for (downstream_actor, to_port) in connections {
                for data in &data_list {
                    let message = DataMessage {
                        from_node: self.node_name.clone(),
                        from_port: from_port.clone(),
                        to_node: "unknown".to_string(), // 下游节点名称
                        to_port: to_port.clone(),
                        data: data.clone(),
                        execution_id: execution_id.clone(),
                    };

                    let _ = downstream_actor.tell(message).await;
                }
            }
        }
    }

    /// 获取节点状态
    pub fn get_state(&self) -> NodeState {
        self.current_state.clone()
    }

    /// 获取节点名称
    pub fn get_name(&self) -> &NodeName {
        &self.node_name
    }

    /// 获取当前执行ID
    pub fn get_current_execution_id(&self) -> Option<&ExecutionId> {
        self.current_execution_id.as_ref()
    }
}

impl Actor for DistributedNodeActor {
    type Args = Self;
    type Error = String;

    async fn on_start(actor: Self::Args, _actor_ref: ActorRef<Self>) -> Result<Self, Self::Error> {
        log::info!("Starting DistributedNodeActor: {}", actor.node_name);
        Ok(actor)
    }

    async fn on_stop(
        &mut self,
        _actor_ref: WeakActorRef<Self>,
        _reason: ActorStopReason,
    ) -> Result<(), Self::Error> {
        log::info!("Stopping DistributedNodeActor: {}", self.node_name);
        Ok(())
    }
}

impl Message<DataMessage> for DistributedNodeActor {
    type Reply = Result<(), String>;

    async fn handle(
        &mut self,
        message: DataMessage,
        _ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        let start_time = SystemTime::now();

        // 存储数据
        self.pending_data_inputs
            .insert(message.to_port, message.data);

        // 记录处理时间
        if let Ok(processing_time) = SystemTime::now().duration_since(start_time) {
            self.message_processing_times.push(processing_time);
            let _ = self
                .status_collector
                .tell(NodeStatusEvent::MessageProcessed {
                    node_name: self.node_name.clone(),
                    message_type: MessageType::Data,
                    processing_time,
                })
                .await;
        }

        // 检查是否可以开始执行
        if self.can_execute() {
            // 直接在这里处理执行，避免Context类型复杂性
            self.direct_execution().await;
        }

        Ok(())
    }
}

impl Message<ControlMessage> for DistributedNodeActor {
    type Reply = Result<(), String>;

    async fn handle(
        &mut self,
        message: ControlMessage,
        _ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        let start_time = SystemTime::now();

        // 存储控制信号
        self.pending_control_inputs
            .insert(message.to_port, message.signal);

        // 记录处理时间
        if let Ok(processing_time) = SystemTime::now().duration_since(start_time) {
            self.message_processing_times.push(processing_time);
            let _ = self
                .status_collector
                .tell(NodeStatusEvent::MessageProcessed {
                    node_name: self.node_name.clone(),
                    message_type: MessageType::Control,
                    processing_time,
                })
                .await;
        }

        // 检查是否可以开始执行
        if self.can_execute() {
            // 直接执行，避免Context类型问题
            self.direct_execution().await;
        }

        Ok(())
    }
}

/// 节点状态查询消息
#[derive(Debug)]
pub struct GetNodeStateQuery;

#[derive(Debug)]
pub struct GetNodeInfoQuery;

/// 触发节点执行的内部消息
#[derive(Debug)]
pub struct TriggerExecutionMessage;

/// 配置节点连接的消息
#[derive(Debug)]
pub struct ConfigureConnectionsMessage {
    pub port_mappings: HashMap<PortRef, Vec<(ActorRef<DistributedNodeActor>, PortRef)>>,
}

/// 配置节点激活的消息
#[derive(Debug)]
pub struct ConfigureActivationMessage {
    pub required_data_ports: Vec<PortRef>,
    pub required_control_ports: Vec<PortRef>,
}

#[derive(Debug, Reply)]
pub struct NodeInfo {
    pub name: NodeName,
    pub state: NodeState,
    pub current_execution_id: Option<ExecutionId>,
    pub pending_data_count: usize,
    pub pending_control_count: usize,
    pub downstream_connections: usize,
}

impl Message<GetNodeStateQuery> for DistributedNodeActor {
    type Reply = NodeState;

    async fn handle(
        &mut self,
        _query: GetNodeStateQuery,
        _ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        self.get_state()
    }
}

impl Message<GetNodeInfoQuery> for DistributedNodeActor {
    type Reply = NodeInfo;

    async fn handle(
        &mut self,
        _query: GetNodeInfoQuery,
        _ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        NodeInfo {
            name: self.node_name.clone(),
            state: self.current_state.clone(),
            current_execution_id: self.current_execution_id.clone(),
            pending_data_count: self.pending_data_inputs.len(),
            pending_control_count: self.pending_control_inputs.len(),
            downstream_connections: self.port_mappings.len(),
        }
    }
}

impl Message<TriggerExecutionMessage> for DistributedNodeActor {
    type Reply = ();

    async fn handle(
        &mut self,
        _message: TriggerExecutionMessage,
        ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        // 再次检查是否可以执行（可能在消息传递过程中条件已改变）
        if self.can_execute() {
            if let Err(_error) = self.start_execution(ctx).await {
                // 执行失败，但我们已经在start_execution中处理了
            }
        }
    }
}

impl Message<ConfigureConnectionsMessage> for DistributedNodeActor {
    type Reply = Result<(), String>;

    async fn handle(
        &mut self,
        message: ConfigureConnectionsMessage,
        _ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        // 配置端口映射
        self.port_mappings = message.port_mappings;
        log::info!(
            "Configured {} port mappings for node {}",
            self.port_mappings.len(),
            self.node_name
        );
        Ok(())
    }
}

impl Message<ConfigureActivationMessage> for DistributedNodeActor {
    type Reply = Result<(), String>;

    async fn handle(
        &mut self,
        message: ConfigureActivationMessage,
        _ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        // 配置激活端口
        self.required_data_ports = message.required_data_ports;
        self.required_control_ports = message.required_control_ports;
        log::info!(
            "Configured {} data ports and {} control ports for node {}",
            self.required_data_ports.len(),
            self.required_control_ports.len(),
            self.node_name
        );
        Ok(())
    }
}

// TODO: 添加测试代码
