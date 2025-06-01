/**
 * 🔍 Seeker 注册器
 * 管理所有后端 Seeker 实现的注册、发现和调用
 */

import type { 
  SeekerImplementation, 
  SeekerRegistration 
} from "../types/backend.ts";

/**
 * 🎯 Seeker 注册管理器
 */
export class SeekerRegistry {
  private seekers = new Map<string, SeekerRegistration>();
  private static instance: SeekerRegistry;

  private constructor() {}

  static getInstance(): SeekerRegistry {
    if (!SeekerRegistry.instance) {
      SeekerRegistry.instance = new SeekerRegistry();
    }
    return SeekerRegistry.instance;
  }

  /**
   * 🔮 注册 Seeker 实现
   */
  register(eidolonName: string, implementation: SeekerImplementation): void {
    // 🔍 自动发现实现的方法
    const methods = this.discoverMethods(implementation);
    
    const registration: SeekerRegistration = {
      name: eidolonName,
      instance: implementation,
      methods,
      metadata: {
        registeredAt: new Date().toISOString(),
        className: implementation.constructor.name,
      }
    };

    this.seekers.set(eidolonName, registration);
    
    console.log(`🎯 已注册 Seeker: ${eidolonName}, 方法: [${Array.from(methods).join(', ')}]`);
  }

  /**
   * 🔍 查找 Seeker 实现
   */
  getSeeker(eidolonName: string): SeekerRegistration | undefined {
    return this.seekers.get(eidolonName);
  }

  /**
   * 🎭 检查方法是否存在
   */
  hasMethod(eidolonName: string, ritualName: string): boolean {
    const seeker = this.seekers.get(eidolonName);
    return seeker?.methods.has(ritualName) ?? false;
  }

  /**
   * 🚀 调用 Seeker 方法
   */
  async invoke(eidolonName: string, ritualName: string, args: any[]): Promise<any> {
    const seeker = this.seekers.get(eidolonName);
    
    if (!seeker) {
      throw new Error(`未找到 Seeker: ${eidolonName}`);
    }

    if (!seeker.methods.has(ritualName)) {
      throw new Error(`${eidolonName} 中未找到方法: ${ritualName}`);
    }

    const method = (seeker.instance as any)[ritualName];
    
    if (typeof method !== 'function') {
      throw new Error(`${eidolonName}.${ritualName} 不是一个函数`);
    }

    // 🎯 调用实际方法，传入解析后的参数
    return await method.apply(seeker.instance, args);
  }

  /**
   * 📋 获取所有已注册的 Seeker
   */
  getAllSeekers(): SeekerRegistration[] {
    return Array.from(this.seekers.values());
  }

  /**
   * 📊 获取注册统计信息
   */
  getStats(): {
    totalSeekers: number;
    totalMethods: number;
    seekerList: Array<{ name: string; methodCount: number }>;
  } {
    const seekerList = Array.from(this.seekers.values()).map(seeker => ({
      name: seeker.name,
      methodCount: seeker.methods.size,
    }));

    return {
      totalSeekers: this.seekers.size,
      totalMethods: seekerList.reduce((sum, s) => sum + s.methodCount, 0),
      seekerList,
    };
  }

  /**
   * 🔬 自动发现实现类的方法
   */
  private discoverMethods(implementation: SeekerImplementation): Set<string> {
    const methods = new Set<string>();
    
    // 获取实例自身的方法
    const prototype = Object.getPrototypeOf(implementation);
    const instanceMethods = Object.getOwnPropertyNames(prototype);
    
    for (const methodName of instanceMethods) {
      // 排除构造函数和私有方法
      if (methodName !== 'constructor' && 
          !methodName.startsWith('_') && 
          typeof (implementation as any)[methodName] === 'function') {
        methods.add(methodName);
      }
    }

    // 也检查实例自身的方法（箭头函数等）
    const ownMethods = Object.getOwnPropertyNames(implementation);
    for (const methodName of ownMethods) {
      if (!methodName.startsWith('_') && 
          typeof (implementation as any)[methodName] === 'function') {
        methods.add(methodName);
      }
    }

    return methods;
  }

  /**
   * 🧹 清空注册器（主要用于测试）
   */
  clear(): void {
    this.seekers.clear();
  }
} 