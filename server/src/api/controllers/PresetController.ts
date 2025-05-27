import { Request, Response } from 'express';
import { PresetUseCases } from '../../domain/usecases/preset/PresetUseCases';
import { InstructModeService } from '../../domain/services/InstructModeService';
import { ContextTemplateService } from '../../domain/services/ContextTemplateService';
import { SystemPromptService } from '../../domain/services/SystemPromptService';
import { MasterPresetService } from '../../domain/services/MasterPresetService';
import { Preset, PresetType } from '../../domain/models/preset/Preset';

/**
 * 预设控制器
 */
export class PresetController {
  constructor(
    private presetUseCases: PresetUseCases,
    private instructModeService: InstructModeService,
    private contextTemplateService: ContextTemplateService,
    private systemPromptService: SystemPromptService,
    private masterPresetService: MasterPresetService
  ) {}
  
  /**
   * 获取所有预设（所有类型）
   */
  getAllPresetsWithoutType = async (req: Request, res: Response): Promise<void> => {
    try {
      const allPresets: Preset[] = [];
      
      // 获取所有类型的预设
      for (const presetType of Object.values(PresetType)) {
        const presets = await this.presetUseCases.getAllPresets(presetType);
        // 给每个预设添加类型信息
        const presetsWithType = presets.map(preset => ({
          ...preset,
          type: presetType
        }));
        allPresets.push(...presetsWithType);
      }
      
      res.json(allPresets);
    } catch (error) {
      console.error('获取所有预设失败:', error);
      res.status(500).json({ error: '获取所有预设失败' });
    }
  };
  
  /**
   * 获取所有预设
   */
  getAllPresets = async (req: Request, res: Response): Promise<void> => {
    try {
      const { type } = req.params;
      const presetType = type as PresetType;
      
      if (!Object.values(PresetType).includes(presetType)) {
        res.status(400).json({ error: '无效的预设类型' });
        return;
      }
      
      const presets = await this.presetUseCases.getAllPresets(presetType);
      res.json(presets);
    } catch (error) {
      console.error('获取预设列表失败:', error);
      res.status(500).json({ error: '获取预设列表失败' });
    }
  };
  
  /**
   * 获取预设
   */
  getPreset = async (req: Request, res: Response): Promise<void> => {
    try {
      const { type, id } = req.params;
      const presetType = type as PresetType;
      
      if (!Object.values(PresetType).includes(presetType)) {
        res.status(400).json({ error: '无效的预设类型' });
        return;
      }
      
      const preset = await this.presetUseCases.getPresetById(presetType, id);
      
      if (!preset) {
        res.status(404).json({ error: '预设不存在' });
        return;
      }
      
      res.json(preset);
    } catch (error) {
      console.error('获取预设失败:', error);
      res.status(500).json({ error: '获取预设失败' });
    }
  };
  
  /**
   * 保存预设
   */
  savePreset = async (req: Request, res: Response): Promise<void> => {
    try {
      const { type } = req.params;
      const presetType = type as PresetType;
      
      if (!Object.values(PresetType).includes(presetType)) {
        res.status(400).json({ error: '无效的预设类型' });
        return;
      }
      
      const preset = req.body as Preset;
      
      if (!preset.name) {
        res.status(400).json({ error: '预设名称是必需的' });
        return;
      }
      
      const savedPreset = await this.presetUseCases.savePreset(presetType, preset);
      res.status(200).json(savedPreset);
    } catch (error) {
      console.error('保存预设失败:', error);
      res.status(500).json({ error: '保存预设失败' });
    }
  };
  
  /**
   * 删除预设
   */
  deletePreset = async (req: Request, res: Response): Promise<void> => {
    try {
      const { type, id } = req.params;
      const presetType = type as PresetType;
      
      if (!Object.values(PresetType).includes(presetType)) {
        res.status(400).json({ error: '无效的预设类型' });
        return;
      }
      
      await this.presetUseCases.deletePreset(presetType, id);
      res.status(204).end();
    } catch (error) {
      console.error('删除预设失败:', error);
      res.status(500).json({ error: '删除预设失败' });
    }
  };
  
  /**
   * 导入主预设
   */
  importMasterPreset = async (req: Request, res: Response): Promise<void> => {
    try {
      const masterPreset = req.body;
      
      if (!masterPreset.name) {
        res.status(400).json({ error: '预设名称是必需的' });
        return;
      }
      
      await this.masterPresetService.importMasterPreset(masterPreset);
      res.status(200).json({ message: '主预设导入成功' });
    } catch (error) {
      console.error('导入主预设失败:', error);
      res.status(500).json({ error: '导入主预设失败' });
    }
  };
  
  /**
   * 导出主预设
   */
  exportMasterPreset = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name } = req.params;
      
      if (!name) {
        res.status(400).json({ error: '预设名称是必需的' });
        return;
      }
      
      const masterPreset = await this.masterPresetService.exportMasterPreset(name);
      res.status(200).json(masterPreset);
    } catch (error) {
      console.error('导出主预设失败:', error);
      res.status(500).json({ error: '导出主预设失败' });
    }
  };
  
  /**
   * 选择指令模式预设
   */
  selectInstructPreset = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const preset = await this.instructModeService.selectPreset(id);
      
      if (!preset) {
        res.status(404).json({ error: '预设不存在' });
        return;
      }
      
      // 检查是否有匹配的上下文模板预设
      if (this.instructModeService.getConfig().bindToContext) {
        const contextPresetId = await this.masterPresetService.checkPresetDependencies(id);
        if (contextPresetId) {
          await this.contextTemplateService.selectPreset(contextPresetId);
        }
      }
      
      res.status(200).json({ message: '预设选择成功', preset });
    } catch (error) {
      console.error('选择预设失败:', error);
      res.status(500).json({ error: '选择预设失败' });
    }
  };
  
  /**
   * 选择上下文模板预设
   */
  selectContextPreset = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const preset = await this.contextTemplateService.selectPreset(id);
      
      if (!preset) {
        res.status(404).json({ error: '预设不存在' });
        return;
      }
      
      res.status(200).json({ message: '预设选择成功', preset });
    } catch (error) {
      console.error('选择预设失败:', error);
      res.status(500).json({ error: '选择预设失败' });
    }
  };
  
  /**
   * 选择系统提示词预设
   */
  selectSystemPromptPreset = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const preset = await this.systemPromptService.selectPreset(id);
      
      if (!preset) {
        res.status(404).json({ error: '预设不存在' });
        return;
      }
      
      res.status(200).json({ message: '预设选择成功', preset });
    } catch (error) {
      console.error('选择预设失败:', error);
      res.status(500).json({ error: '选择预设失败' });
    }
  };
  
  /**
   * 更新指令模式配置
   */
  updateInstructModeConfig = async (req: Request, res: Response): Promise<void> => {
    try {
      const config = req.body;
      this.instructModeService.setConfig(config);
      res.status(200).json({ message: '配置更新成功', config: this.instructModeService.getConfig() });
    } catch (error) {
      console.error('更新配置失败:', error);
      res.status(500).json({ error: '更新配置失败' });
    }
  };
  
  /**
   * 更新上下文模板配置
   */
  updateContextTemplateConfig = async (req: Request, res: Response): Promise<void> => {
    try {
      const config = req.body;
      this.contextTemplateService.setConfig(config);
      res.status(200).json({ message: '配置更新成功', config: this.contextTemplateService.getConfig() });
    } catch (error) {
      console.error('更新配置失败:', error);
      res.status(500).json({ error: '更新配置失败' });
    }
  };
  
  /**
   * 更新系统提示词配置
   */
  updateSystemPromptConfig = async (req: Request, res: Response): Promise<void> => {
    try {
      const config = req.body;
      this.systemPromptService.setConfig(config);
      res.status(200).json({ message: '配置更新成功', config: this.systemPromptService.getConfig() });
    } catch (error) {
      console.error('更新配置失败:', error);
      res.status(500).json({ error: '更新配置失败' });
    }
  };
  
  /**
   * 获取可用宏列表
   */
  getMacroDescriptions = async (req: Request, res: Response): Promise<void> => {
    try {
      // 这里应该注入MacroSystem服务，这里先模拟一下
      const macroDescriptions = [
        { name: 'user', description: '用户名称' },
        { name: 'char', description: '角色名称' },
        { name: 'date', description: '当前日期' },
        { name: 'time', description: '当前时间' },
        { name: 'random', description: '从选项中随机选择一个，例如 {{random::选项1::选项2::选项3}}' },
        { name: 'rand', description: '生成指定范围内的随机数，例如 {{rand:1,100}}' },
        { name: 'systemPrompt', description: '系统提示词内容' },
        { name: 'chatStart', description: '对话开始标记' },
        { name: 'exampleSeparator', description: '示例分隔符' },
        { name: 'instructInput', description: '指令模式用户输入前缀' },
        { name: 'instructOutput', description: '指令模式助手输出前缀' }
      ];
      
      res.status(200).json(macroDescriptions);
    } catch (error) {
      console.error('获取宏描述失败:', error);
      res.status(500).json({ error: '获取宏描述失败' });
    }
  };
} 