import { InstructPreset, PresetType } from '../models/preset/Preset';
import { PresetUseCases } from '../usecases/preset/PresetUseCases';
import { MacroSystem } from './MacroSystem';

/**
 * 指令模式服务配置
 */
export interface InstructModeConfig {
  enabled: boolean;
  bindToContext: boolean;
  selectedPresetId?: string;
}

/**
 * 指令模式服务
 */
export class InstructModeService {
  private config: InstructModeConfig = {
    enabled: false,
    bindToContext: false
  };
  
  constructor(
    private presetUseCases: PresetUseCases,
    private macroSystem: MacroSystem
  ) {}
  
  /**
   * 设置配置
   * @param config 配置
   */
  setConfig(config: Partial<InstructModeConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * 获取配置
   * @returns 配置
   */
  getConfig(): InstructModeConfig {
    return { ...this.config };
  }
  
  /**
   * 获取当前激活的预设
   * @returns 预设或null
   */
  async getActivePreset(): Promise<InstructPreset | null> {
    if (!this.config.selectedPresetId) return null;
    
    return await this.presetUseCases.getPresetById(
      PresetType.INSTRUCT,
      this.config.selectedPresetId
    ) as InstructPreset | null;
  }
  
  /**
   * 选择预设
   * @param id 预设ID
   */
  async selectPreset(id: string): Promise<InstructPreset | null> {
    const preset = await this.presetUseCases.getPresetById(
      PresetType.INSTRUCT,
      id
    ) as InstructPreset | null;
    
    if (preset) {
      this.config.selectedPresetId = id;
    }
    
    return preset;
  }
  
  /**
   * 自动选择预设
   * @param modelId 模型ID
   * @returns 是否成功选择
   */
  async autoSelectPreset(modelId: string): Promise<boolean> {
    if (!this.config.enabled) return false;
    
    // 获取所有指令模式预设
    const presets = await this.presetUseCases.getAllPresets(PresetType.INSTRUCT) as InstructPreset[];
    
    // 查找匹配的预设
    for (const preset of presets) {
      if (preset.activationRegex) {
        try {
          const regex = new RegExp(preset.activationRegex);
          if (regex.test(modelId)) {
            await this.selectPreset(preset.id);
            return true;
          }
        } catch (error) {
          console.error(`预设 ${preset.name} 的激活正则表达式无效:`, error);
        }
      }
    }
    
    return false;
  }
  
  /**
   * 格式化用户输入
   * @param input 用户输入
   * @param isFirst 是否是第一次输入
   * @param context 宏上下文
   * @returns 格式化后的输入
   */
  async formatUserInput(input: string, isFirst: boolean = false, context: any = {}): Promise<string> {
    if (!this.config.enabled) return input;
    
    const preset = await this.getActivePreset();
    if (!preset) return input;
    
    // 确定使用哪个序列
    const sequence = isFirst && preset.firstInputSequence
      ? preset.firstInputSequence
      : preset.inputSequence;
    
    // 格式化输入
    let formatted = sequence;
    
    if (preset.wrap) {
      formatted += '\n' + input;
    } else {
      formatted += input;
    }
    
    // 添加后缀
    if (preset.inputSuffix) {
      if (preset.wrap) {
        formatted += '\n' + preset.inputSuffix;
      } else {
        formatted += preset.inputSuffix;
      }
    }
    
    // 处理宏
    if (preset.macro) {
      formatted = this.macroSystem.process(formatted, context);
    }
    
    return formatted;
  }
  
  /**
   * 格式化助手输出
   * @param output 助手输出
   * @param isFirst 是否是第一次输出
   * @param context 宏上下文
   * @returns 格式化后的输出
   */
  async formatAssistantOutput(output: string, isFirst: boolean = false, context: any = {}): Promise<string> {
    if (!this.config.enabled) return output;
    
    const preset = await this.getActivePreset();
    if (!preset) return output;
    
    // 确定使用哪个序列
    const sequence = isFirst && preset.firstOutputSequence
      ? preset.firstOutputSequence
      : preset.outputSequence;
    
    // 格式化输出
    let formatted = sequence;
    
    if (preset.wrap) {
      formatted += '\n' + output;
    } else {
      formatted += output;
    }
    
    // 添加后缀
    if (preset.outputSuffix) {
      if (preset.wrap) {
        formatted += '\n' + preset.outputSuffix;
      } else {
        formatted += preset.outputSuffix;
      }
    }
    
    // 处理宏
    if (preset.macro) {
      formatted = this.macroSystem.process(formatted, context);
    }
    
    return formatted;
  }
  
  /**
   * 格式化系统提示
   * @param systemPrompt 系统提示
   * @param context 宏上下文
   * @returns 格式化后的系统提示
   */
  async formatSystemPrompt(systemPrompt: string, context: any = {}): Promise<string> {
    if (!this.config.enabled || !systemPrompt) return systemPrompt;
    
    const preset = await this.getActivePreset();
    if (!preset) return systemPrompt;
    
    const separator = preset.wrap ? '\n' : '';
    
    // 格式化系统提示
    let formatted = systemPrompt;
    
    // 添加前缀
    if (preset.systemSequence) {
      formatted = preset.systemSequence + separator + formatted;
    }
    
    // 添加后缀
    if (preset.systemSuffix) {
      formatted = formatted + separator + preset.systemSuffix;
    }
    
    // 处理宏
    if (preset.macro) {
      formatted = this.macroSystem.process(formatted, context);
    }
    
    return formatted;
  }
  
  /**
   * 获取停止序列
   * @returns 停止序列列表
   */
  async getStopSequences(): Promise<string[]> {
    if (!this.config.enabled) return [];
    
    const preset = await this.getActivePreset();
    if (!preset) return [];
    
    const stopSequences: string[] = [];
    
    // 添加停止序列
    if (preset.stopSequence) {
      stopSequences.push(preset.stopSequence);
    }
    
    // 添加输入序列作为停止序列
    if (preset.inputSequence) {
      stopSequences.push(preset.wrap ? '\n' + preset.inputSequence : preset.inputSequence);
    }
    
    return stopSequences;
  }
  
  /**
   * 获取指令模式宏
   * @returns 宏列表
   */
  async getInstructMacros(): Promise<{ key: string; value: string; enabled: boolean }[]> {
    const preset = await this.getActivePreset();
    if (!preset) return [];
    
    return [
      { key: 'instructInput', value: preset.inputSequence, enabled: true },
      { key: 'instructOutput', value: preset.outputSequence, enabled: true },
      { key: 'instructUserSuffix', value: preset.inputSuffix, enabled: true },
      { key: 'instructSeparator', value: preset.outputSuffix, enabled: true },
      { key: 'instructSystem', value: preset.systemSequence, enabled: true },
      { key: 'instructSystemSuffix', value: preset.systemSuffix, enabled: true },
      { key: 'instructFirstInput', value: preset.firstInputSequence || preset.inputSequence, enabled: true },
      { key: 'instructFirstOutput', value: preset.firstOutputSequence || preset.outputSequence, enabled: true },
      { key: 'instructStop', value: preset.stopSequence, enabled: true }
    ];
  }
} 