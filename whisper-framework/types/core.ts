/**
 * 🌟 Whisper Framework - 核心类型定义
 * 简洁的工厂函数模式，在scripture中创建seeker实例
 */

// 🔮 Eidolon（映灵）- 核心数据类型基础接口
export interface Eidolon {

}

// 🎭 Spell（法术）- 多参数列表，保留参数顺序
export interface Spell {
  args: any[];                    // 参数值列表
}

// 🔱 Omen（神启）- 状态信息
export interface Omen {
  code: number;
  status: 'success' | 'error' | 'warning';
  message: string;
  signal?: string;
}

// ✨ Grace（神恩）- 统一响应格式
export interface Grace<TEidolon = any> {
  eidolon: TEidolon | TEidolon[] | null;
  omen: Omen;
  timestamp: number;
}

// 🌟 Whisper（低语祷告）- 框架内部请求结构
export interface Whisper {
  eidolon: string;    // 目标映灵名称
  ritual: string;     // 仪式名称
  spell: Spell;       // 法术内容（多参数列表）
}

// 🙏 Seeker（祈祷者）- 基类接口
export interface Seeker<T extends Eidolon> {

}

// ⚡ Doctrine（教义）- 框架配置
export interface Doctrine {
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
  retries?: number;
  retryDelay?: number;
  whisperPath?: string;
}

// 🎯 createSeeker工厂函数类型
export type CreateSeeker = <TSeeker extends Seeker<any>>(
  eidolonName: string,
  doctrine?: Doctrine,
) => TSeeker;

// 🚨 框架异常类型
export class WhisperError extends Error {
  constructor(
    message: string,
    public omen: Omen,
    public details?: any
  ) {
    super(message);
    this.name = 'WhisperError';
  }
} 