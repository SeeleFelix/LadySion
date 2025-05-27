import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Preset, PresetType } from '../../domain/models/preset/Preset';
import { PresetRepository } from '../../domain/ports/PresetRepository';

/**
 * 文件系统预设存储适配器
 */
export class FileSystemPresetRepository implements PresetRepository {
  private baseDir: string;
  
  constructor(baseDir: string = 'data/presets') {
    this.baseDir = baseDir;
    this.ensureDirectoryExists();
  }
  
  /**
   * 确保预设目录存在
   */
  private ensureDirectoryExists(): void {
    const types = Object.values(PresetType);
    
    // 创建基础目录
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
    
    // 创建预设类型子目录
    for (const type of types) {
      const typeDir = path.join(this.baseDir, type);
      if (!fs.existsSync(typeDir)) {
        fs.mkdirSync(typeDir, { recursive: true });
      }
    }
  }
  
  /**
   * 获取预设类型目录路径
   * @param type 预设类型
   * @returns 目录路径
   */
  private getTypeDirPath(type: PresetType): string {
    return path.join(this.baseDir, type);
  }
  
  /**
   * 获取预设文件路径
   * @param type 预设类型
   * @param id 预设ID
   * @returns 文件路径
   */
  private getPresetFilePath(type: PresetType, id: string): string {
    return path.join(this.getTypeDirPath(type), `${id}.json`);
  }
  
  /**
   * 从文件中读取预设
   * @param filePath 文件路径
   * @returns 预设对象
   */
  private readPresetFromFile(filePath: string): Preset {
    const data = fs.readFileSync(filePath, 'utf8');
    const preset = JSON.parse(data) as Preset;
    
    // 确保日期字段是Date对象
    preset.createdAt = new Date(preset.createdAt);
    preset.updatedAt = new Date(preset.updatedAt);
    
    return preset;
  }
  
  /**
   * 将预设写入文件
   * @param filePath 文件路径
   * @param preset 预设对象
   */
  private writePresetToFile(filePath: string, preset: Preset): void {
    const data = JSON.stringify(preset, null, 2);
    fs.writeFileSync(filePath, data, 'utf8');
  }
  
  async getAll(type: PresetType): Promise<Preset[]> {
    const typeDir = this.getTypeDirPath(type);
    const files = fs.readdirSync(typeDir);
    
    const presets: Preset[] = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(typeDir, file);
        try {
          const preset = this.readPresetFromFile(filePath);
          presets.push(preset);
        } catch (error) {
          console.error(`读取预设文件出错: ${filePath}`, error);
        }
      }
    }
    
    return presets;
  }
  
  async getById(type: PresetType, id: string): Promise<Preset | null> {
    const filePath = this.getPresetFilePath(type, id);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    try {
      return this.readPresetFromFile(filePath);
    } catch (error) {
      console.error(`读取预设文件出错: ${filePath}`, error);
      return null;
    }
  }
  
  async getByName(type: PresetType, name: string): Promise<Preset | null> {
    const presets = await this.getAll(type);
    return presets.find(preset => preset.name === name) || null;
  }
  
  async save(type: PresetType, preset: Preset): Promise<Preset> {
    // 如果没有ID，则生成一个
    if (!preset.id) {
      preset.id = uuidv4();
      preset.createdAt = new Date();
      preset.updatedAt = new Date();
    } else {
      preset.updatedAt = new Date();
    }
    
    const filePath = this.getPresetFilePath(type, preset.id);
    this.writePresetToFile(filePath, preset);
    
    return preset;
  }
  
  async delete(type: PresetType, id: string): Promise<void> {
    const filePath = this.getPresetFilePath(type, id);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
} 