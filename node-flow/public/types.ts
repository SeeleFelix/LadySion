/**
 * 🌟 NodeFlow 公共类型定义
 * 
 * 这是框架对外暴露的所有类型定义
 */

// 节点类型枚举
export enum NodeType {
  PURE = 'pure',
  UI_INPUT = 'ui-input', 
  UI_OUTPUT = 'ui-output',
  COMPOSITE = 'composite'
}

// 节点配置接口
export interface NodeConfig {
  [key: string]: any;
}

// 节点位置接口
export interface NodePosition {
  x: number;
  y: number;
}

// 工作流元数据接口
export interface FlowMetadata {
  name?: string;
  description?: string;
  version?: string;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 连接接口  
export interface Connection {
  from: string;
  to: string;
}

// 端口定义接口
export interface Port {
  name: string;
  type: string;
  optional?: boolean;
  defaultValue?: any;
}

// 端口连接接口
export interface PortConnection {
  fromNode: string;
  fromPort: string;
  toNode: string;
  toPort: string;
}

// 执行结果接口
export interface ExecutionResult {
  success: boolean;
  error?: string;
  nodeResults?: Map<string, any>;
  executionTime?: number;
  // 为了兼容，保留这些字段但标记为可选
  executedNodes?: string[];
  totalNodes?: number;
  errors?: Array<{
    nodeId: string;
    error: string;
  }>;
}

// 变更类型枚举
export enum ChangeType {
  ADDED = 'added',
  REMOVED = 'removed', 
  MODIFIED = 'modified'
}

// 差异报告接口
export interface FlowDiff {
  nodeChanges: Array<{
    type: ChangeType;
    nodeId: string;
    oldValue?: any;
    newValue?: any;
  }>;
  connectionChanges: Array<{
    type: ChangeType;
    from: string;
    to: string;
  }>;
  metadataChanges: Array<{
    type: ChangeType;
    key: string;
    oldValue?: any;
    newValue?: any;
  }>;
  isEmpty(): boolean;
  generateReport(): string;
} 