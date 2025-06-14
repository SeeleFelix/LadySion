// 图解析器核心模块
// 负责解析anima插件定义和weave图文件

import { AnimaWeaveDSLParser } from "../parser/dsl_parser.ts";

export interface AnimaDefinition {
  semantic_labels: Record<string, TypeDefinition>;
  nodes: Record<string, NodeDefinition>;
  metadata: {
    name: string;
    version: string;
    description?: string;
  };
}

export interface TypeDefinition {
  name: string;
  kind: "primitive" | "composite" | "semantic";
  baseType?: string; // 对于semantic types，指向底层类型
  fields?: Record<string, string>; // 对于composite types
  validation?: string[]; // 验证规则
}

export interface NodeDefinition {
  name: string;
  inputs: Record<string, string>; // input名 -> type名
  outputs: Record<string, string>; // output名 -> type名
  implementation: string; // 对应的实现函数名
  description?: string;
}

export interface WeaveGraph {
  nodes: Record<string, WeaveNode>;
  connections: WeaveConnection[];
  metadata: {
    name: string;
    description?: string;
    entry_points: string[]; // 入口节点IDs
  };
}

export interface WeaveNode {
  id: string;
  type: string; // 对应anima中的node type
  plugin: string; // 对应的插件名
  parameters?: Record<string, unknown>;
}

export interface WeaveConnection {
  from: {
    node: string;
    output: string;
  };
  to: {
    node: string;
    input: string;
  };
}

// PEG语法定义接口
export interface ParserGrammar {
  parseAnima(content: string): AnimaDefinition;
  parseWeave(content: string): WeaveGraph;
}

// 解析器工厂
export class GraphParser implements ParserGrammar {
  private dslParser: AnimaWeaveDSLParser;

  constructor() {
    this.dslParser = new AnimaWeaveDSLParser();
  }

  parseAnima(content: string): AnimaDefinition {
    console.log("🎯 GraphParser.parseAnima 调用真实DSL解析器");
    return this.dslParser.parseAnima(content);
  }

  parseWeave(content: string): WeaveGraph {
    console.log("🎯 GraphParser.parseWeave 调用真实DSL解析器");
    return this.dslParser.parseWeave(content);
  }
}
