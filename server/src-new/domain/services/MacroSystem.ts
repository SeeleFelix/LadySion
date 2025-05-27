/**
 * 宏处理上下文接口
 */
export interface MacroContext {
  user?: string;
  char?: string;
  date?: string;
  time?: string;
  systemPrompt?: string;
  chatStart?: string;
  exampleSeparator?: string;
  instructInput?: string;
  instructOutput?: string;
  instructUserSuffix?: string;
  instructSeparator?: string;
  instructSystem?: string;
  instructSystemSuffix?: string;
  instructFirstInput?: string;
  instructFirstOutput?: string;
  instructStop?: string;
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
 * 宏描述接口
 */
export interface MacroDescription {
  name: string;
  description: string;
  syntax?: string;
  example?: string;
  category?: string;
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
  }
  
  /**
   * 处理文本中的宏
   */
  process(text: string, context: MacroContext = {}): string {
    if (!text) return '';
    
    // 匹配 {{macroName}} 或 {{macroName:arg1,arg2}} 或 {{macroName::arg1::arg2}}
    const macroPattern = /\{\{([^}]+)\}\}/g;
    
    return text.replace(macroPattern, (match, content) => {
      try {
        // 解析宏名称和参数
        let macroName: string;
        let args: string[] = [];
        
        if (content.includes('::')) {
          // 使用 :: 分隔参数
          [macroName, ...args] = content.split('::');
        } else if (content.includes(':')) {
          // 使用 : 分隔参数（逗号分隔多个参数）
          const parts = content.split(':');
          macroName = parts[0];
          if (parts.length > 1) {
            args = parts[1].split(',').map(arg => arg.trim());
          }
        } else {
          // 没有参数
          macroName = content;
        }
        
        const processor = this.macros.get(macroName.trim());
        if (!processor) {
          return match; // 保留原始文本
        }
        
        return processor.process(args, context);
      } catch (error) {
        console.warn(`宏处理失败: ${match}`, error);
        return match; // 保留原始文本
      }
    });
  }
  
  /**
   * 获取宏描述列表
   */
  getMacroDescriptions(): MacroDescription[] {
    return Array.from(this.macros.values()).map(processor => ({
      name: processor.name,
      description: processor.description,
      syntax: processor.syntax,
      example: processor.example,
      category: processor.category
    }));
  }
  
  /**
   * 验证宏语法
   */
  validateMacroSyntax(text: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const macroPattern = /\{\{([^}]+)\}\}/g;
    let match;
    
    while ((match = macroPattern.exec(text)) !== null) {
      const content = match[1];
      const macroName = content.split(/[:]/)[0].trim();
      
      if (!this.macros.has(macroName)) {
        errors.push(`未知宏: ${macroName}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
} 