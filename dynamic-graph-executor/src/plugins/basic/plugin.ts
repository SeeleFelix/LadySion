// Basic Plugin - 插件自己定义类型和节点
// anima文件是从这里自动生成的

import type { 
  IAnimaPlugin, 
  PluginDefinition, 
  ExecutionContext,
  TypeDefinition,
  NodeDefinition
} from "../../framework/core.ts";

/**
 * Basic插件实现
 * 提供基础数据类型和基本操作节点
 */
export class BasicPlugin implements IAnimaPlugin {
  private definition: PluginDefinition;

  constructor() {
    // 插件自己定义自己的类型和节点
    this.definition = this.createPluginDefinition();
    console.log(`🔌 初始化Basic插件 v${this.version}`);
  }

  get name(): string {
    return this.definition.metadata.name;
  }

  get version(): string {
    return this.definition.metadata.version;
  }

  /**
   * 创建插件定义 - 插件的核心职责
   */
  private createPluginDefinition(): PluginDefinition {
    // 定义基础类型
    const types: Record<string, TypeDefinition> = {
      Signal: {
        name: "Signal",
        kind: "primitive",
        baseType: "boolean"
      },
      Int: {
        name: "Int", 
        kind: "primitive",
        baseType: "number"
      },
      Bool: {
        name: "Bool",
        kind: "primitive", 
        baseType: "boolean"
      },
      String: {
        name: "String",
        kind: "primitive",
        baseType: "string"
      },
      UUID: {
        name: "UUID",
        kind: "semantic",
        baseType: "string",
        validation: ["uuid-format"]
      },
      Prompt: {
        name: "Prompt",
        kind: "composite",
        fields: {
          id: "basic.String",
          name: "basic.String", 
          content: "basic.String"
        }
      }
    };

    // 定义节点
    const nodes: Record<string, NodeDefinition> = {
      Start: {
        name: "Start",
        inputs: {},
        outputs: {
          signal: "basic.Signal",
          execution_id: "basic.UUID"
        },
        mode: "Concurrent",
        description: "图执行的起始节点"
      },
      GetTimestamp: {
        name: "GetTimestamp",
        inputs: {
          trigger: "basic.Signal"
        },
        outputs: {
          timestamp: "basic.Int",
          done: "basic.Signal"
        },
        mode: "Concurrent",
        description: "获取当前时间戳"
      },
      IsEven: {
        name: "IsEven",
        inputs: {
          number: "basic.Int",
          trigger: "basic.Signal"
        },
        outputs: {
          result: "basic.Bool",
          done: "basic.Signal"
        },
        mode: "Concurrent",
        description: "判断数字是否为偶数"
      },
      FormatNumber: {
        name: "FormatNumber",
        inputs: {
          number: "basic.Int",
          trigger: "basic.Signal"
        },
        outputs: {
          formatted: "basic.String",
          done: "basic.Signal"
        },
        mode: "Concurrent",
        description: "格式化数字为字符串"
      },
      CreatePrompt: {
        name: "CreatePrompt",
        inputs: {
          name: "basic.String",
          content: "basic.String",
          trigger: "basic.Signal"
        },
        outputs: {
          prompt: "basic.Prompt",
          done: "basic.Signal"
        },
        mode: "Concurrent",
        description: "创建Prompt对象"
      }
    };

    return {
      metadata: {
        name: "basic",
        version: "1.0.0",
        description: "Basic plugin providing fundamental types and operations"
      },
      types,
      nodes
    };
  }

  /**
   * 获取插件定义
   */
  getPluginDefinition(): PluginDefinition {
    return this.definition;
  }

  /**
   * 获取支持的类型
   */
  getSupportedTypes(): string[] {
    return Object.keys(this.definition.types);
  }

  /**
   * 获取支持的节点
   */
  getSupportedNodes(): string[] {
    return Object.keys(this.definition.nodes);
  }

  /**
   * 验证值类型
   */
  validateValue(value: unknown, typeName: string): boolean {
    console.log(`🔍 验证类型: ${typeName} =`, value);
    
    switch (typeName) {
      case 'Signal':
        return typeof value === 'boolean';
      case 'Int':
        return typeof value === 'number' && Number.isInteger(value);
      case 'Bool':
        return typeof value === 'boolean';
      case 'String':
        return typeof value === 'string';
      case 'UUID':
        return typeof value === 'string' && this.isValidUUID(value);
      case 'Prompt':
        return this.validatePromptType(value);
      default:
        console.warn(`⚠️ 未知类型: ${typeName}, 默认通过验证`);
        return true;
    }
  }

  /**
   * 创建类型默认值
   */
  createDefaultValue(typeName: string): unknown {
    switch (typeName) {
      case 'Signal':
        return false;
      case 'Int':
        return 0;
      case 'Bool':
        return false;
      case 'String':
        return "";
      case 'UUID':
        return crypto.randomUUID();
      case 'Prompt':
        return {
          id: crypto.randomUUID(),
          name: "",
          content: ""
        };
      default:
        throw new Error(`Cannot create default value for unknown type: ${typeName}`);
    }
  }

  /**
   * 执行节点
   */
  async executeNode(nodeName: string, inputs: Record<string, unknown>): Promise<Record<string, unknown>> {
    console.log(`⚙️ Basic插件执行节点: ${nodeName}`, inputs);
    
    switch (nodeName) {
      case 'Start':
        return this.executeStart(inputs);
      case 'GetTimestamp':
        return this.executeGetTimestamp(inputs);
      case 'IsEven':
        return this.executeIsEven(inputs);
      case 'FormatNumber':
        return this.executeFormatNumber(inputs);
      case 'CreatePrompt':
        return this.executeCreatePrompt(inputs);
      default:
        throw new Error(`Unknown node: ${nodeName}`);
    }
  }

  // ========== 节点实现 ==========

  private executeStart(inputs: Record<string, unknown>): Record<string, unknown> {
    console.log("🚀 执行Start节点");
    
    const executionId = crypto.randomUUID();
    
    const result = {
      signal: true,
      execution_id: executionId
    };
    
    console.log("✅ Start节点完成:", result);
    return result;
  }

  private executeGetTimestamp(inputs: Record<string, unknown>): Record<string, unknown> {
    console.log("⏰ 执行GetTimestamp节点");
    
    // 验证输入
    if (!('trigger' in inputs)) {
      throw new Error('GetTimestamp node requires trigger input');
    }
    
    const timestamp = Math.floor(Date.now() / 1000);
    
    const result = {
      timestamp: timestamp,
      done: true
    };
    
    console.log("✅ GetTimestamp节点完成:", result);
    return result;
  }

  private executeIsEven(inputs: Record<string, unknown>): Record<string, unknown> {
    console.log("🔢 执行IsEven节点");
    
    // 验证输入
    if (!('number' in inputs) || typeof inputs.number !== 'number') {
      throw new Error('IsEven node requires number input of type Int');
    }
    
    if (!('trigger' in inputs)) {
      throw new Error('IsEven node requires trigger input');
    }
    
    const number = inputs.number as number;
    const isEven = number % 2 === 0;
    
    const result = {
      result: isEven,
      done: true
    };
    
    console.log("✅ IsEven节点完成:", result);
    return result;
  }

  private executeFormatNumber(inputs: Record<string, unknown>): Record<string, unknown> {
    console.log("📝 执行FormatNumber节点");
    
    // 验证输入
    if (!('number' in inputs) || typeof inputs.number !== 'number') {
      throw new Error('FormatNumber node requires number input of type Int');
    }
    
    if (!('trigger' in inputs)) {
      throw new Error('FormatNumber node requires trigger input');
    }
    
    const number = inputs.number as number;
    const formatted = `Number: ${number}`;
    
    const result = {
      formatted: formatted,
      done: true
    };
    
    console.log("✅ FormatNumber节点完成:", result);
    return result;
  }

  private executeCreatePrompt(inputs: Record<string, unknown>): Record<string, unknown> {
    console.log("📋 执行CreatePrompt节点");
    
    // 验证输入
    if (!('name' in inputs) || typeof inputs.name !== 'string') {
      throw new Error('CreatePrompt node requires name input of type String');
    }
    
    if (!('content' in inputs) || typeof inputs.content !== 'string') {
      throw new Error('CreatePrompt node requires content input of type String');
    }
    
    if (!('trigger' in inputs)) {
      throw new Error('CreatePrompt node requires trigger input');
    }
    
    const name = inputs.name as string;
    const content = inputs.content as string;
    
    const prompt = {
      id: crypto.randomUUID(),
      name: name,
      content: content
    };
    
    const result = {
      prompt: prompt,
      done: true
    };
    
    console.log("✅ CreatePrompt节点完成:", result);
    return result;
  }

  // ========== 辅助方法 ==========

  private isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  private validatePromptType(value: unknown): boolean {
    if (typeof value !== 'object' || value === null) return false;
    
    const obj = value as Record<string, unknown>;
    
    return (
      'id' in obj && typeof obj.id === 'string' && this.isValidUUID(obj.id) &&
      'name' in obj && typeof obj.name === 'string' &&
      'content' in obj && typeof obj.content === 'string'
    );
  }
} 