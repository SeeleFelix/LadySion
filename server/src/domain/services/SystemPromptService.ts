import { SystemPromptPreset, PresetType } from '../models/preset/Preset';
import { PresetUseCases } from '../usecases/preset/PresetUseCases';
import { MacroSystem } from './MacroSystem';

/**
 * 系统提示词服务配置
 */
export interface SystemPromptConfig {
  enabled: boolean;
  selectedPresetId?: string;
}

/**
 * 默认的系统提示词内容
 */
export const DEFAULT_SYSTEM_PROMPT = '用自然、真实的方式回复{{user}}。你是{{char}}，创造性地回答所有问题。';

/**
 * 系统提示词服务
 */
export class SystemPromptService {
  private config: SystemPromptConfig = {
    enabled: true
  };
  
  constructor(
    private presetUseCases: PresetUseCases,
    private macroSystem: MacroSystem
  ) {}
  
  /**
   * 设置配置
   * @param config 配置
   */
  setConfig(config: Partial<SystemPromptConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * 获取配置
   * @returns 配置
   */
  getConfig(): SystemPromptConfig {
    return { ...this.config };
  }
  
  /**
   * 获取当前激活的预设
   * @returns 预设或null
   */
  async getActivePreset(): Promise<SystemPromptPreset | null> {
    if (!this.config.selectedPresetId) return null;
    
    return await this.presetUseCases.getPresetById(
      PresetType.SYSTEM_PROMPT,
      this.config.selectedPresetId
    ) as SystemPromptPreset | null;
  }
  
  /**
   * 选择预设
   * @param id 预设ID
   */
  async selectPreset(id: string): Promise<SystemPromptPreset | null> {
    const preset = await this.presetUseCases.getPresetById(
      PresetType.SYSTEM_PROMPT,
      id
    ) as SystemPromptPreset | null;
    
    if (preset) {
      this.config.selectedPresetId = id;
    }
    
    return preset;
  }
  
  /**
   * 获取系统提示词内容
   * @returns 系统提示词内容
   */
  async getContent(): Promise<string> {
    if (!this.config.enabled) return '';
    
    const preset = await this.getActivePreset();
    return preset?.content || DEFAULT_SYSTEM_PROMPT;
  }
  
  /**
   * 按分类获取预设
   * @param category 分类
   * @returns 预设列表
   */
  async getPresetsByCategory(category: string): Promise<SystemPromptPreset[]> {
    const presets = await this.presetUseCases.getAllPresets(PresetType.SYSTEM_PROMPT) as SystemPromptPreset[];
    return presets.filter(preset => preset.category === category);
  }
  
  /**
   * 按标签获取预设
   * @param tag 标签
   * @returns 预设列表
   */
  async getPresetsByTag(tag: string): Promise<SystemPromptPreset[]> {
    const presets = await this.presetUseCases.getAllPresets(PresetType.SYSTEM_PROMPT) as SystemPromptPreset[];
    return presets.filter(preset => preset.tags?.includes(tag));
  }
  
  /**
   * 获取系统提示词宏
   * @returns 宏列表
   */
  async getSystemPromptMacros(): Promise<{ key: string; value: string; enabled: boolean }[]> {
    const content = await this.getContent();
    
    return [
      { key: 'systemPrompt', value: content, enabled: this.config.enabled },
      { key: 'defaultSystemPrompt', value: content, enabled: this.config.enabled }
    ];
  }
  
  /**
   * 处理系统提示词
   * @param context 宏上下文
   * @returns 处理后的系统提示词
   */
  async processSystemPrompt(context: any = {}): Promise<string> {
    if (!this.config.enabled) return '';
    
    const content = await this.getContent();
    if (!content) return '';
    
    // 处理宏
    return this.macroSystem.process(content, context);
  }
} 