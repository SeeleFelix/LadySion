import { Preset, PresetType, MasterPreset, InstructPreset, ContextPreset, SystemPromptPreset, PostHistoryInstructionsPreset } from '@/domain/entities/Preset';
import { PresetRepository } from '@/domain/repositories/PresetRepository';

/**
 * 预设用例
 */
export class PresetUseCases {
  constructor(private presetRepository: PresetRepository) {}

  /**
   * 获取所有预设
   * @param type 预设类型
   */
  async getAllPresets(type: PresetType): Promise<Preset[]> {
    return this.presetRepository.getAll(type);
  }

  /**
   * 获取预设
   * @param type 预设类型
   * @param id 预设ID
   */
  async getPresetById(type: PresetType, id: string): Promise<Preset | null> {
    return this.presetRepository.getById(type, id);
  }

  /**
   * 按名称获取预设
   * @param type 预设类型
   * @param name 预设名称
   */
  async getPresetByName(type: PresetType, name: string): Promise<Preset | null> {
    return this.presetRepository.getByName(type, name);
  }

  /**
   * 保存预设
   * @param type 预设类型
   * @param preset 预设对象
   */
  async savePreset(type: PresetType, preset: Preset): Promise<Preset> {
    preset.updatedAt = new Date();
    return this.presetRepository.save(type, preset);
  }

  /**
   * 删除预设
   * @param type 预设类型
   * @param id 预设ID
   */
  async deletePreset(type: PresetType, id: string): Promise<void> {
    return this.presetRepository.delete(type, id);
  }

  /**
   * 检查预设是否存在
   */
  async presetExists(type: PresetType, id: string): Promise<boolean> {
    return this.presetRepository.exists(type, id);
  }

  /**
   * 导入主预设
   * @param masterPreset 主预设对象
   */
  async importMasterPreset(masterPreset: MasterPreset): Promise<void> {
    const now = new Date();
    
    if (masterPreset.instruct) {
      const instructPreset = masterPreset.instruct;
      instructPreset.createdAt = now;
      instructPreset.updatedAt = now;
      await this.savePreset(PresetType.INSTRUCT, instructPreset);
    }
    
    if (masterPreset.context) {
      const contextPreset = masterPreset.context;
      contextPreset.createdAt = now;
      contextPreset.updatedAt = now;
      await this.savePreset(PresetType.CONTEXT, contextPreset);
    }
    
    if (masterPreset.systemPrompt) {
      const systemPromptPreset = masterPreset.systemPrompt;
      systemPromptPreset.createdAt = now;
      systemPromptPreset.updatedAt = now;
      await this.savePreset(PresetType.SYSTEM_PROMPT, systemPromptPreset);
    }

    if (masterPreset.postHistoryInstructions) {
      const postHistoryPreset = masterPreset.postHistoryInstructions;
      postHistoryPreset.createdAt = now;
      postHistoryPreset.updatedAt = now;
      await this.savePreset(PresetType.POST_HISTORY_INSTRUCTIONS, postHistoryPreset);
    }
  }

  /**
   * 导出主预设
   * @param name 主预设名称
   * @param instructId 指令模式预设ID
   * @param contextId 上下文模板预设ID
   * @param systemPromptId 系统提示词预设ID
   * @param postHistoryId 帖子历史指令预设ID
   */
  async exportMasterPreset(
    name: string,
    instructId?: string,
    contextId?: string,
    systemPromptId?: string,
    postHistoryId?: string
  ): Promise<MasterPreset> {
    const masterPreset: MasterPreset = { name };
    
    if (instructId) {
      const instructPreset = await this.getPresetById(PresetType.INSTRUCT, instructId) as InstructPreset;
      if (instructPreset) {
        masterPreset.instruct = instructPreset;
      }
    }
    
    if (contextId) {
      const contextPreset = await this.getPresetById(PresetType.CONTEXT, contextId) as ContextPreset;
      if (contextPreset) {
        masterPreset.context = contextPreset;
      }
    }
    
    if (systemPromptId) {
      const systemPromptPreset = await this.getPresetById(PresetType.SYSTEM_PROMPT, systemPromptId) as SystemPromptPreset;
      if (systemPromptPreset) {
        masterPreset.systemPrompt = systemPromptPreset;
      }
    }

    if (postHistoryId) {
      const postHistoryPreset = await this.getPresetById(PresetType.POST_HISTORY_INSTRUCTIONS, postHistoryId) as PostHistoryInstructionsPreset;
      if (postHistoryPreset) {
        masterPreset.postHistoryInstructions = postHistoryPreset;
      }
    }
    
    return masterPreset;
  }

  /**
   * 获取配置
   */
  async getConfiguration(key: string): Promise<any> {
    return this.presetRepository.getConfiguration(key);
  }

  /**
   * 保存配置
   */
  async saveConfiguration(key: string, value: any): Promise<void> {
    return this.presetRepository.saveConfiguration(key, value);
  }
} 