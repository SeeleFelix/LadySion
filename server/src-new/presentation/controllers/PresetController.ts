import { Request, Response } from 'express';
import { PresetApplicationService } from '../../application/services/PresetApplicationService';
import { PresetType } from '../../domain/entities/Preset';

/**
 * 预设控制器
 * 处理预设相关的HTTP请求
 */
export class PresetController {
  constructor(private presetService: PresetApplicationService) {}

  /**
   * 获取所有预设
   */
  async getAllPresets(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params;
      
      if (!Object.values(PresetType).includes(type as PresetType)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PRESET_TYPE',
            message: `无效的预设类型: ${type}`
          }
        });
        return;
      }

      const presets = await this.presetService.getAllPresets(type as PresetType);
      
      res.json({
        success: true,
        data: presets
      });
    } catch (error) {
      console.error('获取预设列表失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_PRESETS_FAILED',
          message: '获取预设列表失败'
        }
      });
    }
  }

  /**
   * 获取预设详情
   */
  async getPresetById(req: Request, res: Response): Promise<void> {
    try {
      const { type, id } = req.params;

      if (!Object.values(PresetType).includes(type as PresetType)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PRESET_TYPE',
            message: `无效的预设类型: ${type}`
          }
        });
        return;
      }

      const preset = await this.presetService.getPresetById(type as PresetType, id);
      
      if (!preset) {
        res.status(404).json({
          success: false,
          error: {
            code: 'PRESET_NOT_FOUND',
            message: `预设不存在: ${id}`
          }
        });
        return;
      }

      res.json({
        success: true,
        data: preset
      });
    } catch (error) {
      console.error('获取预设详情失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_PRESET_FAILED',
          message: '获取预设详情失败'
        }
      });
    }
  }

  /**
   * 创建预设
   */
  async createPreset(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params;
      const presetData = req.body;

      if (!Object.values(PresetType).includes(type as PresetType)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PRESET_TYPE',
            message: `无效的预设类型: ${type}`
          }
        });
        return;
      }

      if (!presetData.name) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PRESET_NAME',
            message: '预设名称不能为空'
          }
        });
        return;
      }

      const preset = await this.presetService.createPreset(type as PresetType, presetData);
      
      res.status(201).json({
        success: true,
        data: preset
      });
    } catch (error) {
      console.error('创建预设失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CREATE_PRESET_FAILED',
          message: '创建预设失败'
        }
      });
    }
  }

  /**
   * 更新预设
   */
  async updatePreset(req: Request, res: Response): Promise<void> {
    try {
      const { type, id } = req.params;
      const updateData = req.body;

      if (!Object.values(PresetType).includes(type as PresetType)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PRESET_TYPE',
            message: `无效的预设类型: ${type}`
          }
        });
        return;
      }

      const preset = await this.presetService.updatePreset(type as PresetType, id, updateData);
      
      res.json({
        success: true,
        data: preset
      });
    } catch (error) {
      console.error('更新预设失败:', error);
      
      if (error instanceof Error && error.message.includes('预设不存在')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'PRESET_NOT_FOUND',
            message: error.message
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'UPDATE_PRESET_FAILED',
            message: '更新预设失败'
          }
        });
      }
    }
  }

  /**
   * 删除预设
   */
  async deletePreset(req: Request, res: Response): Promise<void> {
    try {
      const { type, id } = req.params;

      if (!Object.values(PresetType).includes(type as PresetType)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PRESET_TYPE',
            message: `无效的预设类型: ${type}`
          }
        });
        return;
      }

      await this.presetService.deletePreset(type as PresetType, id);
      
      res.status(204).end();
    } catch (error) {
      console.error('删除预设失败:', error);
      
      if (error instanceof Error && error.message.includes('预设不存在')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'PRESET_NOT_FOUND',
            message: error.message
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'DELETE_PRESET_FAILED',
            message: '删除预设失败'
          }
        });
      }
    }
  }

  /**
   * 导入主预设
   */
  async importMasterPreset(req: Request, res: Response): Promise<void> {
    try {
      const masterPreset = req.body;

      if (!masterPreset.name) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PRESET_NAME',
            message: '主预设名称不能为空'
          }
        });
        return;
      }

      await this.presetService.importMasterPreset(masterPreset);
      
      res.json({
        success: true,
        message: '主预设导入成功'
      });
    } catch (error) {
      console.error('导入主预设失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'IMPORT_MASTER_PRESET_FAILED',
          message: '导入主预设失败'
        }
      });
    }
  }

  /**
   * 导出主预设
   */
  async exportMasterPreset(req: Request, res: Response): Promise<void> {
    try {
      const { name, instructId, contextId, systemPromptId } = req.body;

      if (!name) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PRESET_NAME',
            message: '主预设名称不能为空'
          }
        });
        return;
      }

      const masterPreset = await this.presetService.exportMasterPreset(
        name,
        instructId,
        contextId,
        systemPromptId
      );
      
      res.json({
        success: true,
        data: masterPreset
      });
    } catch (error) {
      console.error('导出主预设失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'EXPORT_MASTER_PRESET_FAILED',
          message: '导出主预设失败'
        }
      });
    }
  }

  /**
   * 获取宏描述
   */
  async getMacroDescriptions(req: Request, res: Response): Promise<void> {
    try {
      const descriptions = this.presetService.getMacroDescriptions();
      
      res.json({
        success: true,
        data: descriptions
      });
    } catch (error) {
      console.error('获取宏描述失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_MACRO_DESCRIPTIONS_FAILED',
          message: '获取宏描述失败'
        }
      });
    }
  }

  /**
   * 验证宏语法
   */
  async validateMacroSyntax(req: Request, res: Response): Promise<void> {
    try {
      const { text } = req.body;

      if (!text) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_TEXT',
            message: '文本内容不能为空'
          }
        });
        return;
      }

      const result = this.presetService.validateMacroSyntax(text);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('验证宏语法失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'VALIDATE_MACRO_SYNTAX_FAILED',
          message: '验证宏语法失败'
        }
      });
    }
  }
} 