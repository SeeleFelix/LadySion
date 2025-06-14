// AnimaWeave Dynamic Graph Executor
// 主接口模块 - 框架入口

import { AnimaWeaveEngine } from "./framework/engine.ts";
import { ExecutionStatus, isStaticError, isRuntimeError, type FateEcho } from "./framework/core.ts";

// 重新导出核心接口
export { ExecutionStatus, isStaticError, isRuntimeError, type FateEcho };
export type {
  IAnimaPlugin,
  WeaveConnection,
  WeaveGraph,
  WeaveNode,
  SemanticValue,
  ErrorDetails,
} from "./framework/core.ts";

/**
 * AnimaWeave主执行函数
 *
 * @param sanctumPath - 圣所路径（包含anima文件的目录）
 * @param weaveName - 图文件名（不含.weave扩展名）
 * @returns FateEcho - 执行结果
 */
export async function awakening(sanctumPath: string, weaveName: string): Promise<FateEcho> {
  // 🔧 智能路径解析：支持从不同工作目录运行
  const resolvedPath = await resolveSanctumPath(sanctumPath);
  console.log(`🌟 AnimaWeave觉醒: ${resolvedPath}/${weaveName}.weave`);

  const engine = new AnimaWeaveEngine();
  return await engine.executeGraph(resolvedPath, weaveName);
}

/**
 * 智能解析sanctum路径
 * 支持从根目录或anima-weave目录运行测试
 */
async function resolveSanctumPath(sanctumPath: string): Promise<string> {
  // 如果是绝对路径，直接返回
  if (sanctumPath.startsWith('/')) {
    return sanctumPath;
  }
  
  // 尝试当前工作目录下的路径
  try {
    const currentPath = `${Deno.cwd()}/${sanctumPath}`;
    await Deno.stat(currentPath);
    return sanctumPath; // 相对路径有效，直接使用
  } catch {
    // 当前路径无效，尝试其他可能的路径
  }
  
  // 尝试anima-weave子目录下的路径（从根目录运行时）
  try {
    const animaWeavePath = `anima-weave/${sanctumPath}`;
    const fullPath = `${Deno.cwd()}/${animaWeavePath}`;
    await Deno.stat(fullPath);
    return animaWeavePath;
  } catch {
    // anima-weave路径也无效
  }
  
  // 尝试上级目录的anima-weave路径（从其他子目录运行时）
  try {
    const parentAnimaWeavePath = `../anima-weave/${sanctumPath}`;
    const fullPath = `${Deno.cwd()}/${parentAnimaWeavePath}`;
    await Deno.stat(fullPath);
    return parentAnimaWeavePath;
  } catch {
    // 所有路径都无效
  }
  
  // 如果所有尝试都失败，返回原始路径（让后续错误处理来处理）
  console.warn(`⚠️ 无法解析sanctum路径: ${sanctumPath}，使用原始路径`);
  return sanctumPath;
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
