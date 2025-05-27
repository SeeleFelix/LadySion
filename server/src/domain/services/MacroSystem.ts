import { MacroDescription } from '../models/preset/Preset';

/**
 * 宏定义接口
 */
export interface MacroDefinition {
  name: string;
  pattern: RegExp;
  replacer: (match: string, ...args: any[]) => string;
  description?: string;
}

/**
 * 宏处理上下文接口
 */
export interface MacroContext {
  user?: string;               // 用户名
  char?: string;              // 角色名  
  date?: string;              // 当前日期
  time?: string;              // 当前时间
  systemPrompt?: string;      // 系统提示词
  chatStart?: string;         // 对话开始标记
  exampleSeparator?: string;  // 示例分隔符
  
  // 指令模式相关
  instructInput?: string;     // 指令输入前缀
  instructOutput?: string;    // 指令输出前缀
  instructUserSuffix?: string;    // 指令用户后缀
  instructSeparator?: string;     // 指令分隔符
  instructSystem?: string;        // 指令系统前缀
  instructSystemSuffix?: string;  // 指令系统后缀
  instructFirstInput?: string;    // 指令首次输入
  instructFirstOutput?: string;   // 指令首次输出
  instructStop?: string;          // 指令停止序列
  
  // 自定义上下文
  [key: string]: any;
}

/**
 * 宏处理器接口
 */
export interface MacroProcessor {
  name: string;
  description: string;
  syntax?: string;
  example?: string;
  category?: string;
  process(args: string[], context: MacroContext): string;
}

/**
 * 宏系统服务
 */
export class MacroSystem {
  private macros = new Map<string, MacroProcessor>();
  
  constructor() {
    this.registerDefaultMacros();
  }
  
  /**
   * 注册宏
   * @param macro 宏定义
   */
  registerMacro(processor: MacroProcessor): void {
    this.macros.set(processor.name, processor);
  }
  
  /**
   * 注册默认宏
   */
  registerDefaultMacros(): void {
    // 基础宏
    this.registerMacro({
      name: 'user',
      description: '用户名称',
      category: 'basic',
      process: (args, context) => context.user || 'User'
    });
    
    this.registerMacro({
      name: 'char',
      description: '角色名称',
      category: 'basic',
      process: (args, context) => context.char || 'Assistant'
    });
    
    this.registerMacro({
      name: 'date',
      description: '当前日期 (YYYY-MM-DD)',
      category: 'datetime',
      process: () => new Date().toISOString().split('T')[0]
    });
    
    this.registerMacro({
      name: 'time',
      description: '当前时间 (HH:MM:SS)',
      category: 'datetime',
      process: () => new Date().toTimeString().split(' ')[0]
    });
    
    this.registerMacro({
      name: 'datetime',
      description: '当前日期和时间',
      category: 'datetime',
      process: () => new Date().toLocaleString()
    });
    
    this.registerMacro({
      name: 'timestamp',
      description: '当前时间戳',
      category: 'datetime',
      process: () => Date.now().toString()
    });
    
    // 随机宏
    this.registerMacro({
      name: 'random',
      description: '从选项中随机选择一个',
      syntax: '{{random::选项1::选项2::选项3}}',
      example: '{{random::你好::嗨::早上好}}',
      category: 'random',
      process: (args) => {
        if (args.length === 0) return '';
        return args[Math.floor(Math.random() * args.length)];
      }
    });
    
    this.registerMacro({
      name: 'rand',
      description: '生成指定范围内的随机数',
      syntax: '{{rand:最小值,最大值}}',
      example: '{{rand:1,100}}',
      category: 'random',
      process: (args) => {
        if (args.length !== 1) return '0';
        const [range] = args;
        const [min, max] = range.split(',').map(Number);
        if (isNaN(min) || isNaN(max)) return '0';
        return Math.floor(Math.random() * (max - min + 1) + min).toString();
      }
    });
    
    // 系统宏
    this.registerMacro({
      name: 'systemPrompt',
      description: '系统提示词内容',
      category: 'system',
      process: (args, context) => context.systemPrompt || ''
    });
    
    this.registerMacro({
      name: 'chatStart',
      description: '对话开始标记',
      category: 'system',
      process: (args, context) => context.chatStart || ''
    });
    
    this.registerMacro({
      name: 'exampleSeparator',
      description: '示例分隔符',
      category: 'system',
      process: (args, context) => context.exampleSeparator || ''
    });
    
    // 指令模式宏
    this.registerMacro({
      name: 'instructInput',
      description: '指令模式用户输入前缀',
      category: 'instruct',
      process: (args, context) => context.instructInput || ''
    });
    
    this.registerMacro({
      name: 'instructOutput',
      description: '指令模式助手输出前缀',
      category: 'instruct',
      process: (args, context) => context.instructOutput || ''
    });
    
    this.registerMacro({
      name: 'instructUserSuffix',
      description: '指令模式用户输入后缀',
      category: 'instruct',
      process: (args, context) => context.instructUserSuffix || ''
    });
    
    this.registerMacro({
      name: 'instructSeparator',
      description: '指令模式分隔符',
      category: 'instruct',
      process: (args, context) => context.instructSeparator || ''
    });
    
    this.registerMacro({
      name: 'instructSystem',
      description: '指令模式系统前缀',
      category: 'instruct',
      process: (args, context) => context.instructSystem || ''
    });
    
    this.registerMacro({
      name: 'instructSystemSuffix',
      description: '指令模式系统后缀',
      category: 'instruct',
      process: (args, context) => context.instructSystemSuffix || ''
    });
    
    this.registerMacro({
      name: 'instructFirstInput',
      description: '指令模式首次输入前缀',
      category: 'instruct',
      process: (args, context) => context.instructFirstInput || context.instructInput || ''
    });
    
    this.registerMacro({
      name: 'instructFirstOutput',
      description: '指令模式首次输出前缀',
      category: 'instruct',
      process: (args, context) => context.instructFirstOutput || context.instructOutput || ''
    });
    
    this.registerMacro({
      name: 'instructStop',
      description: '指令模式停止序列',
      category: 'instruct',
      process: (args, context) => context.instructStop || ''
    });
    
    // 工具宏
    this.registerMacro({
      name: 'upper',
      description: '转换为大写',
      syntax: '{{upper:文本}}',
      example: '{{upper:hello}} -> HELLO',
      category: 'tools',
      process: (args) => args.join('').toUpperCase()
    });
    
    this.registerMacro({
      name: 'lower',
      description: '转换为小写',
      syntax: '{{lower:文本}}',
      example: '{{lower:HELLO}} -> hello',
      category: 'tools',
      process: (args) => args.join('').toLowerCase()
    });
    
    this.registerMacro({
      name: 'trim',
      description: '去除首尾空白',
      syntax: '{{trim:文本}}',
      category: 'tools',
      process: (args) => args.join('').trim()
    });
    
    this.registerMacro({
      name: 'length',
      description: '获取文本长度',
      syntax: '{{length:文本}}',
      category: 'tools',
      process: (args) => args.join('').length.toString()
    });
    
    // 条件宏
    this.registerMacro({
      name: 'if',
      description: '条件判断',
      syntax: '{{if:条件:真值:假值}}',
      example: '{{if:{{user}}:欢迎{{user}}:欢迎访客}}',
      category: 'conditional',
      process: (args) => {
        if (args.length < 2) return '';
        const [condition, trueValue, falseValue = ''] = args;
        return condition && condition.trim() ? trueValue : falseValue;
      }
    });
  }
  
  /**
   * 注册指令模式宏
   * @param instructMacros 指令模式宏列表
   */
  registerInstructMacros(instructMacros: { key: string; value: string; enabled: boolean }[]): void {
    for (const macro of instructMacros) {
      if (macro.enabled) {
        this.registerMacro({
          name: macro.key,
          description: `指令模式：${macro.key}`,
          category: 'instruct',
          process: () => macro.value
        });
      }
    }
  }
  
  /**
   * 注册上下文模板宏
   * @param contextMacros 上下文模板宏列表
   */
  registerContextMacros(contextMacros: { key: string; value: string; enabled: boolean }[]): void {
    for (const macro of contextMacros) {
      if (macro.enabled) {
        this.registerMacro({
          name: macro.key,
          description: `上下文模板：${macro.key}`,
          category: 'context',
          process: () => macro.value
        });
      }
    }
  }
  
  /**
   * 处理文本中的宏
   * @param text 输入文本
   * @param context 宏上下文
   * @returns 处理后的文本
   */
  process(text: string, context: MacroContext = {}): string {
    if (!text) return text;
    
    // 匹配 {{宏名}} 或 {{宏名:参数1:参数2}}
    const macroRegex = /\{\{([^}]+)\}\}/g;
    
    return text.replace(macroRegex, (match, content) => {
      try {
        // 解析宏名和参数
        const parts = content.split(':');
        const macroName = parts[0].trim();
        const args = parts.slice(1);

        // 查找宏处理器
        const processor = this.macros.get(macroName);
        if (!processor) {
          console.warn(`未知的宏: ${macroName}`);
          return match; // 保持原文
        }

        // 执行宏处理
        return processor.process(args, context);
      } catch (error) {
        console.error(`处理宏 ${content} 时出错:`, error);
        return match; // 保持原文
      }
    });
  }
  
  /**
   * 获取所有宏的描述
   * @returns 宏描述列表
   */
  getMacroDescriptions(): MacroDescription[] {
    return Array.from(this.macros.values()).map(macro => ({
      name: macro.name,
      description: macro.description,
      syntax: macro.syntax,
      example: macro.example,
      category: macro.category
    }));
  }
  
  /**
   * 递归处理宏（支持宏嵌套）
   */
  processRecursive(text: string, context: MacroContext = {}, maxDepth: number = 5): string {
    if (!text || maxDepth <= 0) return text;

    const processed = this.process(text, context);
    
    // 如果还有未处理的宏，继续递归处理
    if (processed !== text && processed.includes('{{')) {
      return this.processRecursive(processed, context, maxDepth - 1);
    }
    
    return processed;
  }
  
  /**
   * 验证宏语法
   */
  validateMacroSyntax(text: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const macroRegex = /\{\{([^}]+)\}\}/g;
    let match;

    while ((match = macroRegex.exec(text)) !== null) {
      const content = match[1];
      const parts = content.split(':');
      const macroName = parts[0].trim();

      if (!this.macros.has(macroName)) {
        errors.push(`未知的宏: ${macroName}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * 获取文本中使用的宏
   */
  getUsedMacros(text: string): string[] {
    const usedMacros: string[] = [];
    const macroRegex = /\{\{([^}:]+)/g;
    let match;

    while ((match = macroRegex.exec(text)) !== null) {
      const macroName = match[1].trim();
      if (!usedMacros.includes(macroName)) {
        usedMacros.push(macroName);
      }
    }

    return usedMacros;
  }
} 