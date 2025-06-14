// 声明式插件API设计示例

// 方案1: 纯对象声明式
type NodeDefinition<I extends Record<string, any>, O extends Record<string, any>> = {
  inputs: I;
  outputs: O;
  implement: (inputs: I, trigger?: any) => O;
  description?: string;
};

type PluginDefinition = {
  name: string;
  version?: string;
  nodes: Record<string, NodeDefinition<any, any>>;
};

// 使用示例 - 完全声明式
const MathPlugin: PluginDefinition = {
  name: "BasicMath",
  version: "1.0.0",
  nodes: {
    add: {
      inputs: { a: 0 as number, b: 0 as number },
      outputs: { result: 0 as number },
      implement: ({ a, b }) => ({ result: a + b }),
      description: "Add two numbers"
    },
    multiply: {
      inputs: { a: 0 as number, b: 0 as number },
      outputs: { result: 0 as number },
      implement: ({ a, b }) => ({ result: a * b })
    },
    compare: {
      inputs: { a: 0 as number, b: 0 as number },
      outputs: { equal: false as boolean, greater: false as boolean },
      implement: ({ a, b }) => ({ 
        equal: a === b, 
        greater: a > b 
      })
    }
  }
};

// 方案2: 模板宏式声明
type MathOperation = "add" | "subtract" | "multiply" | "divide";
type BinaryMathTemplate<Op extends MathOperation> = {
  inputs: { a: number; b: number };
  outputs: { result: number };
  implement: (inputs: { a: number; b: number }) => { result: number };
};

// 批量生成数学运算节点
function createMathNodes<T extends readonly MathOperation[]>(
  operations: T
): { [K in T[number]]: BinaryMathTemplate<K> } {
  const nodes = {} as any;
  
  operations.forEach(op => {
    nodes[op] = {
      inputs: { a: 0 as number, b: 0 as number },
      outputs: { result: 0 as number },
      implement: ({ a, b }: { a: number; b: number }) => {
        switch (op) {
          case "add": return { result: a + b };
          case "subtract": return { result: a - b };
          case "multiply": return { result: a * b };
          case "divide": return { result: a / b };
          default: throw new Error(`Unknown operation: ${op}`);
        }
      }
    };
  });
  
  return nodes;
}

// 使用模板批量创建
const MathPluginFromTemplate: PluginDefinition = {
  name: "TemplateMath",
  nodes: createMathNodes(["add", "subtract", "multiply", "divide"] as const)
};

// 方案3: DSL + 编译时宏
type NodeSpec = {
  in: Record<string, any>;
  out: Record<string, any>;
  fn: string; // JavaScript表达式字符串
};

type PluginSpec = Record<string, NodeSpec>;

// DSL示例
const MathSpec: PluginSpec = {
  add: {
    in: { a: "number", b: "number" },
    out: { result: "number" },
    fn: "({ a, b }) => ({ result: a + b })"
  },
  power: {
    in: { base: "number", exponent: "number" },
    out: { result: "number" },
    fn: "({ base, exponent }) => ({ result: Math.pow(base, exponent) })"
  },
  factorial: {
    in: { n: "number" },
    out: { result: "number" },
    fn: `({ n }) => ({ 
      result: n <= 1 ? 1 : Array.from({length: n}, (_, i) => i + 1).reduce((a, b) => a * b, 1)
    })`
  }
};

// 编译时转换DSL为实际实现
function compilePlugin(spec: PluginSpec): PluginDefinition {
  const nodes: Record<string, NodeDefinition<any, any>> = {};
  
  for (const [nodeName, nodeSpec] of Object.entries(spec)) {
    // 创建类型化的输入/输出对象
    const inputExample = Object.fromEntries(
      Object.entries(nodeSpec.in).map(([key, type]) => [
        key, 
        type === "number" ? 0 : type === "string" ? "" : type === "boolean" ? false : null
      ])
    );
    
    const outputExample = Object.fromEntries(
      Object.entries(nodeSpec.out).map(([key, type]) => [
        key,
        type === "number" ? 0 : type === "string" ? "" : type === "boolean" ? false : null
      ])
    );
    
    // 编译函数字符串为实际函数
    const implementFn = eval(nodeSpec.fn);
    
    nodes[nodeName] = {
      inputs: inputExample,
      outputs: outputExample,
      implement: implementFn
    };
  }
  
  return {
    name: "CompiledMath",
    nodes
  };
}

const CompiledMathPlugin = compilePlugin(MathSpec);

// 方案4: 装饰器式声明（实验性）
interface PluginClass {
  pluginName: string;
  pluginVersion?: string;
}

// 模拟装饰器效果的函数
function defineNode<I extends Record<string, any>, O extends Record<string, any>>(
  inputs: I,
  outputs: O
) {
  return function <T extends (inputs: I, trigger?: any) => O>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    // 在实际装饰器中，这里会注册节点信息
    target._nodeDefinitions = target._nodeDefinitions || {};
    target._nodeDefinitions[propertyKey] = {
      inputs,
      outputs,
      implement: descriptor.value
    };
  };
}

// 使用装饰器风格
class DeclarativeMathPlugin implements PluginClass {
  pluginName = "DeclarativeMath";
  pluginVersion = "1.0.0";
  
  // @defineNode({ a: 0 as number, b: 0 as number }, { result: 0 as number })
  add(inputs: { a: number; b: number }): { result: number } {
    return { result: inputs.a + inputs.b };
  }
  
  // @defineNode({ a: 0 as number, b: 0 as number }, { result: 0 as number })
  multiply(inputs: { a: number; b: number }): { result: number } {
    return { result: inputs.a * inputs.b };
  }
}

// 导出示例
export {
  MathPlugin,
  MathPluginFromTemplate,
  CompiledMathPlugin,
  DeclarativeMathPlugin,
  type PluginDefinition,
  type NodeDefinition,
  compilePlugin
}; 