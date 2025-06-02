/**
 * 🎯 Node Flow 核心类型定义
 */

// 🎭 节点类型
export enum NodeType {
  PURE = 'pure',           // 纯函数节点（无副作用）
  UI_INPUT = 'ui-input',   // UI输入节点
  UI_OUTPUT = 'ui-output', // UI输出节点
  COMPOSITE = 'composite'  // 组合节点
}

// 📊 数据容器
export interface NodeData {
  [key: string]: any;
}

// ⚙️ 节点配置
export interface NodeConfig {
  [key: string]: any;
} 