// 极端声明式宏风格插件API

// 方案1: 纯配置DSL - 像Rust宏一样的声明式语法
type PluginMacro = {
  nodes: {
    [nodeName: string]: {
      in: Record<string, TypeName>;
      out: Record<string, TypeName>;
      body: string; // JavaScript代码字符串
      meta?: {
        description?: string;
        category?: string;
        icon?: string;
      };
    };
  };
  meta?: {
    name: string;
    version: string;
    author: string;
  };
};

type TypeName = "number" | "string" | "boolean" | "trigger" | "any";

// 使用示例 - 纯声明式，像配置文件
const MathPluginMacro: PluginMacro = {
  meta: {
    name: "BasicMath",
    version: "1.0.0",
    author: "玲珑"
  },
  nodes: {
    add: {
      in: { a: "number", b: "number" },
      out: { result: "number" },
      body: `return { result: inputs.a + inputs.b }`
    },
    multiply: {
      in: { a: "number", b: "number" },
      out: { result: "number" },
      body: `return { result: inputs.a * inputs.b }`
    },
    fibonacci: {
      in: { n: "number" },
      out: { result: "number", sequence: "string" },
      body: `
        const fib = (n) => n <= 1 ? n : fib(n-1) + fib(n-2);
        const sequence = [];
        for(let i = 0; i <= inputs.n; i++) {
          sequence.push(fib(i));
        }
        return { 
          result: fib(inputs.n), 
          sequence: sequence.join(',') 
        };
      `
    }
  }
};

// 方案2: 类型级DSL - 在类型系统中定义节点
type DefineNode<Name extends string, Inputs, Outputs, Body extends string> = {
  [K in Name]: {
    inputs: Inputs;
    outputs: Outputs;
    implement: Body;
  };
};

// 类型级插件组合器
type CombineNodes<T extends Record<string, any>[]> = T extends [infer First, ...infer Rest]
  ? First & CombineNodes<Rest extends Record<string, any>[] ? Rest : []>
  : {};

// 使用类型级DSL
type MathNodes = CombineNodes<[
  DefineNode<"add", { a: number; b: number }, { result: number }, "inputs.a + inputs.b">,
  DefineNode<"sub", { a: number; b: number }, { result: number }, "inputs.a - inputs.b">,
  DefineNode<"pow", { base: number; exp: number }, { result: number }, "Math.pow(inputs.base, inputs.exp)">
]>;

// 方案3: 模板元编程 - 用模板字符串生成代码
type GenerateNodeCode<
  Name extends string,
  Inputs extends Record<string, string>,
  Outputs extends Record<string, string>,
  Logic extends string
> = `
export const ${Name} = {
  inputs: ${JSON.stringify(Inputs)},
  outputs: ${JSON.stringify(Outputs)},
  implement: (inputs, trigger) => {
    ${Logic}
  }
};
`;

// 编译时代码生成
type MathPluginCode = 
  | GenerateNodeCode<"add", { a: "number", b: "number" }, { result: "number" }, "return { result: inputs.a + inputs.b };">
  | GenerateNodeCode<"multiply", { a: "number", b: "number" }, { result: "number" }, "return { result: inputs.a * inputs.b };">
  | GenerateNodeCode<"divide", { a: "number", b: "number" }, { result: "number", error: "string" }, `
    if (inputs.b === 0) return { result: 0, error: "Division by zero" };
    return { result: inputs.a / inputs.b, error: "" };
  `>;

// 方案4: 声明式配置 + 编译器转换
interface MacroConfig {
  patterns: {
    [pattern: string]: {
      template: string;
      variables: string[];
    };
  };
}

const mathMacroConfig: MacroConfig = {
  patterns: {
    "binary_math": {
      template: `
        export const {{name}} = {
          inputs: { a: "number", b: "number" },
          outputs: { result: "number" },
          implement: (inputs) => ({ result: inputs.a {{op}} inputs.b })
        };
      `,
      variables: ["name", "op"]
    },
    "unary_math": {
      template: `
        export const {{name}} = {
          inputs: { x: "number" },
          outputs: { result: "number" },
          implement: (inputs) => ({ result: Math.{{func}}(inputs.x) })
        };
      `,
      variables: ["name", "func"]
    }
  }
};

// 使用宏模式
const mathNodes = [
  { pattern: "binary_math", name: "add", op: "+" },
  { pattern: "binary_math", name: "subtract", op: "-" },
  { pattern: "binary_math", name: "multiply", op: "*" },
  { pattern: "binary_math", name: "divide", op: "/" },
  { pattern: "unary_math", name: "sin", func: "sin" },
  { pattern: "unary_math", name: "cos", func: "cos" },
  { pattern: "unary_math", name: "sqrt", func: "sqrt" }
];

// 方案5: 最极端 - 图形化DSL转代码
type VisualNodeDefinition = {
  id: string;
  type: "input" | "output" | "compute" | "condition";
  position: [number, number];
  data: any;
  connections?: {
    from: string;
    to: string;
    fromPort: string;
    toPort: string;
  }[];
};

type VisualPlugin = {
  name: string;
  nodes: VisualNodeDefinition[];
  meta: {
    description: string;
    visual: true;
  };
};

// 图形化插件定义
const visualMathPlugin: VisualPlugin = {
  name: "VisualMath",
  nodes: [
    {
      id: "input_a",
      type: "input",
      position: [0, 0],
      data: { name: "a", type: "number" }
    },
    {
      id: "input_b", 
      type: "input",
      position: [0, 100],
      data: { name: "b", type: "number" }
    },
    {
      id: "add_node",
      type: "compute", 
      position: [200, 50],
      data: { operation: "add" }
    },
    {
      id: "output_result",
      type: "output",
      position: [400, 50], 
      data: { name: "result", type: "number" }
    }
  ]
};

// 方案6: 声明式约束求解器
type ConstraintBasedNode = {
  constraints: {
    inputs: Record<string, { type: string; min?: number; max?: number; }>;
    outputs: Record<string, { type: string; constraint?: string; }>;
    relations: Array<{
      type: "equation" | "condition" | "mapping";
      expression: string;
    }>;
  };
  solver: "algebraic" | "numeric" | "symbolic";
};

// 约束求解风格的节点定义
const constraintMathNode: ConstraintBasedNode = {
  constraints: {
    inputs: {
      x: { type: "number", min: -100, max: 100 },
      y: { type: "number", min: -100, max: 100 }
    },
    outputs: {
      magnitude: { type: "number", constraint: "magnitude >= 0" },
      angle: { type: "number", constraint: "angle >= 0 && angle < 2*PI" }
    },
    relations: [
      { type: "equation", expression: "magnitude = sqrt(x*x + y*y)" },
      { type: "equation", expression: "angle = atan2(y, x)" }
    ]
  },
  solver: "algebraic"
};

// 编译器函数 - 把各种声明式配置转换为实际代码
function compilePlugin(macro: PluginMacro): string {
  let result = `// Generated plugin: ${macro.meta?.name}\n\n`;
  
  Object.entries(macro.nodes).forEach(([nodeName, nodeDef]) => {
    result += `export const ${nodeName} = {\n`;
    result += `  inputs: ${JSON.stringify(nodeDef.in)},\n`;
    result += `  outputs: ${JSON.stringify(nodeDef.out)},\n`;
    result += `  implement: (inputs, trigger) => {\n`;
    result += `    ${nodeDef.body}\n`;
    result += `  }\n`;
    result += `};\n\n`;
  });
  
  return result;
}

function compileFromPattern(config: MacroConfig, instances: any[]): string {
  let result = "// Generated from macro patterns\n\n";
  
  instances.forEach(instance => {
    const pattern = config.patterns[instance.pattern];
    let code = pattern.template;
    
    pattern.variables.forEach(variable => {
      const regex = new RegExp(`{{${variable}}}`, 'g');
      code = code.replace(regex, instance[variable]);
    });
    
    result += code + "\n";
  });
  
  return result;
}

// 输出示例
console.log("=== 编译后的代码 ===");
console.log(compilePlugin(MathPluginMacro));
console.log(compileFromPattern(mathMacroConfig, mathNodes));

export {
  type PluginMacro,
  type MacroConfig,
  type VisualPlugin,
  type ConstraintBasedNode,
  compilePlugin,
  compileFromPattern,
  MathPluginMacro,
  mathMacroConfig,
  visualMathPlugin,
  constraintMathNode
}; 