import { Router } from 'express';
import { PresetController } from '../controllers/PresetController';

/**
 * 创建预设路由
 * @param presetController 预设控制器
 * @returns Express路由
 */
export function createPresetRoutes(presetController: PresetController): Router {
  const router = Router();
  
  // 宏 - 必须在参数化路由之前
  router.get('/presets/macros', presetController.getMacroDescriptions);
  
  // 获取所有预设（无类型筛选）
  router.get('/presets', presetController.getAllPresetsWithoutType);
  
  // 主预设导入导出 - 必须在参数化路由之前
  router.post('/presets/master/import', presetController.importMasterPreset);
  router.get('/presets/master/export/:name', presetController.exportMasterPreset);
  
  // 配置更新 - 必须在参数化路由之前
  router.post('/presets/instruct/config', presetController.updateInstructModeConfig);
  router.post('/presets/context/config', presetController.updateContextTemplateConfig);
  router.post('/presets/system-prompt/config', presetController.updateSystemPromptConfig);
  
  // 预设选择 - 必须在参数化路由之前
  router.post('/presets/instruct/select/:id', presetController.selectInstructPreset);
  router.post('/presets/context/select/:id', presetController.selectContextPreset);
  router.post('/presets/sysprompt/select/:id', presetController.selectSystemPromptPreset);
  
  // 预设CRUD - 参数化路由必须在最后
  router.get('/presets/:type', presetController.getAllPresets);
  router.get('/presets/:type/:id', presetController.getPreset);
  router.post('/presets/:type', presetController.savePreset);
  router.put('/presets/:type/:id', presetController.savePreset);
  router.delete('/presets/:type/:id', presetController.deletePreset);
  
  return router;
} 