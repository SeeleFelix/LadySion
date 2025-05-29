import { Request, Response } from 'express';
import { PresetApplicationService } from '@/application/services/PresetApplicationService';
import { Preset, PresetType } from '@/domain/entities/Preset';

/**
 * 预设控制器
 * 处理预设相关的HTTP请求
 */
export class PresetController {
  constructor(private presetApplicationService: PresetApplicationService) {}

  /**
   * 获取所有预设（所有类型）
   */
  getAllPresetsWithoutType = async (req: Request, res: Response): Promise<void> => {
    try {
      const allPresets: Preset[] = [];
      
      // 获取所有类型的预设
      for (const presetType of Object.values(PresetType)) {
        const presets = await this.presetApplicationService.getAllPresets(presetType);
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
   * 获取指定类型的所有预设
   */
  getAllPresets = async (req: Request, res: Response): Promise<void> => {
    try {
      const { type } = req.params;
      const presetType = type as PresetType;
      
      if (!Object.values(PresetType).includes(presetType)) {
        res.status(400).json({ error: '无效的预设类型' });
        return;
      }
      
      const presets = await this.presetApplicationService.getAllPresets(presetType);
      res.json(presets);
    } catch (error) {
      console.error('获取预设列表失败:', error);
      res.status(500).json({ error: '获取预设列表失败' });
    }
  };

  /**
   * 根据ID获取预设
   */
  getPreset = async (req: Request, res: Response): Promise<void> => {
    try {
      const { type, id } = req.params;
      const presetType = type as PresetType;
      
      if (!Object.values(PresetType).includes(presetType)) {
        res.status(400).json({ error: '无效的预设类型' });
        return;
      }
      
      const preset = await this.presetApplicationService.getPresetById(presetType, id);
      
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
      
      const savedPreset = await this.presetApplicationService.savePreset(presetType, preset);
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
      
      await this.presetApplicationService.deletePreset(presetType, id);
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
      
      await this.presetApplicationService.importMasterPreset(masterPreset);
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
      const { name, instructId, contextId, systemPromptId, postHistoryId } = req.query;
      
      if (!name) {
        res.status(400).json({ error: '预设名称是必需的' });
        return;
      }
      
      const masterPreset = await this.presetApplicationService.exportMasterPreset(
        name as string,
        instructId as string,
        contextId as string,
        systemPromptId as string,
        postHistoryId as string
      );
      
      res.status(200).json(masterPreset);
    } catch (error) {
      console.error('导出主预设失败:', error);
      res.status(500).json({ error: '导出主预设失败' });
    }
  };

  /**
   * 获取配置
   */
  getConfiguration = async (req: Request, res: Response): Promise<void> => {
    try {
      const { key } = req.params;
      
      if (!key) {
        res.status(400).json({ error: '配置键是必需的' });
        return;
      }
      
      const configuration = await this.presetApplicationService.getConfiguration(key);
      res.json(configuration);
    } catch (error) {
      console.error('获取配置失败:', error);
      res.status(500).json({ error: '获取配置失败' });
    }
  };

  /**
   * 保存配置
   */
  saveConfiguration = async (req: Request, res: Response): Promise<void> => {
    try {
      const { key } = req.params;
      const configuration = req.body;
      
      if (!key) {
        res.status(400).json({ error: '配置键是必需的' });
        return;
      }
      
      await this.presetApplicationService.saveConfiguration(key, configuration);
      res.status(200).json({ message: '配置保存成功' });
    } catch (error) {
      console.error('保存配置失败:', error);
      res.status(500).json({ error: '保存配置失败' });
    }
  };

  /**
   * 获取宏描述列表
   */
  getMacroDescriptions = async (req: Request, res: Response): Promise<void> => {
    try {
      const descriptions = this.presetApplicationService.getMacroDescriptions();
      res.json(descriptions);
    } catch (error) {
      console.error('获取宏描述失败:', error);
      res.status(500).json({ error: '获取宏描述失败' });
    }
  };

  /**
   * 处理宏
   */
  processMacros = async (req: Request, res: Response): Promise<void> => {
    try {
      const { text, context } = req.body;
      
      if (!text) {
        res.status(400).json({ error: '文本是必需的' });
        return;
      }
      
      const processedText = this.presetApplicationService.processMacros(text, context);
      res.json({ processedText });
    } catch (error) {
      console.error('处理宏失败:', error);
      res.status(500).json({ error: '处理宏失败' });
    }
  };

  /**
   * 验证宏语法
   */
  validateMacroSyntax = async (req: Request, res: Response): Promise<void> => {
    try {
      const { text } = req.body;
      
      if (!text) {
        res.status(400).json({ error: '文本是必需的' });
        return;
      }
      
      const result = this.presetApplicationService.validateMacroSyntax(text);
      res.json(result);
    } catch (error) {
      console.error('验证宏语法失败:', error);
      res.status(500).json({ error: '验证宏语法失败' });
    }
  };

  /**
   * 获取文本中使用的宏列表
   */
  getUsedMacros = async (req: Request, res: Response): Promise<void> => {
    try {
      const { text } = req.body;
      
      if (!text) {
        res.status(400).json({ error: '文本是必需的' });
        return;
      }
      
      const usedMacros = this.presetApplicationService.getUsedMacros(text);
      res.json({ usedMacros });
    } catch (error) {
      console.error('获取使用的宏失败:', error);
      res.status(500).json({ error: '获取使用的宏失败' });
    }
  };
} 