// 模块化插件架构设计
// 支持大型插件分模块组织，避免单个文件过大

import { SemanticValue } from "./semantic-value-abstraction.ts";

/**
 * 节点实现函数类型
 */
type NodeImplementation = (inputs: Record<string, SemanticValue>) => Promise<Record<string, SemanticValue>> | Record<string, SemanticValue>;

/**
 * 节点定义
 */
interface NodeDefinition {
  inputs: Record<string, string>;   // 端口名 -> 语义标签
  outputs: Record<string, string>;  // 端口名 -> 语义标签
  implement: NodeImplementation;
  description?: string;
  category?: string;  // 节点分类，用于组织
}

/**
 * 节点模块 - 一组相关的节点
 */
interface NodeModule {
  name: string;
  description?: string;
  nodes: Record<string, NodeDefinition>;
}

/**
 * 语义标签定义
 */
interface LabelDefinition {
  kind: "primitive" | "composite" | "semantic";
  baseType?: string;
  fields?: Record<string, string>;
  validation?: string[];
  description?: string;
}

/**
 * 标签模块 - 一组相关的语义标签
 */
interface LabelModule {
  name: string;
  description?: string;
  labels: Record<string, LabelDefinition>;
}

/**
 * 模块化插件定义
 */
interface ModularPluginDefinition {
  name: string;
  version: string;
  description?: string;
  
  // 标签模块
  labelModules: LabelModule[];
  
  // 节点模块
  nodeModules: NodeModule[];
}

/**
 * 节点构建器 - 简化节点定义
 */
class NodeBuilder {
  private _inputs: Record<string, string> = {};
  private _outputs: Record<string, string> = {};
  private _implement?: NodeImplementation;
  private _description?: string;
  private _category?: string;

  inputs(inputs: Record<string, string>): this {
    this._inputs = inputs;
    return this;
  }

  outputs(outputs: Record<string, string>): this {
    this._outputs = outputs;
    return this;
  }

  implement(fn: NodeImplementation): this {
    this._implement = fn;
    return this;
  }

  description(desc: string): this {
    this._description = desc;
    return this;
  }

  category(cat: string): this {
    this._category = cat;
    return this;
  }

  build(): NodeDefinition {
    if (!this._implement) {
      throw new Error("Node implementation is required");
    }
    
    return {
      inputs: this._inputs,
      outputs: this._outputs,
      implement: this._implement,
      description: this._description,
      category: this._category
    };
  }
}

/**
 * 节点定义辅助函数
 */
function defineNode(): NodeBuilder {
  return new NodeBuilder();
}

/**
 * 节点模块构建器
 */
class NodeModuleBuilder {
  private _name: string;
  private _description?: string;
  private _nodes: Record<string, NodeDefinition> = {};

  constructor(name: string) {
    this._name = name;
  }

  description(desc: string): this {
    this._description = desc;
    return this;
  }

  node(name: string, definition: NodeDefinition): this {
    this._nodes[name] = definition;
    return this;
  }

  nodes(definitions: Record<string, NodeDefinition>): this {
    Object.assign(this._nodes, definitions);
    return this;
  }

  build(): NodeModule {
    return {
      name: this._name,
      description: this._description,
      nodes: this._nodes
    };
  }
}

/**
 * 节点模块定义辅助函数
 */
function defineNodeModule(name: string): NodeModuleBuilder {
  return new NodeModuleBuilder(name);
}

/**
 * 标签模块构建器
 */
class LabelModuleBuilder {
  private _name: string;
  private _description?: string;
  private _labels: Record<string, LabelDefinition> = {};

  constructor(name: string) {
    this._name = name;
  }

  description(desc: string): this {
    this._description = desc;
    return this;
  }

  label(name: string, definition: LabelDefinition): this {
    this._labels[name] = definition;
    return this;
  }

  labels(definitions: Record<string, LabelDefinition>): this {
    Object.assign(this._labels, definitions);
    return this;
  }

  build(): LabelModule {
    return {
      name: this._name,
      description: this._description,
      labels: this._labels
    };
  }
}

/**
 * 标签模块定义辅助函数
 */
function defineLabelModule(name: string): LabelModuleBuilder {
  return new LabelModuleBuilder(name);
}

/**
 * 插件构建器
 */
class PluginBuilder {
  private _name: string;
  private _version: string;
  private _description?: string;
  private _labelModules: LabelModule[] = [];
  private _nodeModules: NodeModule[] = [];

  constructor(name: string, version: string) {
    this._name = name;
    this._version = version;
  }

  description(desc: string): this {
    this._description = desc;
    return this;
  }

  labelModule(module: LabelModule): this {
    this._labelModules.push(module);
    return this;
  }

  labelModules(...modules: LabelModule[]): this {
    this._labelModules.push(...modules);
    return this;
  }

  nodeModule(module: NodeModule): this {
    this._nodeModules.push(module);
    return this;
  }

  nodeModules(...modules: NodeModule[]): this {
    this._nodeModules.push(...modules);
    return this;
  }

  build(): ModularPluginDefinition {
    return {
      name: this._name,
      version: this._version,
      description: this._description,
      labelModules: this._labelModules,
      nodeModules: this._nodeModules
    };
  }
}

/**
 * 插件定义辅助函数
 */
function definePlugin(name: string, version: string): PluginBuilder {
  return new PluginBuilder(name, version);
}

// ========== 使用示例：大型数学插件 ==========

// 1. 基础类型模块 (math/types.ts)
const mathTypes = defineLabelModule("types")
  .description("数学计算的基础类型")
  .labels({
    "Number": { 
      kind: "primitive", 
      baseType: "number",
      description: "数学数值"
    },
    "Vector2": { 
      kind: "composite", 
      fields: { x: "math.Number", y: "math.Number" },
      description: "二维向量"
    },
    "Matrix": { 
      kind: "composite", 
      fields: { 
        rows: "basic.Int", 
        cols: "basic.Int", 
        data: "basic.Array" 
      },
      description: "数学矩阵"
    }
  })
  .build();

// 2. 基础运算模块 (math/basic-ops.ts)
const basicOpsModule = defineNodeModule("basic-operations")
  .description("基础数学运算")
  .nodes({
    add: defineNode()
      .inputs({ a: "math.Number", b: "math.Number" })
      .outputs({ result: "math.Number" })
      .category("arithmetic")
      .description("加法运算")
      .implement((inputs) => {
        const a = inputs.a?.as<number>() ?? 0;
        const b = inputs.b?.as<number>() ?? 0;
        return {
          result: new SemanticValue("math.Number", a + b)
        };
      })
      .build(),
      
    subtract: defineNode()
      .inputs({ a: "math.Number", b: "math.Number" })
      .outputs({ result: "math.Number" })
      .category("arithmetic")
      .description("减法运算")
      .implement((inputs) => {
        const a = inputs.a?.as<number>() ?? 0;
        const b = inputs.b?.as<number>() ?? 0;
        return {
          result: new SemanticValue("math.Number", a - b)
        };
      })
      .build(),
      
    multiply: defineNode()
      .inputs({ a: "math.Number", b: "math.Number" })
      .outputs({ result: "math.Number" })
      .category("arithmetic")
      .description("乘法运算")
      .implement((inputs) => {
        const a = inputs.a?.as<number>() ?? 0;
        const b = inputs.b?.as<number>() ?? 0;
        return {
          result: new SemanticValue("math.Number", a * b)
        };
      })
      .build(),
      
    divide: defineNode()
      .inputs({ a: "math.Number", b: "math.Number" })
      .outputs({ result: "math.Number", error: "basic.String" })
      .category("arithmetic")
      .description("除法运算")
      .implement((inputs) => {
        const a = inputs.a?.as<number>() ?? 0;
        const b = inputs.b?.as<number>() ?? 0;
        
        if (b === 0) {
          return {
            result: new SemanticValue("math.Number", 0),
            error: new SemanticValue("basic.String", "Division by zero")
          };
        }
        
        return {
          result: new SemanticValue("math.Number", a / b),
          error: new SemanticValue("basic.String", "")
        };
      })
      .build()
  })
  .build();

// 3. 三角函数模块 (math/trigonometry.ts)
const trigonometryModule = defineNodeModule("trigonometry")
  .description("三角函数运算")
  .nodes({
    sin: defineNode()
      .inputs({ angle: "math.Number" })
      .outputs({ result: "math.Number" })
      .category("trigonometry")
      .description("正弦函数")
      .implement((inputs) => {
        const angle = inputs.angle?.as<number>() ?? 0;
        return {
          result: new SemanticValue("math.Number", Math.sin(angle))
        };
      })
      .build(),
      
    cos: defineNode()
      .inputs({ angle: "math.Number" })
      .outputs({ result: "math.Number" })
      .category("trigonometry")
      .description("余弦函数")
      .implement((inputs) => {
        const angle = inputs.angle?.as<number>() ?? 0;
        return {
          result: new SemanticValue("math.Number", Math.cos(angle))
        };
      })
      .build(),
      
    tan: defineNode()
      .inputs({ angle: "math.Number" })
      .outputs({ result: "math.Number" })
      .category("trigonometry")
      .description("正切函数")
      .implement((inputs) => {
        const angle = inputs.angle?.as<number>() ?? 0;
        return {
          result: new SemanticValue("math.Number", Math.tan(angle))
        };
      })
      .build()
  })
  .build();

// 4. 向量运算模块 (math/vector-ops.ts)
const vectorOpsModule = defineNodeModule("vector-operations")
  .description("向量运算")
  .nodes({
    createVector: defineNode()
      .inputs({ x: "math.Number", y: "math.Number" })
      .outputs({ vector: "math.Vector2" })
      .category("vector")
      .description("创建二维向量")
      .implement((inputs) => {
        const x = inputs.x?.as<number>() ?? 0;
        const y = inputs.y?.as<number>() ?? 0;
        return {
          vector: new SemanticValue("math.Vector2", { x, y })
        };
      })
      .build(),
      
    vectorAdd: defineNode()
      .inputs({ a: "math.Vector2", b: "math.Vector2" })
      .outputs({ result: "math.Vector2" })
      .category("vector")
      .description("向量加法")
      .implement((inputs) => {
        const a = inputs.a?.as<{x: number, y: number}>() ?? { x: 0, y: 0 };
        const b = inputs.b?.as<{x: number, y: number}>() ?? { x: 0, y: 0 };
        return {
          result: new SemanticValue("math.Vector2", { 
            x: a.x + b.x, 
            y: a.y + b.y 
          })
        };
      })
      .build(),
      
    vectorMagnitude: defineNode()
      .inputs({ vector: "math.Vector2" })
      .outputs({ magnitude: "math.Number" })
      .category("vector")
      .description("计算向量模长")
      .implement((inputs) => {
        const vector = inputs.vector?.as<{x: number, y: number}>() ?? { x: 0, y: 0 };
        const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        return {
          magnitude: new SemanticValue("math.Number", magnitude)
        };
      })
      .build()
  })
  .build();

// 5. 组装完整插件
const mathPlugin = definePlugin("math", "2.0.0")
  .description("完整的数学计算插件")
  .labelModule(mathTypes)
  .nodeModules(
    basicOpsModule,
    trigonometryModule,
    vectorOpsModule
    // 还可以继续添加更多模块...
    // statisticsModule,
    // calculusModule,
    // algebraModule,
    // geometryModule,
    // ...
  )
  .build();

// ========== 文件组织结构示例 ==========
/*
plugins/math/
├── index.ts              // 主入口，组装插件
├── types/
│   └── index.ts          // 类型定义模块
├── modules/
│   ├── basic-ops.ts      // 基础运算模块
│   ├── trigonometry.ts   // 三角函数模块
│   ├── vector-ops.ts     // 向量运算模块
│   ├── statistics.ts     // 统计模块
│   ├── calculus.ts       // 微积分模块
│   ├── algebra.ts        // 代数模块
│   └── geometry.ts       // 几何模块
└── utils/
    └── helpers.ts        // 辅助函数
*/

export {
  defineNode,
  defineNodeModule,
  defineLabelModule,
  definePlugin,
  type NodeDefinition,
  type NodeModule,
  type LabelModule,
  type ModularPluginDefinition,
  mathPlugin // 示例插件
}; 