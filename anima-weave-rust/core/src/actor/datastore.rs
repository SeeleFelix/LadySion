use crate::{actor::DataStoreError, DataEvent, PortRef, SemanticLabel};
use async_trait::async_trait;

/// DataStore 抽象接口
///
/// 这个trait定义了DataStore的核心能力：数据存储和查询服务
#[async_trait]
pub trait DataStore: Send + Sync {
    /// =========================
    /// 核心功能
    /// =========================

    /// 存储数据事件（数据的最终归宿）
    ///
    /// 核心设计原则：
    /// - 所有DataEvent完全不可变存储
    /// - 同一个PortRef可能对应多个DataEvent
    /// - 按时间顺序保存，支持历史查询
    async fn store_data_event(&mut self, event: DataEvent) -> Result<(), DataStoreError>;

    /// 获取端口的最新数据
    ///
    /// 返回指定端口的最新原始数据，不进行类型转换
    ///
    /// # 参数
    /// - `port`: 端口引用（node_name + port_name）
    ///
    /// # 返回
    /// - `Ok(data)`: 成功获取的原始数据
    /// - `Err(DataStoreError)`: 无数据或获取失败
    async fn get_port_data(&self, port: &PortRef)
        -> Result<Box<dyn SemanticLabel>, DataStoreError>;

    /// 获取端口数据并转换为目标类型
    ///
    /// 实现逻辑：
    /// 1. 获取端口的原始数据
    /// 2. 调用数据自己的 try_convert_to() 方法
    /// 3. 包装转换错误为DataStoreError
    ///
    /// # 参数
    /// - `port`: 端口引用（node_name + port_name）
    /// - `target_semantic_label_type`: 目标语义标签类型名称，将传递给 SemanticLabel::try_convert_to()
    ///
    /// # 返回
    /// - `Ok(data)`: 成功获取并转换的数据
    /// - `Err(DataStoreError)`: 无数据或转换失败
    async fn get_port_data_as(
        &self,
        port: &PortRef,
        target_semantic_label_type: &str,
    ) -> Result<Box<dyn SemanticLabel>, DataStoreError>;

    /// 检查端口是否有数据
    ///
    /// 用于Coordinator的DataReady检查
    fn has_data(&self, port: &PortRef) -> bool;

    /// 获取端口数据历史（调试用）
    ///
    /// 返回指定端口的所有历史DataEvent，按时间排序
    fn get_data_history(&self, port: &PortRef) -> Vec<&DataEvent>;

    /// =========================
    /// 生命周期管理
    /// =========================

    /// 初始化DataStore
    ///
    /// 执行必要的初始化操作
    async fn initialize(&mut self) -> Result<(), DataStoreError>;

    /// 优雅关闭
    ///
    /// 处理完所有数据后关闭
    async fn shutdown(&mut self) -> Result<(), DataStoreError>;

    /// 健康检查
    ///
    /// 检查DataStore是否健康运行
    fn health_check(&self) -> bool;
}
