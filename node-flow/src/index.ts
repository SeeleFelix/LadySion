/**
 * 🚀 Node Flow - 可组合工作流系统
 * 类似ComfyUI的节点式工作流框架
 * 
 * 主要特性：
 * - 🧩 支持纯函数、UI输入、UI输出节点
 * - 📊 严格的DAG验证和循环检测  
 * - ⚡ 高性能拓扑排序和并发执行
 * - 🔄 完整的数据流管理
 * - 🧪 全面的TDD测试覆盖
 */

// 🧩 核心节点类型
export { Node } from '@node-flow/core/node.ts';
export { PureNode } from '@node-flow/core/pure-node.ts';
export { UIInputNode } from '@node-flow/core/ui-input-node.ts';
export { UIOutputNode } from '@node-flow/core/ui-output-node.ts';

// 🎯 类型定义
export { NodeType, type NodeData, type NodeConfig } from '@node-flow/core/types.ts';

// 🧮 引擎组件
export { DAGValidator, type Connection } from '@node-flow/engine/dag-validator.ts';
export { GraphExecutor, type ExecutionResult } from '@node-flow/engine/graph-executor.ts';

// 🎪 版本信息
export const VERSION = '1.0.0';
export const NAME = '@ladysion/node-flow'; 