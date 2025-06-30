//! ExecutionTracker - 节点执行生命周期管理器
//!
//! 职责：
//! 1. 接收所有就绪的节点 (`NodeReadyEvent`)。
//! 2. 维护每个待处理、正在执行、已完成节点的全量状态。
//! 3. 实现严格的"队首阻塞"调度算法，决定下一个该执行哪个节点。
//! 4. 记录所有关键事件的时间戳，为最终的执行报告提供数据。

use crate::event::{NodeExecuteEvent, NodeReadyEvent};
use crate::types::{ExecutionId, NodeName};
use std::collections::{HashMap, HashSet, VecDeque};
use std::time::SystemTime;

/// 追踪每个独立执行实例的状态
#[derive(Debug, Clone, PartialEq)]
pub enum ExecutionStatus {
    Queued,
    Running,
    Completed { success: bool },
}

/// 包含一次完整执行生命周期的所有信息
#[derive(Debug, Clone)]
pub struct NodeExecutionRecord {
    pub execution_id: ExecutionId,
    pub node_name: NodeName,
    pub status: ExecutionStatus,
    pub is_sequential: bool,

    // 事件与时间戳
    pub original_event: NodeReadyEvent,
    pub ready_at: SystemTime,
    pub dispatched_at: Option<SystemTime>,
    pub completed_at: Option<SystemTime>,
}

/// 核心的 ExecutionTracker 结构
#[derive(Debug, Default, Clone)]
pub struct ExecutionTracker {
    /// 所有执行记录的存储，以 ExecutionId 为主键
    records: HashMap<ExecutionId, NodeExecutionRecord>,

    /// 等待调度的 ExecutionId 队列，严格保证 FIFO
    pending_ids: VecDeque<ExecutionId>,

    /// 正在运行的节点集合，用于并发检查
    running_nodes: HashSet<NodeName>,

    /// 当前是否有"顺序"节点正在执行
    is_sequential_running: bool,
}

impl ExecutionTracker {
    /// 创建一个新的 ExecutionTracker
    pub fn new() -> Self {
        Self::default()
    }

    /// 注册一个新的就绪事件
    pub fn register_ready(&mut self, event: NodeReadyEvent, is_sequential: bool) -> ExecutionId {
        let execution_id = event.meta.event_id.clone();
        let node_name = event.target_node_name.clone();

        let record = NodeExecutionRecord {
            execution_id: execution_id.clone(),
            node_name,
            status: ExecutionStatus::Queued,
            is_sequential,
            original_event: event,
            ready_at: SystemTime::now(),
            dispatched_at: None,
            completed_at: None,
        };

        self.records.insert(execution_id.clone(), record);
        self.pending_ids.push_back(execution_id.clone());

        execution_id
    }

    /// 尝试调度下一个节点（严格队首阻塞）
    pub fn try_dispatch_next(&mut self) -> Option<NodeExecuteEvent> {
        // 1. 检查全局锁
        if self.is_sequential_running {
            return None;
        }

        // 2. 检查队列头部
        let Some(execution_id) = self.pending_ids.front() else {
            return None;
        };

        let record = self.records.get(execution_id).unwrap();

        // 3. 应用并发规则
        if record.is_sequential {
            // 串行节点只有在完全空闲时才能执行
            if !self.running_nodes.is_empty() {
                return None; // 阻塞
            }
        } else {
            // 普通节点检查同名冲突
            if self.running_nodes.contains(&record.node_name) {
                return None; // 阻塞
            }
        }

        // 4. 派发队首节点
        let execution_id = self.pending_ids.pop_front().unwrap();
        let record = self.records.get_mut(&execution_id).unwrap();

        record.status = ExecutionStatus::Running;
        record.dispatched_at = Some(SystemTime::now());

        self.running_nodes.insert(record.node_name.clone());
        if record.is_sequential {
            self.is_sequential_running = true;
        }

        let event = record.original_event.clone();
        Some(NodeExecuteEvent::new(
            event.target_node_name,
            record.execution_id.clone(),
            event.data_inputs,
            event.control_inputs,
        ))
    }

    /// 标记一个执行为完成
    pub fn mark_as_completed(
        &mut self,
        execution_id: &ExecutionId,
        success: bool
    ) {
        if let Some(record) = self.records.get_mut(execution_id) {
            record.status = ExecutionStatus::Completed { success };
            record.completed_at = Some(SystemTime::now());
            self.running_nodes.remove(&record.node_name);
            if record.is_sequential {
                self.is_sequential_running = false;
            }
        }
    }

    /// 获取当前正在运行的节点数量（用于测试和状态报告）
    pub fn running_nodes_count(&self) -> usize {
        self.running_nodes.len()
    }

    /// 检查特定节点是否正在运行（用于测试）
    #[cfg(test)]
    pub(crate) fn is_node_running(&self, node_name: &NodeName) -> bool {
        self.running_nodes.contains(node_name)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{NodeControlInputs, NodeDataInputs};

    // 辅助函数：创建测试用 NodeReadyEvent
    fn create_ready_event(node_name: &str) -> NodeReadyEvent {
        NodeReadyEvent::new(
            node_name.to_string(),
            NodeDataInputs::new(),
            NodeControlInputs::new(),
        )
    }

    #[test]
    fn test_strict_fifo_and_concurrency_rules() {
        let mut tracker = ExecutionTracker::new();

        // 1. 注册 A1, B1, A2
        let a1_id = tracker.register_ready(create_ready_event("A"), false);
        let _b1_id = tracker.register_ready(create_ready_event("B"), false);
        let a2_id = tracker.register_ready(create_ready_event("A"), false);
        assert_eq!(tracker.pending_ids.len(), 3);

        // 2. 调度 A1
        let event1 = tracker.try_dispatch_next().unwrap();
        assert_eq!(event1.node_name, "A");
        assert_eq!(event1.node_execute_id, a1_id);
        assert!(tracker.running_nodes.contains("A"));
        assert_eq!(tracker.pending_ids.len(), 2);

        // 3. 调度 B1
        let event2 = tracker.try_dispatch_next().unwrap();
        assert_eq!(event2.node_name, "B");
        assert!(tracker.running_nodes.contains("B"));
        assert_eq!(tracker.pending_ids.len(), 1);

        // 4. 尝试调度 A2，应被阻塞
        assert!(tracker.try_dispatch_next().is_none());
        assert_eq!(tracker.pending_ids.len(), 1);
        assert_eq!(tracker.pending_ids.front().unwrap(), &a2_id);

        // 5. A1 完成
        tracker.mark_as_completed(&a1_id, true);
        assert!(!tracker.running_nodes.contains("A"));
        assert!(tracker.running_nodes.contains("B"));

        // 6. 再次尝试调度，A2 应该可以执行了
        let event3 = tracker.try_dispatch_next().unwrap();
        assert_eq!(event3.node_name, "A");
        assert_eq!(event3.node_execute_id, a2_id);
        assert!(tracker.running_nodes.contains("A"));
        assert!(tracker.pending_ids.is_empty());
    }

    #[test]
    fn test_sequential_node_blocks_all_others() {
        let mut tracker = ExecutionTracker::new();

        let a1_id = tracker.register_ready(create_ready_event("A"), false);
        let b1_id = tracker.register_ready(create_ready_event("B"), true); // B 是串行
        let c1_id = tracker.register_ready(create_ready_event("C"), false);

        // 调度 A1 (并发)
        let event_a = tracker.try_dispatch_next().unwrap();
        assert_eq!(event_a.node_execute_id, a1_id);

        // 此时 B 在队首，但 A 在运行，所以 B（串行）被阻塞
        assert!(tracker.try_dispatch_next().is_none());

        // A1 完成
        tracker.mark_as_completed(&a1_id, true);
        assert!(tracker.running_nodes.is_empty());

        // 现在 B 可以执行了
        let event_b = tracker.try_dispatch_next().unwrap();
        assert_eq!(event_b.node_execute_id, b1_id);
        assert!(tracker.is_sequential_running);

        // B 是串行，正在运行，所以 C 被阻塞
        assert!(tracker.try_dispatch_next().is_none());

        // B 完成
        tracker.mark_as_completed(&b1_id, true);
        assert!(!tracker.is_sequential_running);
        assert!(tracker.running_nodes.is_empty());

        // 现在 C 可以执行
        let event_c = tracker.try_dispatch_next().unwrap();
        assert_eq!(event_c.node_execute_id, c1_id);
    }
}