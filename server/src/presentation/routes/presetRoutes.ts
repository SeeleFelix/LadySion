import { Router } from 'express';
import { PresetController } from '@/presentation/controllers/PresetController';

/**
 * 创建预设路由
 */
export function createPresetRoutes(presetController: PresetController): Router {
  const router = Router();

  // 预设CRUD操作
  router.get('/presets', presetController.getAllPresetsWithoutType);
  router.get('/presets/:type', presetController.getAllPresets);
  router.get('/presets/:type/:id', presetController.getPreset);
  router.post('/presets/:type', presetController.savePreset);
  router.put('/presets/:type/:id', presetController.savePreset);
  router.delete('/presets/:type/:id', presetController.deletePreset);

  // 主预设操作
  router.post('/presets/master/import', presetController.importMasterPreset);
  router.get('/presets/master/export', presetController.exportMasterPreset);

  // 配置操作
  router.get('/configurations/:key', presetController.getConfiguration);
  router.post('/configurations/:key', presetController.saveConfiguration);
  router.put('/configurations/:key', presetController.saveConfiguration);

  // 宏相关操作
  router.get('/macros/descriptions', presetController.getMacroDescriptions);
  router.post('/macros/process', presetController.processMacros);
  router.post('/macros/validate', presetController.validateMacroSyntax);
  router.post('/macros/used', presetController.getUsedMacros);

  return router;
} 