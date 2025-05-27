import { PresetRepository } from '../ports/PresetRepository';
import { PostHistoryInstructionsPreset, PresetType } from '../models/preset/Preset';
import { MacroSystem, MacroContext } from './MacroSystem';

/**
 * 后历史指令服务
 */
export class PostHistoryInstructionsService {
  constructor(
    private presetRepository: PresetRepository,
    private macroSystem: MacroSystem
  ) {}

  /**
   * 获取所有后历史指令预设
   * @returns 预设列表
   */
  async getAllPresets(): Promise<PostHistoryInstructionsPreset[]> {
    return this.presetRepository.getAll(PresetType.POST_HISTORY_INSTRUCTIONS) as Promise<PostHistoryInstructionsPreset[]>;
  }

  /**
   * 根据ID获取后历史指令预设
   * @param id 预设ID
   * @returns 预设对象或null
   */
  async getPresetById(id: string): Promise<PostHistoryInstructionsPreset | null> {
    return this.presetRepository.getById(PresetType.POST_HISTORY_INSTRUCTIONS, id) as Promise<PostHistoryInstructionsPreset | null>;
  }

  /**
   * 根据名称获取后历史指令预设
   * @param name 预设名称
   * @returns 预设对象或null
   */
  async getPresetByName(name: string): Promise<PostHistoryInstructionsPreset | null> {
    return this.presetRepository.getByName(PresetType.POST_HISTORY_INSTRUCTIONS, name) as Promise<PostHistoryInstructionsPreset | null>;
  }

  /**
   * 保存后历史指令预设
   * @param preset 预设对象
   * @returns 保存后的预设
   */
  async savePreset(preset: PostHistoryInstructionsPreset): Promise<PostHistoryInstructionsPreset> {
    return this.presetRepository.save(PresetType.POST_HISTORY_INSTRUCTIONS, preset) as Promise<PostHistoryInstructionsPreset>;
  }

  /**
   * 删除后历史指令预设
   * @param id 预设ID
   */
  async deletePreset(id: string): Promise<void> {
    return this.presetRepository.delete(PresetType.POST_HISTORY_INSTRUCTIONS, id);
  }

  /**
   * 应用后历史指令
   * @param presetId 预设ID
   * @param context 宏上下文
   * @param characterInstructions 角色特定指令
   * @returns 处理后的指令内容
   */
  async applyPostHistoryInstructions(
    presetId: string, 
    context: MacroContext = {},
    characterInstructions?: string
  ): Promise<string> {
    const preset = await this.getPresetById(presetId);
    if (!preset || !preset.enabled) {
      return '';
    }

    let content = preset.content;

    // 检查是否优先使用角色指令
    if (preset.preferCharacterInstructions && characterInstructions) {
      content = characterInstructions;
    } else if (preset.allowCharacterOverride && characterInstructions) {
      // 如果允许角色覆盖且存在角色指令，则替换
      content = characterInstructions;
    }

    // 处理{{original}}宏 - 插入原始的全局指令
    if (characterInstructions && characterInstructions.includes('{{original}}')) {
      content = characterInstructions.replace(/\{\{original\}\}/g, preset.content);
    }

    // 应用宏处理
    if (preset.enableMacros) {
      content = this.macroSystem.processRecursive(content, context);
    }

    return content;
  }

  /**
   * 获取激活的预设
   * @param modelName 模型名称
   * @returns 激活的预设列表
   */
  async getActivatedPresets(modelName?: string): Promise<PostHistoryInstructionsPreset[]> {
    const allPresets = await this.getAllPresets();
    
    return allPresets.filter(preset => {
      if (!preset.enabled) return false;
      
      // 检查模型限制
      if (preset.enabledFor && preset.enabledFor.length > 0) {
        if (!modelName || !preset.enabledFor.some(pattern => 
          new RegExp(pattern, 'i').test(modelName)
        )) {
          return false;
        }
      }
      
      // 检查激活正则表达式
      if (preset.activationRegex && modelName) {
        try {
          const regex = new RegExp(preset.activationRegex, 'i');
          if (!regex.test(modelName)) {
            return false;
          }
        } catch (error) {
          console.warn(`无效的激活正则表达式: ${preset.activationRegex}`, error);
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * 格式化后历史指令以插入到提示词中
   * @param preset 预设
   * @param content 处理后的内容
   * @param context 上下文信息
   * @returns 格式化后的指令
   */
  formatForInsertion(
    preset: PostHistoryInstructionsPreset,
    content: string,
    context: { totalMessages: number; lastUserMessageIndex: number } = { totalMessages: 0, lastUserMessageIndex: -1 }
  ): { content: string; position: number } {
    if (!content.trim()) {
      return { content: '', position: -1 };
    }

    let position = -1; // 默认插入到末尾

    switch (preset.insertionPosition) {
      case 'end':
        position = -1;
        break;
      case 'before_last':
        position = Math.max(0, context.totalMessages - 1);
        break;
      case 'custom':
        position = preset.customPosition || -1;
        break;
      default:
        position = -1;
    }

    return {
      content: content.trim(),
      position
    };
  }

  /**
   * 验证预设配置
   */
  validatePreset(preset: Partial<PostHistoryInstructionsPreset>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!preset.name || preset.name.trim().length === 0) {
      errors.push('预设名称不能为空');
    }

    if (!preset.content || preset.content.trim().length === 0) {
      errors.push('指令内容不能为空');
    }

    if (preset.activationRegex) {
      try {
        new RegExp(preset.activationRegex);
      } catch (error) {
        errors.push('激活正则表达式格式无效');
      }
    }

    if (preset.customPosition !== undefined && preset.customPosition < 0) {
      errors.push('自定义位置不能为负数');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
} 