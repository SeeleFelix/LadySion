import { Preset, PresetType } from '../models/preset/Preset';

/**
 * 预设存储库接口
 */
export interface PresetRepository {
  /**
   * 获取所有预设
   * @param type 预设类型
   */
  getAll(type: PresetType): Promise<Preset[]>;
  
  /**
   * 获取单个预设
   * @param type 预设类型
   * @param id 预设ID
   */
  getById(type: PresetType, id: string): Promise<Preset | null>;
  
  /**
   * 按名称获取预设
   * @param type 预设类型
   * @param name 预设名称
   */
  getByName(type: PresetType, name: string): Promise<Preset | null>;
  
  /**
   * 保存预设
   * @param type 预设类型
   * @param preset 预设对象
   */
  save(type: PresetType, preset: Preset): Promise<Preset>;
  
  /**
   * 删除预设
   * @param type 预设类型
   * @param id 预设ID
   */
  delete(type: PresetType, id: string): Promise<void>;
} 