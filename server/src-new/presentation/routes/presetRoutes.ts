import { Router } from 'express';
import { PresetController } from '../controllers/PresetController';

/**
 * 创建预设路由
 * @param presetController 预设控制器实例
 */
export function createPresetRoutes(presetController: PresetController): Router {
  const router = Router();

  // 预设CRUD操作
  router.get('/presets/:type', (req, res) => presetController.getAllPresets(req, res));
  router.get('/presets/:type/:id', (req, res) => presetController.getPresetById(req, res));
  router.post('/presets/:type', (req, res) => presetController.createPreset(req, res));
  router.put('/presets/:type/:id', (req, res) => presetController.updatePreset(req, res));
  router.delete('/presets/:type/:id', (req, res) => presetController.deletePreset(req, res));

  // 主预设操作
  router.post('/presets/master/import', (req, res) => presetController.importMasterPreset(req, res));
  router.post('/presets/master/export', (req, res) => presetController.exportMasterPreset(req, res));

  // 宏相关操作
  router.get('/presets/macros/descriptions', (req, res) => presetController.getMacroDescriptions(req, res));
  router.post('/presets/macros/validate', (req, res) => presetController.validateMacroSyntax(req, res));

  return router;
} 