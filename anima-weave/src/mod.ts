// AnimaWeave Dynamic Graph Executor
// 主接口模块 - 框架入口

import { AnimaWeaveEngine } from "./framework/engine.ts";
import { ExecutionStatus, isStaticError, isRuntimeError, type FateEcho } from "./framework/core.ts";

// 重新导出核心接口
export { ExecutionStatus, isStaticError, isRuntimeError, type FateEcho };
export type {
  ExecutionContext,
  IAnimaPlugin,
  NodeDefinition,
  PluginDefinition,
  TypeDefinition,
  WeaveConnection,
  WeaveGraph,
  WeaveNode,
} from "./framework/core.ts";

/**
 * AnimaWeave主执行函数
 *
 * @param sanctumPath - 圣所路径（包含anima文件的目录）
 * @param weaveName - 图文件名（不含.weave扩展名）
 * @returns FateEcho - 执行结果
 */
export async function awakening(sanctumPath: string, weaveName: string): Promise<FateEcho> {
  console.log(`🌟 AnimaWeave觉醒: ${sanctumPath}/${weaveName}.weave`);

  const engine = new AnimaWeaveEngine();
  return await engine.executeGraph(sanctumPath, weaveName);
}

/**
 * 创建新的AnimaWeave引擎实例（用于高级用法）
 */
export function createEngine(): AnimaWeaveEngine {
  return new AnimaWeaveEngine();
}

// 重新导出框架组件（供插件开发使用）
export { AnimaWeaveEngine } from "./framework/engine.ts";
export { PluginRegistry } from "./framework/core.ts";
