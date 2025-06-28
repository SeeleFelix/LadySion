//! CoordinatorActor 抽象定义
//!
//! CoordinatorActor是AnimaWeave系统的图执行引擎，负责：
//! - 启动和停止图的执行
//! - 响应事件并自动调度节点执行
//! - 提供执行状态查询
//!
//! 设计原则：
//! - 封装复杂性：外部不需要关心内部的NodeReady检查、调度算法等
//! - 事件驱动：通过handle_event()响应系统事件，自动处理后续逻辑
//! - 简单接口：只暴露4个核心方法，符合外部使用需求

use crate::{
    actor::CoordinatorError,
    event::{ControlEvent, DataEvent, NodeExecutionEvent},
};
use async_trait::async_trait;

/// CoordinatorActor 核心接口
///
/// 这个trait定义了图执行引擎的核心能力，专注于对外服务
///
/// # 设计说明
///
/// ## 为什么这样设计？
///
/// ### 1. 外部使用场景驱动
/// - 运行时系统：`start()` -> `handle_event()` -> `get_status()` -> `stop()`
/// - 事件系统：只需要调用`handle_event()`响应新数据
/// - 监控系统：只需要调用`get_status()`获取状态
///
/// ### 2. 封装复杂性
/// 以下逻辑全部封装在实现中，外部不需要关心：
/// - NodeReady检查：`DataReady(n,Ω) ∧ ControlActive(n,Ω)`
/// - 图遍历和依赖分析
/// - 调度算法和并发控制
/// - DataStore和Graph的交互
/// - 状态管理和持久化
///
/// ### 3. 职责清晰
/// - `start/stop`：生命周期管理
/// - `handle_event`：核心业务逻辑（事件驱动）
/// - `get_status`：状态查询（监控需求）
///
/// ### 4. 依赖注入
/// 实现时通过构造函数注入GraphQuery和DataStore：
/// ```rust
/// impl CoordinatorImpl {
///     pub fn new(graph: Arc<dyn GraphQuery>, datastore: Arc<dyn DataStore>) -> Self
/// }
/// ```
///
/// ### 5. 内部实现逻辑
/// `handle_event()`内部的处理流程：
/// 1. 更新内部状态（基于事件类型）
/// 2. 检查所有节点的ready状态
/// 3. 为ready的节点创建执行任务
/// 4. 更新统计信息
/// 5. 返回处理结果
///
/// # Examples
///
/// ```rust
/// use anima_weave_core::actor::Coordinator;
///
/// async fn example_usage(mut coordinator: impl Coordinator) {
///     // 启动执行引擎
///     coordinator.start().await.unwrap();
///     
///     // 处理数据事件
///     let data_event = DataEvent::new(/* ... */);
///     coordinator.handle_data_event(data_event).await.unwrap();
///     
///     // 查询状态
///     let status = coordinator.get_status();
///     println!("Running: {}, Active nodes: {}", 
///              status.is_running, status.active_nodes_count);
///     
///     // 停止引擎
///     coordinator.stop().await.unwrap();
/// }
/// ```
#[async_trait]
pub trait Coordinator: Send + Sync {
    /// 启动图执行引擎
    ///
    /// 初始化所有必要的服务和状态，开始响应事件
    ///
    /// # 返回
    /// - `Ok(())`: 启动成功，引擎开始工作
    /// - `Err(CoordinatorError)`: 启动失败
    async fn start(&mut self) -> Result<(), CoordinatorError>;

    /// 处理系统事件
    ///
    /// 这是核心方法，响应各种事件并自动执行相应的调度逻辑：
    /// - DataEvent: 新数据到达，检查下游节点是否ready并调度执行
    /// - ControlEvent: 控制信号变化，更新节点状态并触发相应执行
    /// - NodeExecutionEvent: 节点执行完成，更新状态并检查后续节点
    ///
    /// # 参数
    /// - `event`: 系统事件
    ///
    /// # 返回
    /// - `Ok(())`: 事件处理成功
    /// - `Err(CoordinatorError)`: 处理失败
    async fn handle_data_event(&mut self, event: DataEvent) -> Result<(), CoordinatorError>;
    async fn handle_control_event(&mut self, event: ControlEvent) -> Result<(), CoordinatorError>;
    async fn handle_node_execution_event(&mut self, event: NodeExecutionEvent) -> Result<(), CoordinatorError>;

    /// 获取执行状态
    ///
    /// 返回当前图执行的状态信息，用于监控和调试
    ///
    /// # 返回
    /// 当前的执行状态快照
    fn get_status(&self) -> ExecutionStatus;

    /// 停止图执行引擎
    ///
    /// 优雅地停止所有正在执行的节点，清理资源
    ///
    /// # 返回
    /// - `Ok(())`: 停止成功
    /// - `Err(CoordinatorError)`: 停止过程中出现错误
    async fn stop(&mut self) -> Result<(), CoordinatorError>;
}

/// 执行状态信息
///
/// 提供给外部的状态查询结果
#[derive(Debug, Clone)]
pub struct ExecutionStatus {
    /// 引擎是否正在运行
    pub is_running: bool,
    /// 当前正在执行的节点数量
    pub active_nodes_count: usize,
    /// 等待执行的节点数量
    pub pending_nodes_count: usize,
    /// 总执行次数
    pub total_executions: u64,
    /// 成功执行次数
    pub successful_executions: u64,
    /// 失败执行次数
    pub failed_executions: u64,
    /// 最后活动时间
    pub last_activity: Option<std::time::SystemTime>,
    /// 当前错误（如果有）
    pub current_error: Option<String>,
}

impl ExecutionStatus {
    /// 创建空的状态
    pub fn empty() -> Self {
        Self {
            is_running: false,
            active_nodes_count: 0,
            pending_nodes_count: 0,
            total_executions: 0,
            successful_executions: 0,
            failed_executions: 0,
            last_activity: None,
            current_error: None,
        }
    }

    /// 计算成功率
    pub fn success_rate(&self) -> f64 {
        if self.total_executions == 0 {
            0.0
        } else {
            self.successful_executions as f64 / self.total_executions as f64
        }
    }

    /// 检查是否健康运行
    pub fn is_healthy(&self) -> bool {
        self.is_running && self.current_error.is_none()
    }
}

impl Default for ExecutionStatus {
    fn default() -> Self {
        Self::empty()
    }
}
