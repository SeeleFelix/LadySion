import { ContextPreset, PresetType } from '../models/preset/Preset';
import { PresetUseCases } from '../usecases/preset/PresetUseCases';
import { MacroSystem } from './MacroSystem';

/**
 * 上下文模板服务配置
 */
export interface ContextTemplateConfig {
  selectedPresetId?: string;
}

/**
 * 默认的上下文模板常量
 */
export const DEFAULT_STORY_STRING = '{{char}}的人物设定: {{persona}}\n\n{{#if scenario}}场景: {{scenario}}{{/if}}\n{{#if personality}}{{char}}的性格: {{personality}}{{/if}}\n\n';
export const DEFAULT_CHAT_START = '<开始对话>';
export const DEFAULT_EXAMPLE_SEPARATOR = '\n---\n';

/**
 * 上下文模板服务
 */
export class ContextTemplateService {
  private config: ContextTemplateConfig = {};
  
  constructor(
    private presetUseCases: PresetUseCases,
    private macroSystem: MacroSystem
  ) {}
  
  /**
   * 设置配置
   * @param config 配置
   */
  setConfig(config: Partial<ContextTemplateConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * 获取配置
   * @returns 配置
   */
  getConfig(): ContextTemplateConfig {
    return { ...this.config };
  }
  
  /**
   * 获取当前激活的预设
   * @returns 预设或null
   */
  async getActivePreset(): Promise<ContextPreset | null> {
    if (!this.config.selectedPresetId) return null;
    
    return await this.presetUseCases.getPresetById(
      PresetType.CONTEXT,
      this.config.selectedPresetId
    ) as ContextPreset | null;
  }
  
  /**
   * 选择预设
   * @param id 预设ID
   */
  async selectPreset(id: string): Promise<ContextPreset | null> {
    const preset = await this.presetUseCases.getPresetById(
      PresetType.CONTEXT,
      id
    ) as ContextPreset | null;
    
    if (preset) {
      this.config.selectedPresetId = id;
    }
    
    return preset;
  }
  
  /**
   * 获取故事字符串
   * @returns 故事字符串
   */
  async getStoryString(): Promise<string> {
    const preset = await this.getActivePreset();
    return preset?.contextTemplate || DEFAULT_STORY_STRING;
  }
  
  /**
   * 获取对话开始标记
   * @returns 对话开始标记
   */
  async getChatStart(): Promise<string> {
    const preset = await this.getActivePreset();
    return preset?.chatStart || DEFAULT_CHAT_START;
  }
  
  /**
   * 获取示例分隔符
   * @returns 示例分隔符
   */
  async getExampleSeparator(): Promise<string> {
    const preset = await this.getActivePreset();
    return preset?.exampleSeparator || DEFAULT_EXAMPLE_SEPARATOR;
  }
  
  /**
   * 获取停止字符串
   * @param names 角色名称列表
   * @returns 停止字符串列表
   */
  async getStopStrings(names: string[] = []): Promise<string[]> {
    const preset = await this.getActivePreset();
    if (!preset) return [];
    
    const stopStrings: string[] = [];
    
    // 如果有角色名称，添加为停止字符串
    if (names.length > 0) {
      names.forEach(name => stopStrings.push(`${name}:`));
    }
    
    return stopStrings;
  }
  
  /**
   * 获取上下文模板宏
   * @returns 宏列表
   */
  async getContextMacros(): Promise<{ key: string; value: string; enabled: boolean }[]> {
    const storyString = await this.getStoryString();
    const chatStart = await this.getChatStart();
    const exampleSeparator = await this.getExampleSeparator();
    
    return [
      { key: 'storyString', value: storyString, enabled: true },
      { key: 'chatStart', value: chatStart, enabled: true },
      { key: 'exampleSeparator', value: exampleSeparator, enabled: true }
    ];
  }
  
  /**
   * 处理上下文模板文本
   * @param text 输入文本
   * @param context 宏上下文
   * @returns 处理后的文本
   */
  async processTemplate(text: string, context: any = {}): Promise<string> {
    if (!text) return '';
    
    // 注册上下文模板宏
    const contextMacros = await this.getContextMacros();
    this.macroSystem.registerContextMacros(contextMacros);
    
    // 处理宏
    return this.macroSystem.process(text, context);
  }
} 