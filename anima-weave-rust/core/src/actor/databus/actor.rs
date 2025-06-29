use super::store::DataStore;
use crate::event::{types::PortRef, NodeOutputEvent, NodeReadyEvent};
use crate::graph::{ActivationMode, Connection, GraphQuery};
use crate::signal::SignalLabel;
use crate::types::{NodeControlInputs, NodeDataInputs, NodeName};
use kameo::prelude::*;
use std::collections::HashMap;
use std::fmt;
use std::sync::Arc;

pub struct DataBus {
    store: DataStore,
    graph: Arc<dyn GraphQuery>,
    coordinator: Recipient<NodeReadyEvent>,
}

impl fmt::Debug for DataBus {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("DataBus")
            .field("store", &self.store)
            .finish()
    }
}

impl DataBus {
    pub fn new(graph: Arc<dyn GraphQuery>, coordinator: Recipient<NodeReadyEvent>) -> Self {
        Self {
            store: DataStore::new(),
            graph,
            coordinator,
        }
    }

    /// Records outputs from a NodeOutputEvent into the DataStore.
    fn record_event(&mut self, event: NodeOutputEvent) {
        for (port, value) in event.data_outputs {
            self.store.add_data_output(&port, value);
        }
        for (port, value) in event.control_outputs {
            self.store.add_control_output(&port, value);
        }
    }

    /// Checks if a given node's dependencies are met and, if so, prepares its inputs.
    ///
    /// This is a pure checking function without side effects.
    fn prepare_if_ready(
        &self,
        node_name: &NodeName,
    ) -> Option<(NodeDataInputs, NodeControlInputs)> {
        // 获取所有上游数据连接和控制连接
        let data_conns = self.graph.get_data_input_connections(node_name);
        let control_conns = self.graph.get_control_input_connections(node_name);

        // 1. 数据依赖检查：对于每条数据连接，检查源端口最新值，并映射到目标端口
        let mut data_inputs = NodeDataInputs::new();
        for conn in data_conns {
            let value = self
                .store
                .get_latest_data(&conn.from_port.node_name, &conn.from_port.port_name)?
                .clone_box();
            data_inputs.insert(PortRef::new(node_name, &conn.to_port.port_name), value);
        }

        // 2. 控制依赖检查：计算控制信号聚合结果
        let control_inputs = self.compute_control_signals(node_name, &control_conns)?;

        Some((data_inputs, control_inputs))
    }

    /// 按目标端口分组控制连接
    fn group_control_connections(
        &self,
        control_conns: &[Connection],
    ) -> HashMap<String, Vec<PortRef>> {
        control_conns.iter().fold(HashMap::new(), |mut acc, conn| {
            acc.entry(conn.to_port.port_name.clone())
                .or_default()
                .push(PortRef::new(
                    &conn.from_port.node_name,
                    &conn.from_port.port_name,
                ));
            acc
        })
    }

    /// 计算单个控制端口的聚合信号
    fn compute_single_control_signal(
        &self,
        node_name: &NodeName,
        port_name: &str,
        sources: &[PortRef],
    ) -> Option<SignalLabel> {
        let mode = self
            .graph
            .get_port_activation_mode(&PortRef::new(node_name, port_name))
            .unwrap_or(ActivationMode::And);

        match mode {
            ActivationMode::And => self.compute_and_signal(sources),
            ActivationMode::Or => self.compute_or_signal(sources),
            ActivationMode::Xor => self.compute_xor_signal(sources),
        }
    }

    /// AND模式：所有源都必须存在，任一inactive则结果inactive
    fn compute_and_signal(&self, sources: &[PortRef]) -> Option<SignalLabel> {
        if !sources.iter().all(|pr| {
            self.store
                .get_control_state(&pr.node_name, &pr.port_name)
                .is_some()
        }) {
            return None;
        }

        let any_inactive = sources.iter().any(|pr| {
            !self
                .store
                .get_control_state(&pr.node_name, &pr.port_name)
                .unwrap()
                .is_active()
        });

        Some(if any_inactive {
            SignalLabel::inactive()
        } else {
            SignalLabel::active()
        })
    }

    /// OR模式：优先选择active源，否则选择任一已记录的源
    fn compute_or_signal(&self, sources: &[PortRef]) -> Option<SignalLabel> {
        // 优先查找active源
        if sources.iter().any(|pr| {
            self.store
                .get_control_state(&pr.node_name, &pr.port_name)
                .map(|s| s.is_active())
                .unwrap_or(false)
        }) {
            return Some(SignalLabel::active());
        }

        // 否则查找任一已记录的源
        if sources.iter().any(|pr| {
            self.store
                .get_control_state(&pr.node_name, &pr.port_name)
                .is_some()
        }) {
            return Some(SignalLabel::inactive());
        }

        None
    }

    /// XOR模式：所有源都必须存在，且恰好一个active
    fn compute_xor_signal(&self, sources: &[PortRef]) -> Option<SignalLabel> {
        if !sources.iter().all(|pr| {
            self.store
                .get_control_state(&pr.node_name, &pr.port_name)
                .is_some()
        }) {
            return None;
        }

        let active_count = sources
            .iter()
            .filter(|pr| {
                self.store
                    .get_control_state(&pr.node_name, &pr.port_name)
                    .unwrap()
                    .is_active()
            })
            .count();

        if active_count == 1 {
            Some(SignalLabel::active())
        } else {
            Some(SignalLabel::inactive())
        }
    }

    /// 计算所有控制信号的聚合结果
    fn compute_control_signals(
        &self,
        node_name: &NodeName,
        control_conns: &[Connection],
    ) -> Option<HashMap<PortRef, SignalLabel>> {
        let groups = self.group_control_connections(control_conns);
        let mut control_signals = HashMap::new();

        for (port_name, sources) in groups {
            let signal = self.compute_single_control_signal(node_name, &port_name, &sources)?;
            control_signals.insert(PortRef::new(node_name, &port_name), signal);
        }

        Some(control_signals)
    }

    /// Processes all dependents: filters ready nodes and dispatches NodeReadyEvent.
    async fn process_ready(&mut self, source_node: &NodeName) {
        // 流式处理所有依赖节点
        for node_name in self.graph.get_node_dependents(source_node) {
            if let Some((data_inputs, control_inputs)) = self.prepare_if_ready(&node_name) {
                println!(
                    "✅ Node {} is ready, sending NodeReadyEvent to coordinator.",
                    &node_name
                );

                // 消费控制状态 - 获取控制连接的源端口
                let control_conns = self.graph.get_control_input_connections(&node_name);
                let controls_to_consume: Vec<PortRef> = control_conns
                    .iter()
                    .map(|conn| PortRef::new(&conn.from_port.node_name, &conn.from_port.port_name))
                    .collect();
                self.store.consume_control_states(&controls_to_consume);

                let ready_event =
                    NodeReadyEvent::new(node_name.clone(), data_inputs, control_inputs);
                self.coordinator
                    .tell(ready_event)
                    .await
                    .expect("Failed to send NodeReadyEvent to coordinator: coordinator actor might have stopped");
            }
        }
    }
}

impl Actor for DataBus {
    type Args = (Arc<dyn GraphQuery>, Recipient<NodeReadyEvent>);
    type Error = anyhow::Error;

    async fn on_start(args: Self::Args, _actor_ref: ActorRef<Self>) -> Result<Self, Self::Error> {
        println!("🚌 DataBus actor started");
        Ok(DataBus::new(args.0, args.1))
    }

    async fn on_stop(
        &mut self,
        _actor_ref: kameo::actor::WeakActorRef<Self>,
        _reason: kameo::error::ActorStopReason,
    ) -> Result<(), Self::Error> {
        println!("🛑 DataBus actor stopped");
        Ok(())
    }
}

impl Message<NodeOutputEvent> for DataBus {
    type Reply = ();

    async fn handle(
        &mut self,
        event: NodeOutputEvent,
        _ctx: &mut Context<Self, Self::Reply>,
    ) -> Self::Reply {
        let source_node_name = event.node_name.clone();
        self.record_event(event);
        println!("📦 DataBus recorded outputs for node: {}", source_node_name);
        self.process_ready(&source_node_name).await;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    /// 创建测试用的DataStore和测试方法的辅助结构
    struct TestHelper {
        store: DataStore,
    }

    impl TestHelper {
        fn new() -> Self {
            Self {
                store: DataStore::new(),
            }
        }

        /// 测试AND模式控制信号聚合
        fn compute_and_signal(&self, sources: &[PortRef]) -> Option<(SignalLabel, Vec<PortRef>)> {
            if !sources.iter().all(|pr| {
                self.store
                    .get_control_state(&pr.node_name, &pr.port_name)
                    .is_some()
            }) {
                return None;
            }

            let any_inactive = sources.iter().any(|pr| {
                !self
                    .store
                    .get_control_state(&pr.node_name, &pr.port_name)
                    .unwrap()
                    .is_active()
            });

            let signal = if any_inactive {
                SignalLabel::inactive()
            } else {
                SignalLabel::active()
            };
            Some((signal, sources.to_vec()))
        }

        /// 测试OR模式控制信号聚合
        fn compute_or_signal(&self, sources: &[PortRef]) -> Option<(SignalLabel, Vec<PortRef>)> {
            // 优先查找active源
            if let Some(pr) = sources.iter().find(|pr| {
                self.store
                    .get_control_state(&pr.node_name, &pr.port_name)
                    .map(|s| s.is_active())
                    .unwrap_or(false)
            }) {
                return Some((SignalLabel::active(), vec![pr.clone()]));
            }

            // 否则查找任一已记录的源
            if let Some(pr) = sources.iter().find(|pr| {
                self.store
                    .get_control_state(&pr.node_name, &pr.port_name)
                    .is_some()
            }) {
                return Some((SignalLabel::inactive(), vec![pr.clone()]));
            }

            None
        }

        /// 测试XOR模式控制信号聚合
        fn compute_xor_signal(&self, sources: &[PortRef]) -> Option<(SignalLabel, Vec<PortRef>)> {
            if !sources.iter().all(|pr| {
                self.store
                    .get_control_state(&pr.node_name, &pr.port_name)
                    .is_some()
            }) {
                return None;
            }

            let active_sources: Vec<_> = sources
                .iter()
                .filter(|pr| {
                    self.store
                        .get_control_state(&pr.node_name, &pr.port_name)
                        .unwrap()
                        .is_active()
                })
                .cloned()
                .collect();

            if active_sources.len() == 1 {
                Some((SignalLabel::active(), active_sources))
            } else {
                None
            }
        }

        /// 测试控制连接分组
        fn group_control_connections(
            &self,
            control_conns: &[Connection],
        ) -> HashMap<String, Vec<PortRef>> {
            control_conns.iter().fold(HashMap::new(), |mut acc, conn| {
                acc.entry(conn.to_port.port_name.clone())
                    .or_default()
                    .push(PortRef::new(
                        &conn.from_port.node_name,
                        &conn.from_port.port_name,
                    ));
                acc
            })
        }
    }

    #[test]
    fn test_and_mode_all_active() {
        let mut helper = TestHelper::new();

        let sources = vec![PortRef::new("node1", "out"), PortRef::new("node2", "out")];

        // 添加控制信号
        helper
            .store
            .add_control_output(&sources[0], SignalLabel::active());
        helper
            .store
            .add_control_output(&sources[1], SignalLabel::active());

        let result = helper.compute_and_signal(&sources);
        assert!(result.is_some());
        let (signal, to_consume) = result.unwrap();
        assert!(signal.is_active());
        assert_eq!(to_consume.len(), 2);
    }

    #[test]
    fn test_and_mode_one_inactive() {
        let mut helper = TestHelper::new();

        let sources = vec![PortRef::new("node1", "out"), PortRef::new("node2", "out")];

        helper
            .store
            .add_control_output(&sources[0], SignalLabel::active());
        helper
            .store
            .add_control_output(&sources[1], SignalLabel::inactive());

        let result = helper.compute_and_signal(&sources);
        assert!(result.is_some());
        let (signal, to_consume) = result.unwrap();
        assert!(signal.is_inactive());
        assert_eq!(to_consume.len(), 2);
    }

    #[test]
    fn test_and_mode_missing_source() {
        let mut helper = TestHelper::new();

        let sources = vec![PortRef::new("node1", "out"), PortRef::new("node2", "out")];

        // 只添加一个源的信号
        helper
            .store
            .add_control_output(&sources[0], SignalLabel::active());

        let result = helper.compute_and_signal(&sources);
        assert!(result.is_none()); // AND模式下缺少源应该返回None
    }

    #[test]
    fn test_or_mode_has_active() {
        let mut helper = TestHelper::new();

        let sources = vec![PortRef::new("node1", "out"), PortRef::new("node2", "out")];

        helper
            .store
            .add_control_output(&sources[0], SignalLabel::inactive());
        helper
            .store
            .add_control_output(&sources[1], SignalLabel::active());

        let result = helper.compute_or_signal(&sources);
        assert!(result.is_some());
        let (signal, to_consume) = result.unwrap();
        assert!(signal.is_active());
        assert_eq!(to_consume.len(), 1);
        assert_eq!(to_consume[0], sources[1]); // 应该选择active的源
    }

    #[test]
    fn test_or_mode_all_inactive() {
        let mut helper = TestHelper::new();

        let sources = vec![PortRef::new("node1", "out"), PortRef::new("node2", "out")];

        helper
            .store
            .add_control_output(&sources[0], SignalLabel::inactive());
        helper
            .store
            .add_control_output(&sources[1], SignalLabel::inactive());

        let result = helper.compute_or_signal(&sources);
        assert!(result.is_some());
        let (signal, to_consume) = result.unwrap();
        assert!(signal.is_inactive());
        assert_eq!(to_consume.len(), 1); // 应该选择第一个有记录的源
    }

    #[test]
    fn test_xor_mode_exactly_one_active() {
        let mut helper = TestHelper::new();

        let sources = vec![
            PortRef::new("node1", "out"),
            PortRef::new("node2", "out"),
            PortRef::new("node3", "out"),
        ];

        helper
            .store
            .add_control_output(&sources[0], SignalLabel::inactive());
        helper
            .store
            .add_control_output(&sources[1], SignalLabel::active());
        helper
            .store
            .add_control_output(&sources[2], SignalLabel::inactive());

        let result = helper.compute_xor_signal(&sources);
        assert!(result.is_some());
        let (signal, to_consume) = result.unwrap();
        assert!(signal.is_active());
        assert_eq!(to_consume.len(), 1);
        assert_eq!(to_consume[0], sources[1]);
    }

    #[test]
    fn test_xor_mode_multiple_active() {
        let mut helper = TestHelper::new();

        let sources = vec![PortRef::new("node1", "out"), PortRef::new("node2", "out")];

        helper
            .store
            .add_control_output(&sources[0], SignalLabel::active());
        helper
            .store
            .add_control_output(&sources[1], SignalLabel::active());

        let result = helper.compute_xor_signal(&sources);
        assert!(result.is_none()); // XOR模式下多个active应该返回None
    }

    #[test]
    fn test_group_control_connections() {
        let helper = TestHelper::new();

        let connections = vec![
            Connection {
                from_port: crate::graph::Port {
                    node_name: "src1".to_string(),
                    port_name: "out1".to_string(),
                    activation_mode: ActivationMode::And,
                },
                to_port: crate::graph::Port {
                    node_name: "target".to_string(),
                    port_name: "ctrl1".to_string(),
                    activation_mode: ActivationMode::And,
                },
            },
            Connection {
                from_port: crate::graph::Port {
                    node_name: "src2".to_string(),
                    port_name: "out2".to_string(),
                    activation_mode: ActivationMode::And,
                },
                to_port: crate::graph::Port {
                    node_name: "target".to_string(),
                    port_name: "ctrl1".to_string(),
                    activation_mode: ActivationMode::And,
                },
            },
            Connection {
                from_port: crate::graph::Port {
                    node_name: "src3".to_string(),
                    port_name: "out3".to_string(),
                    activation_mode: ActivationMode::And,
                },
                to_port: crate::graph::Port {
                    node_name: "target".to_string(),
                    port_name: "ctrl2".to_string(),
                    activation_mode: ActivationMode::And,
                },
            },
        ];

        let groups = helper.group_control_connections(&connections);

        assert_eq!(groups.len(), 2);
        assert_eq!(groups["ctrl1"].len(), 2);
        assert_eq!(groups["ctrl2"].len(), 1);

        assert_eq!(groups["ctrl1"][0], PortRef::new("src1", "out1"));
        assert_eq!(groups["ctrl1"][1], PortRef::new("src2", "out2"));
        assert_eq!(groups["ctrl2"][0], PortRef::new("src3", "out3"));
    }
}
