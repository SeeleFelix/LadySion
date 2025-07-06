use crate::actor::status_collector::StatusCollector;
use crate::event::{ControlMessage, DataMessage};
use crate::graph::ActivationMode;
use crate::types::{NodeName, PortRef};
use crate::Node;
use kameo::actor::{ActorRef, WeakActorRef};
use kameo::error::ActorStopReason;
use kameo::message::{Context, Message};
use kameo::Actor;

use std::collections::HashMap;

use super::input_buffer::InputBuffer;
use super::state_manager::StateManager;
use super::message_router::MessageRouter;


/// 分布式NodeActor - 完全自主的执行单元
/// 每个Actor维护自己的状态和数据，直接与其他NodeActor通信
pub struct NodeActor {
    /// 数据缓存组件
    input_buffer: InputBuffer,
    
    /// 节点实现 - 直接持有，不需要包装
    node_implementation: Box<dyn Node>,
    
    /// 状态管理组件
    state_manager: StateManager,
    
    /// 消息路由组件
    message_router: MessageRouter,
    
    /// 节点配置
    required_data_ports: Vec<PortRef>,
    required_control_ports: Vec<PortRef>,
    control_activation_modes: HashMap<PortRef, ActivationMode>,
}

impl NodeActor {
    pub fn new(
        node_name: NodeName,
        node_implementation: Box<dyn Node>,
        status_collector: ActorRef<StatusCollector>,
        port_mappings: HashMap<PortRef, Vec<(ActorRef<Self>, PortRef)>>,
        control_modes: HashMap<PortRef, ActivationMode>,
        required_data_ports: Vec<PortRef>,
        required_control_ports: Vec<PortRef>,
    ) -> Self {
        Self {
            input_buffer: InputBuffer::new(),
            node_implementation,
            state_manager: StateManager::new(node_name.clone(), status_collector),
            message_router: MessageRouter::new(node_name, port_mappings),
            required_data_ports,
            required_control_ports,
            control_activation_modes: control_modes,
        }
    }

    /// 简化的构造函数，用于测试
    pub fn new_simple(
        node_name: NodeName,
        node_implementation: Box<dyn Node>,
        status_collector: ActorRef<StatusCollector>,
    ) -> Self {
        Self {
            input_buffer: InputBuffer::new(),
            node_implementation,
            state_manager: StateManager::new(node_name.clone(), status_collector),
            message_router: MessageRouter::new(node_name, HashMap::new()),
            required_data_ports: vec![],
            required_control_ports: vec![],
            control_activation_modes: HashMap::new(),
        }
    }

    /// 检查是否可以执行
    fn can_execute(&self) -> bool {
        // 1. 检查执行状态 - 不能在执行时再执行
        if self.state_manager.is_executing() {
            return false;
        }

        // 2. 检查数据端口是否准备好
        if !self.input_buffer.has_required_data(&self.required_data_ports) {
            return false;
        }

        // 3. 检查控制端口是否激活
        for port in &self.required_control_ports {
            if !self.is_control_port_activated(port) {
                return false;
            }
        }

        true
    }

    /// 检查控制端口是否激活
    fn is_control_port_activated(&self, port: &PortRef) -> bool {
        match self.control_activation_modes.get(port) {
            Some(ActivationMode::Xor) => self.input_buffer.has_control_input(port),
            Some(ActivationMode::Or) => self.input_buffer.has_control_input(port),
            Some(ActivationMode::And) => self.input_buffer.has_control_input(port),
            None => true, // 没有激活模式要求，默认激活
        }
    }

    /// 执行节点
    async fn execute(&mut self) {
        if !self.can_execute() {
            return;
        }

        // 获取所有可用输入数据
        let available_inputs = self.input_buffer.get_all_available_inputs();
        let execution_id = self.state_manager.start_execution(available_inputs.len()).await;
        
        // 直接执行节点逻辑
        match self.node_implementation.execute(&available_inputs) {
            Ok(outputs) => {
                // 转换输出格式并路由
                let mut organized_outputs = HashMap::new();
                for (port, data) in outputs.into_iter() {
                    organized_outputs.insert(port, vec![data]);
                }
                
                let total_outputs = organized_outputs.values().map(|v| v.len()).sum();
                self.state_manager.complete_execution(execution_id.clone(), total_outputs).await;
                self.message_router.route_outputs(organized_outputs, execution_id).await;
            }
            Err(error) => {
                self.state_manager.fail_execution(execution_id, error.to_string()).await;
            }
        }
    }
}

impl Actor for NodeActor {
    type Args = Self;
    type Error = String;

    async fn on_start(actor: Self::Args, _actor_ref: ActorRef<Self>) -> Result<Self, Self::Error> {
        log::info!("Starting DistributedNodeActor: {}", actor.state_manager.get_name());
        Ok(actor)
    }

    async fn on_stop(
        &mut self,
        _actor_ref: WeakActorRef<Self>,
        _reason: ActorStopReason,
    ) -> Result<(), Self::Error> {
        log::info!("Stopping DistributedNodeActor: {}", self.state_manager.get_name());
        Ok(())
    }
}

impl Message<DataMessage> for NodeActor {
    type Reply = Result<(), String>;

    async fn handle(
        &mut self,
        message: DataMessage,
        _ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        // 存储数据
        self.input_buffer.store_data(message.to_port, message.data);

        // 检查是否可以开始执行
        if self.can_execute() {
            self.execute().await;
        }

        Ok(())
    }
}

impl Message<ControlMessage> for NodeActor {
    type Reply = Result<(), String>;

    async fn handle(
        &mut self,
        message: ControlMessage,
        _ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        // 存储控制信号
        self.input_buffer.store_control(message.to_port, message.signal);

        // 检查是否可以开始执行
        if self.can_execute() {
            self.execute().await;
        }

        Ok(())
    }
}

// 消息类型定义
#[derive(Debug, Clone)]
pub struct NodeInfo {
    pub name: String,
    pub state: super::NodeState,
    pub pending_data_count: usize,
    pub pending_control_count: usize,
}



#[derive(Debug, Clone)]
pub struct GetNodeInfoQuery;

#[derive(Debug, Clone)]
pub struct GetNodeStateQuery;

#[derive(Debug, Clone)]
pub struct ConfigureActivationMessage {
    pub required_data_ports: Vec<PortRef>,
    pub required_control_ports: Vec<PortRef>,
}

#[derive(Debug, Clone)]
pub struct ConfigureConnectionsMessage {
    pub port_mappings: HashMap<PortRef, Vec<(ActorRef<NodeActor>, PortRef)>>,
}

impl Message<GetNodeInfoQuery> for NodeActor {
    type Reply = String;

    async fn handle(
        &mut self,
        _message: GetNodeInfoQuery,
        _ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        let (data_count, control_count) = self.input_buffer.get_pending_count();
        format!(
            "NodeInfo {{ name: {}, state: {:?}, pending_data: {}, pending_control: {} }}",
            self.state_manager.get_name(),
            self.state_manager.get_state(),
            data_count,
            control_count
        )
    }
}

impl Message<GetNodeStateQuery> for NodeActor {
    type Reply = String;

    async fn handle(
        &mut self,
        _message: GetNodeStateQuery,
        _ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        format!("{:?}", self.state_manager.get_state())
    }
}

impl Message<ConfigureActivationMessage> for NodeActor {
    type Reply = Result<(), String>;

    async fn handle(
        &mut self,
        message: ConfigureActivationMessage,
        _ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        self.required_data_ports = message.required_data_ports;
        self.required_control_ports = message.required_control_ports;
        Ok(())
    }
}

impl Message<ConfigureConnectionsMessage> for NodeActor {
    type Reply = Result<(), String>;

    async fn handle(
        &mut self,
        message: ConfigureConnectionsMessage,
        _ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        self.message_router.update_port_mappings(message.port_mappings);
        Ok(())
    }
}

// TODO: 添加测试代码
