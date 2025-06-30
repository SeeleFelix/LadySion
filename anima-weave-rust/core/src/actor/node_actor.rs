//! NodeActor - 将NodeExecutor包装为Kameo Actor
//!
//! 使用Kameo 0.17 API实现，通过Recipient解耦，并恢复事件发送逻辑

use crate::actor::NodeExecutor;
use crate::event::{NodeExecuteEvent, NodeExecutionEvent, NodeOutputEvent, NodeStatus};
use crate::error_handling::{AnimaWeaveError, BusinessError, CommunicationError, ContextualError, ErrorContext};
use kameo::prelude::*;
use kameo::error::Infallible;
use std::sync::Arc;
use crate::actor::registry::NodeRegistry;

/// NodeActor - 将NodeExecutor包装为Kameo Actor
pub struct NodeActor {
    /// 节点名称
    node_name: String,
    /// 节点执行器
    executor: Arc<dyn NodeExecutor>,
    /// DataBus Recipient
    databus: Recipient<NodeOutputEvent>,
    /// Coordinator Recipient
    coordinator: Recipient<NodeExecutionEvent>,
}

/// 手动实现Actor trait，以便在启动时注入依赖
impl Actor for NodeActor {
    type Args = (
        String,
        Arc<dyn NodeExecutor>,
        Recipient<NodeOutputEvent>,
        Recipient<NodeExecutionEvent>,
    );
    type Error = Infallible;

    async fn on_start(
        args: Self::Args,
        _actor_ref: ActorRef<Self>,
    ) -> Result<Self, Self::Error> {
        let (node_name, executor, databus, coordinator) = args;
        Ok(Self {
            node_name,
            executor,
            databus,
            coordinator,
        })
    }
}

/// NodeExecuteEvent的消息处理，包含完整的事件发送和错误处理
impl Message<NodeExecuteEvent> for NodeActor {
    type Reply = Result<(), ContextualError>;

    async fn handle(
        &mut self, 
        msg: NodeExecuteEvent, 
        _ctx: &mut Context<Self, Self::Reply>
    ) -> Self::Reply {
        let context = ErrorContext::new("节点执行")
            .with_node(&self.node_name)
            .with_execution(&msg.node_execute_id);

        // 1. 发送 'Running' 状态事件
        let start_event = NodeExecutionEvent::new(
            self.node_name.clone(),
            msg.node_execute_id.clone(),
            NodeStatus::Running,
        );
        self.coordinator.tell(start_event).await
            .map_err(|err| self.create_send_error(err, "Coordinator", "Running", &context))?;

        // 2. 执行业务逻辑
        match self.executor.execute(msg.data_inputs, msg.control_inputs).await {
            Ok((data_outputs, control_outputs)) => {
                // 3a. 发送输出事件
                let output_event = NodeOutputEvent::new(
                    self.node_name.clone(),
                    msg.node_execute_id.clone(),
                    data_outputs,
                    control_outputs,
                );
                self.databus.tell(output_event).await
                    .map_err(|err| self.create_send_error(err, "DataBus", "Output", &context))?;

                // 4a. 发送 'Completed' 状态事件
                let complete_event = NodeExecutionEvent::new(
                    self.node_name.clone(),
                    msg.node_execute_id,
                    NodeStatus::Completed,
                );
                self.coordinator.tell(complete_event).await
                    .map_err(|err| self.create_send_error(err, "Coordinator", "Completed", &context))?;
                
                Ok(())
            }
            Err(node_error) => {
                // 3b. 发送 'Failed' 状态事件
                let reason = format!("节点执行失败: {:?}", node_error);
                let error_event = NodeExecutionEvent::new(
                    self.node_name.clone(),
                    msg.node_execute_id,
                    NodeStatus::Failed(reason.clone()),
                );
                // 尝试发送失败状态，但不覆盖原始错误
                let _ = self.coordinator.tell(error_event).await;

                Err(ContextualError::new(
                    AnimaWeaveError::Business(BusinessError::ExecutionLogic {
                        node_name: self.node_name.clone(),
                        reason,
                    }),
                    context,
                ))
            }
        }
    }
}

impl NodeActor {
    /// 辅助函数，用于创建统一的发送错误
    fn create_send_error<M>(
        &self, 
        _err: SendError<M>, 
        target_actor: &str, 
        event_type: &str, 
        context: &ErrorContext
    ) -> ContextualError {
        ContextualError::new(
            AnimaWeaveError::Communication(CommunicationError::MessageSendFailure {
                target_actor: target_actor.to_string(),
                reason: format!("无法发送 {} 事件", event_type),
            }),
            context.clone(),
        )
    }

    /// 启动NodeActor并注册到Registry，若重名panic
    pub fn spawn_and_register(
        node_name: String,
        executor: Arc<dyn NodeExecutor>,
        databus: Recipient<NodeOutputEvent>,
        coordinator: Recipient<NodeExecutionEvent>,
        registry: Arc<NodeRegistry>,
    ) -> ActorRef<Self> {
        let actor_ref = Self::spawn((
            node_name.clone(),
            executor,
            databus,
            coordinator,
        ));
        // 注册到Registry，若重名panic
        registry.register(node_name, actor_ref.clone().recipient::<NodeExecuteEvent>())
            .expect("Node name already registered in registry");
        actor_ref
    }
} 