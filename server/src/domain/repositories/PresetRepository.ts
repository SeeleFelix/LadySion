import { MasterPreset, Preset, PresetType } from "@/domain/entities/Preset.ts";

/**
 * 预设存储库接口
 */
export interface PresetRepository {
  /**
   * 获取所有指定类型的预设
   */
  getAll(type: PresetType): Promise<Preset[]>;

  /**
   * 根据ID获取预设
   */
  getById(type: PresetType, id: string): Promise<Preset | null>;

  /**
   * 根据名称获取预设
   */
  getByName(type: PresetType, name: string): Promise<Preset | null>;

  /**
   * 保存预设
   */
  save(type: PresetType, preset: Preset): Promise<Preset>;

  /**
   * 删除预设
   */
  delete(type: PresetType, id: string): Promise<void>;

  /**
   * 检查预设是否存在
   */
  exists(type: PresetType, id: string): Promise<boolean>;

  /**
   * 导入主预设
   */
  importMasterPreset(masterPreset: MasterPreset): Promise<void>;

  /**
   * 保存配置
   */
  saveConfiguration(key: string, value: any): Promise<void>;

  /**
   * 获取配置
   */
  getConfiguration(key: string): Promise<any>;

  /**
   * 关闭连接
   */
  close(): Promise<void>;
}
