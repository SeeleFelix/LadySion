import { Preset, PresetType, PresetConfiguration } from '../entities/Preset';

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
   * 根据ID获取预设
   * @param type 预设类型
   * @param id 预设ID
   */
  getById(type: PresetType, id: string): Promise<Preset | null>;

  /**
   * 根据名称获取预设
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

  /**
   * 获取配置
   * @param key 配置键
   */
  getConfiguration(key: string): Promise<PresetConfiguration | null>;

  /**
   * 保存配置
   * @param key 配置键
   * @param config 配置对象
   */
  saveConfiguration(key: string, config: PresetConfiguration): Promise<void>;

  /**
   * 初始化存储库
   */
  initialize(): Promise<void>;

  /**
   * 关闭存储库连接
   */
  close(): Promise<void>;
} 