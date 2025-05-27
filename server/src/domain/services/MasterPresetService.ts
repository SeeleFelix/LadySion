import { MasterPreset, PresetType } from '../models/preset/Preset';
import { PresetUseCases } from '../usecases/preset/PresetUseCases';
import { InstructModeService } from './InstructModeService';
import { ContextTemplateService } from './ContextTemplateService';
import { SystemPromptService } from './SystemPromptService';

/**
 * 主预设服务
 */
export class MasterPresetService {
  constructor(
    private presetUseCases: PresetUseCases,
    private instructModeService: InstructModeService,
    private contextTemplateService: ContextTemplateService,
    private systemPromptService: SystemPromptService
  ) {}
  
  /**
   * 导出主预设
   * @param name 主预设名称
   * @returns 主预设对象
   */
  async exportMasterPreset(name: string): Promise<MasterPreset> {
    const instructPreset = await this.instructModeService.getActivePreset();
    const contextPreset = await this.contextTemplateService.getActivePreset();
    const systemPromptPreset = await this.systemPromptService.getActivePreset();
    
    return {
      name,
      instruct: instructPreset || undefined,
      context: contextPreset || undefined,
      systemPrompt: systemPromptPreset || undefined
    };
  }
  
  /**
   * 导入主预设
   * @param masterPreset 主预设对象
   */
  async importMasterPreset(masterPreset: MasterPreset): Promise<void> {
    // 使用预设用例导入主预设
    await this.presetUseCases.importMasterPreset(masterPreset);
    
    // 应用导入的预设
    if (masterPreset.instruct && masterPreset.instruct.id) {
      await this.instructModeService.selectPreset(masterPreset.instruct.id);
    }
    
    if (masterPreset.context && masterPreset.context.id) {
      await this.contextTemplateService.selectPreset(masterPreset.context.id);
    }
    
    if (masterPreset.systemPrompt && masterPreset.systemPrompt.id) {
      await this.systemPromptService.selectPreset(masterPreset.systemPrompt.id);
    }
  }
  
  /**
   * 检查预设依赖关系
   * @param instructPresetId 指令模式预设ID
   * @returns 具有相同名称的上下文模板预设ID，如果没有则为null
   */
  async checkPresetDependencies(instructPresetId: string): Promise<string | null> {
    const instructPreset = await this.instructModeService.getActivePreset();
    
    if (!instructPreset) return null;
    
    // 检查是否有相同名称的上下文模板预设
    const contextPresets = await this.presetUseCases.getAllPresets(PresetType.CONTEXT);
    const matchingContextPreset = contextPresets.find(preset => preset.name === instructPreset.name);
    
    return matchingContextPreset?.id || null;
  }
} 