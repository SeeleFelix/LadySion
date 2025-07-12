use super::status_tracker::{NodeStatusEvent, SimpleStatusTracker};
use anima_weave_core::{Node, NodeName};
use kameo::Actor;
use kameo::Reply;
use kameo::actor::{ActorRef, WeakActorRef};
use kameo::error::ActorStopReason;
use kameo::message::{Context, Message};
use std::collections::HashMap;
use std::time::{Duration, SystemTime};
use uuid::Uuid;

use anima_weave_core::{
    NodeDataInputs as NodeData, NodeDataOutputs, PortName, PortRef, SemanticLabel,
};

// 简化版的ExecutionId定义
pub type ExecutionId = String;

// 数据类型定义：PortRef -> Box<dyn SemanticLabel>
// 已用别名 NodeDataInputs 在 core::types 中导出，此处仅备注

/// 简化版NodeActor - 只关注数据驱动的执行
/// 移除了控制端口、复杂的激活模式等逻辑
pub struct SimpleNodeActor {
    /// 节点名称
    node_name: NodeName,

    /// 节点实现
    node_impl: Box<dyn Node>,

    /// 数据缓存 - 简化版，只存储数据输入
    pending_inputs: NodeData,

    /// 必需的数据端口名称列表
    connected_input_ports: Vec<PortRef>,

    /// 下游连接映射：输出端口名 -> 下游节点列表
    downstream_connections: HashMap<PortName, Vec<(ActorRef<SimpleNodeActor>, PortRef)>>,

    /// 状态追踪器引用 (可选)
    status_tracker: Option<ActorRef<SimpleStatusTracker>>,

    /// 当前是否正在执行
    is_executing: bool,

    /// 简单的执行统计
    execution_count: u64,
    success_count: u64,
    failure_count: u64,
}

impl SimpleNodeActor {
    pub fn new(
        node_name: NodeName,
        node_impl: Box<dyn Node>,
        connected_input_ports: Vec<PortRef>,
        downstream_connections: HashMap<PortName, Vec<(ActorRef<SimpleNodeActor>, PortRef)>>,
    ) -> Self {
        Self {
            node_name,
            node_impl,
            pending_inputs: HashMap::new(),
            connected_input_ports,
            downstream_connections,
            status_tracker: None,
            is_executing: false,
            execution_count: 0,
            success_count: 0,
            failure_count: 0,
        }
    }

    /// 设置状态追踪器
    pub fn with_status_tracker(mut self, tracker: ActorRef<SimpleStatusTracker>) -> Self {
        self.status_tracker = Some(tracker);
        self
    }

    /// 检查是否可以执行
    fn can_execute(&self) -> bool {
        // 1. 不能在执行中再次执行
        if self.is_executing {
            return false;
        }

        // 2. 检查所有必需的数据端口是否都有数据
        for port in &self.connected_input_ports {
            if !self.pending_inputs.contains_key(port) {
                return false;
            }
        }

        true
    }

    /// 执行节点逻辑
    async fn execute(&mut self) {
        if !self.can_execute() {
            return;
        }

        // 生成执行ID
        let execution_id = Uuid::new_v4().to_string();
        let start_time = SystemTime::now();

        // 标记开始执行
        self.is_executing = true;
        self.execution_count += 1;

        // 向状态追踪器汇报执行开始
        if let Some(ref tracker) = self.status_tracker {
            let start_event = NodeStatusEvent::ExecutionStarted {
                node_name: self.node_name.clone(),
                execution_id: execution_id.clone(),
            };
            let _ = tracker.tell(start_event).await;
        }

        // 收集所有输入数据并清空缓存
        let inputs: NodeData = self.pending_inputs.drain().collect();

        // 执行节点逻辑
        let duration: Duration = start_time.elapsed().unwrap_or(Duration::from_millis(0));
        match self.node_impl.execute(inputs) {
            Ok(outputs) => {
                self.success_count += 1;

                log::info!(
                    "Node {} executed successfully, execution #{}, outputs: {}",
                    self.node_name,
                    self.execution_count,
                    outputs.len()
                );

                // 向状态追踪器汇报执行成功
                if let Some(ref tracker) = self.status_tracker {
                    let complete_event = NodeStatusEvent::ExecutionCompleted {
                        node_name: self.node_name.clone(),
                        execution_id: execution_id.clone(),
                        duration,
                    };
                    let _ = tracker.tell(complete_event).await;
                }

                // 将输出发送给下游节点
                self.send_outputs_to_downstream(outputs, execution_id).await;
            }
            Err(error) => {
                self.failure_count += 1;

                log::error!(
                    "Node {} execution failed, execution #{}: {}",
                    self.node_name,
                    self.execution_count,
                    error
                );

                // 向状态追踪器汇报执行失败
                if let Some(ref tracker) = self.status_tracker {
                    let fail_event = NodeStatusEvent::ExecutionFailed {
                        node_name: self.node_name.clone(),
                        execution_id: execution_id.clone(),
                        error: error.to_string(),
                        duration,
                    };
                    let _ = tracker.tell(fail_event).await;
                }
            }
        }

        // 标记执行结束
        self.is_executing = false;
    }

    /// 将输出发送给下游节点
    async fn send_outputs_to_downstream(
        &self,
        outputs: NodeDataOutputs,
        execution_id: ExecutionId,
    ) {
        for (output_port, data) in outputs {
            if let Some(downstream_list) = self.downstream_connections.get(&output_port.port_name) {
                for (downstream_actor, input_port) in downstream_list {
                    let message = DataInputMessage {
                        from_port: output_port.clone(),
                        to_port: input_port.clone(),
                        data: data.as_ref().clone_box(),
                        execution_id: execution_id.clone(),
                    };
                    let _ = downstream_actor.tell(message).await;
                }
            }
        }
    }

    /// 配置下游连接
    pub fn set_downstream_connections(
        &mut self,
        connections: HashMap<PortName, Vec<(ActorRef<SimpleNodeActor>, PortRef)>>,
    ) {
        self.downstream_connections = connections;
    }

    /// 获取执行统计
    pub fn get_execution_stats(&self) -> (u64, u64, u64) {
        (self.execution_count, self.success_count, self.failure_count)
    }
}

impl Actor for SimpleNodeActor {
    type Args = Self;
    type Error = String;

    async fn on_start(actor: Self::Args, _actor_ref: ActorRef<Self>) -> Result<Self, Self::Error> {
        log::info!("Starting SimpleNodeActor: {}", actor.node_name);
        Ok(actor)
    }

    async fn on_stop(
        &mut self,
        _actor_ref: WeakActorRef<Self>,
        _reason: ActorStopReason,
    ) -> Result<(), Self::Error> {
        log::info!("Stopping SimpleNodeActor: {}", self.node_name);
        Ok(())
    }
}

/// 数据输入消息 - 简化版，只传递数据
#[derive(Debug)]
pub struct DataInputMessage {
    pub from_port: PortRef,
    pub to_port: PortRef,
    pub data: Box<dyn SemanticLabel>,
    pub execution_id: ExecutionId,
}

impl Message<DataInputMessage> for SimpleNodeActor {
    type Reply = Result<(), String>;

    async fn handle(
        &mut self,
        message: DataInputMessage,
        _ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        // 存储输入数据
        self.pending_inputs.insert(message.to_port, message.data);

        // 检查是否可以执行
        if self.can_execute() {
            self.execute().await;
        }

        Ok(())
    }
}

impl Clone for DataInputMessage {
    fn clone(&self) -> Self {
        Self {
            from_port: self.from_port.clone(),
            to_port: self.to_port.clone(),
            data: self.data.clone_box(),
            execution_id: self.execution_id.clone(),
        }
    }
}

/// 触发执行的消息 - 用于没有输入端口的节点
#[derive(Debug)]
pub struct TriggerExecutionMessage {
    pub execution_id: ExecutionId,
}

/// 获取节点状态查询
#[derive(Debug)]
/// 设置下游连接的消息
pub struct SetDownstreamConnectionsMessage {
    pub connections: HashMap<PortName, Vec<(ActorRef<SimpleNodeActor>, PortRef)>>,
}

impl Message<SetDownstreamConnectionsMessage> for SimpleNodeActor {
    type Reply = Result<(), String>;

    async fn handle(
        &mut self,
        message: SetDownstreamConnectionsMessage,
        _ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        self.set_downstream_connections(message.connections);
        Ok(())
    }
}

pub struct GetNodeStatusQuery;

#[derive(Debug, Clone, Reply)]
pub struct NodeStatus {
    pub node_name: NodeName,
    pub is_executing: bool,
    pub pending_input_count: usize,
    pub required_port_count: usize,
    pub downstream_connection_count: usize,
    pub execution_count: u64,
    pub success_count: u64,
    pub failure_count: u64,
}

impl Message<TriggerExecutionMessage> for SimpleNodeActor {
    type Reply = Result<(), String>;

    async fn handle(
        &mut self,
        _message: TriggerExecutionMessage,
        _ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        log::info!(
            "TriggerExecutionMessage received for node: {}",
            self.node_name
        );
        // 对于没有输入端口的节点，直接执行
        if self.connected_input_ports.is_empty() {
            log::info!(
                "Node {} has no input ports, executing directly",
                self.node_name
            );
            self.execute().await;
        } else {
            log::warn!(
                "Node {} has input ports, cannot trigger directly",
                self.node_name
            );
        }
        Ok(())
    }
}

impl Message<GetNodeStatusQuery> for SimpleNodeActor {
    type Reply = NodeStatus;

    async fn handle(
        &mut self,
        _query: GetNodeStatusQuery,
        _ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        NodeStatus {
            node_name: self.node_name.clone(),
            is_executing: self.is_executing,
            pending_input_count: self.pending_inputs.len(),
            required_port_count: self.connected_input_ports.len(),
            downstream_connection_count: self.downstream_connections.len(),
            execution_count: self.execution_count,
            success_count: self.success_count,
            failure_count: self.failure_count,
        }
    }
}
