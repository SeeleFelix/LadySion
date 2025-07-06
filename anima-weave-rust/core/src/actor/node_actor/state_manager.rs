use crate::actor::status_collector::StatusCollector;
use crate::event::NodeStatusEvent;
use crate::types::{ExecutionId, NodeName};
use kameo::actor::ActorRef;
use std::time::SystemTime;
use uuid::Uuid;

use super::types::NodeState;

/// 状态管理组件 - 负责节点状态和StatusCollector通信
#[derive(Debug)]
pub struct StateManager {
    node_name: NodeName,
    pub current_state: NodeState,
    pub current_execution_id: Option<ExecutionId>,
    status_collector: ActorRef<StatusCollector>,
    last_execution_start: Option<SystemTime>,
}

impl StateManager {
    pub fn new(node_name: NodeName, status_collector: ActorRef<StatusCollector>) -> Self {
        Self {
            node_name,
            current_state: NodeState::Idle,
            current_execution_id: None,
            status_collector,
            last_execution_start: None,
        }
    }

    /// 开始执行
    pub async fn start_execution(&mut self, input_count: usize) -> ExecutionId {
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
                input_count,
            })
            .await;

        execution_id
    }

    /// 完成执行
    pub async fn complete_execution(&mut self, execution_id: ExecutionId, output_count: usize) {
        let duration = self
            .last_execution_start
            .and_then(|start| SystemTime::now().duration_since(start).ok())
            .unwrap_or_default();

        // 更新状态
        self.current_execution_id = None;
        self.current_state = NodeState::Completed;

        // 发送完成事件
        let _ = self
            .status_collector
            .tell(NodeStatusEvent::ExecutionCompleted {
                node_name: self.node_name.clone(),
                execution_id,
                output_count,
                duration,
            })
            .await;
    }

    /// 执行失败
    pub async fn fail_execution(&mut self, execution_id: ExecutionId, error: String) {
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

    /// 检查是否正在执行
    pub fn is_executing(&self) -> bool {
        self.current_execution_id.is_some()
    }
} 