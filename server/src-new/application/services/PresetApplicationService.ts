import { PresetUseCases } from '../usecases/PresetUseCases';
import { PresetType, Preset, InstructPreset, ContextPreset, SystemPromptPreset, MasterPreset } from '../../domain/entities/Preset';
import { MacroSystem, MacroContext } from '../../domain/services/MacroSystem';

/**
 * 预设应用服务
 * 协调预设管理的业务流程
 */
export class PresetApplicationService {
  constructor(
    private presetUseCases: PresetUseCases,
    private macroSystem: MacroSystem
  ) {}

  /**
   * 获取所有预设
   */
  async getAllPresets(type: PresetType): Promise<Preset[]> {
    return this.presetUseCases.getAllPresets(type);
  }

  /**
   * 获取预设详情
   */
  async getPresetById(type: PresetType, id: string): Promise<Preset | null> {
    return this.presetUseCases.getPresetById(type, id);
  }

  /**
   * 创建预设
   */
  async createPreset(type: PresetType, presetData: Partial<Preset>): Promise<Preset> {
    const preset: Preset = {
      id: presetData.id || this.generateId(),
      name: presetData.name!,
      description: presetData.description,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...presetData
    } as Preset;

    return this.presetUseCases.savePreset(type, preset);
  }

  /**
   * 更新预设
   */
  async updatePreset(type: PresetType, id: string, updateData: Partial<Preset>): Promise<Preset> {
    const existingPreset = await this.presetUseCases.getPresetById(type, id);
    if (!existingPreset) {
      throw new Error(`预设不存在: ${id}`);
    }

    const updatedPreset = {
      ...existingPreset,
      ...updateData,
      updatedAt: new Date()
    };

    return this.presetUseCases.savePreset(type, updatedPreset);
  }

  /**
   * 删除预设
   */
  async deletePreset(type: PresetType, id: string): Promise<void> {
    const existingPreset = await this.presetUseCases.getPresetById(type, id);
    if (!existingPreset) {
      throw new Error(`预设不存在: ${id}`);
    }

    await this.presetUseCases.deletePreset(type, id);
  }

  /**
   * 应用指令预设到消息序列
   */
  async applyInstructPreset(presetId: string, messages: Array<{role: string, content: string}>, context: MacroContext): Promise<Array<{role: string, content: string}>> {
    const preset = await this.presetUseCases.getPresetById(PresetType.INSTRUCT, presetId) as InstructPreset;
    if (!preset) {
      throw new Error(`指令预设不存在: ${presetId}`);
    }

    const formattedMessages = [];
    
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      
      if (message.role === 'user') {
        const isFirst = i === 0;
        const prefix = isFirst ? 
          this.macroSystem.process(preset.firstInputSequence, context) :
          this.macroSystem.process(preset.inputSequence, context);
        const suffix = this.macroSystem.process(preset.inputSuffix, context);
        
        formattedMessages.push({
          role: message.role,
          content: `${prefix}${message.content}${suffix}`
        });
      } else if (message.role === 'assistant') {
        const isFirst = i === 1; // 第一个assistant消息
        const prefix = isFirst ?
          this.macroSystem.process(preset.firstOutputSequence, context) :
          this.macroSystem.process(preset.outputSequence, context);
        const suffix = this.macroSystem.process(preset.outputSuffix, context);
        
        formattedMessages.push({
          role: message.role,
          content: `${prefix}${message.content}${suffix}`
        });
      } else if (message.role === 'system') {
        const prefix = this.macroSystem.process(preset.systemSequence, context);
        const suffix = this.macroSystem.process(preset.systemSuffix, context);
        
        formattedMessages.push({
          role: message.role,
          content: `${prefix}${message.content}${suffix}`
        });
      } else {
        formattedMessages.push(message);
      }
    }

    return formattedMessages;
  }

  /**
   * 应用系统提示词预设
   */
  async applySystemPromptPreset(presetId: string, context: MacroContext): Promise<string> {
    const preset = await this.presetUseCases.getPresetById(PresetType.SYSTEM_PROMPT, presetId) as SystemPromptPreset;
    if (!preset) {
      throw new Error(`系统提示词预设不存在: ${presetId}`);
    }

    if (!preset.enabled) {
      return '';
    }

    return this.macroSystem.process(preset.content, context);
  }

  /**
   * 应用上下文模板预设
   */
  async applyContextPreset(presetId: string, context: MacroContext): Promise<string> {
    const preset = await this.presetUseCases.getPresetById(PresetType.CONTEXT, presetId) as ContextPreset;
    if (!preset) {
      throw new Error(`上下文模板预设不存在: ${presetId}`);
    }

    return this.macroSystem.process(preset.contextTemplate, context);
  }

  /**
   * 导入主预设
   */
  async importMasterPreset(masterPreset: MasterPreset): Promise<void> {
    await this.presetUseCases.importMasterPreset(masterPreset);
  }

  /**
   * 导出主预设
   */
  async exportMasterPreset(
    name: string,
    instructId?: string,
    contextId?: string,
    systemPromptId?: string
  ): Promise<MasterPreset> {
    return this.presetUseCases.exportMasterPreset(name, instructId, contextId, systemPromptId);
  }

  /**
   * 获取宏描述
   */
  getMacroDescriptions() {
    return this.macroSystem.getMacroDescriptions();
  }

  /**
   * 验证宏语法
   */
  validateMacroSyntax(text: string) {
    return this.macroSystem.validateMacroSyntax(text);
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 