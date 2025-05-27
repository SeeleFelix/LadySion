import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import { PresetRepository } from '../../domain/ports/PresetRepository';
import { PresetType, Preset, InstructPreset, ContextPreset, SystemPromptPreset, MasterPreset } from '../../domain/models/preset/Preset';

/**
 * SQLite预设存储库
 */
export class SQLitePresetRepository implements PresetRepository {
  private db: Database | null = null;
  private dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  /**
   * 初始化数据库
   */
  async initialize(): Promise<void> {
    // 确保数据库目录存在
    const fs = await import('fs/promises');
    const dbDir = path.dirname(this.dbPath);
    await fs.mkdir(dbDir, { recursive: true });

    // 打开数据库连接
    this.db = await open({
      filename: this.dbPath,
      driver: sqlite3.Database
    });

    // 创建表结构
    await this.createTables();
  }

  /**
   * 创建数据库表
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('数据库未初始化');

    // 创建预设表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS presets (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_presets_type ON presets(type);
      CREATE INDEX IF NOT EXISTS idx_presets_name ON presets(type, name);
      
      -- 创建配置表
      CREATE TABLE IF NOT EXISTS configurations (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  /**
   * 获取所有指定类型的预设
   */
  async getAllPresets(type: PresetType): Promise<Preset[]> {
    if (!this.db) throw new Error('数据库未初始化');

    const rows = await this.db.all(
      'SELECT * FROM presets WHERE type = ? ORDER BY name',
      [type]
    );

    return rows.map(row => this.deserializePreset(row));
  }

  /**
   * 获取所有指定类型的预设 (PresetRepository接口)
   */
  async getAll(type: PresetType): Promise<Preset[]> {
    return this.getAllPresets(type);
  }

  /**
   * 根据ID获取预设
   */
  async getPresetById(type: PresetType, id: string): Promise<Preset | null> {
    if (!this.db) throw new Error('数据库未初始化');

    const row = await this.db.get(
      'SELECT * FROM presets WHERE type = ? AND id = ?',
      [type, id]
    );

    return row ? this.deserializePreset(row) : null;
  }

  /**
   * 根据ID获取预设 (PresetRepository接口)
   */
  async getById(type: PresetType, id: string): Promise<Preset | null> {
    return this.getPresetById(type, id);
  }

  /**
   * 根据名称获取预设
   */
  async getPresetByName(type: PresetType, name: string): Promise<Preset | null> {
    if (!this.db) throw new Error('数据库未初始化');

    const row = await this.db.get(
      'SELECT * FROM presets WHERE type = ? AND name = ?',
      [type, name]
    );

    return row ? this.deserializePreset(row) : null;
  }

  /**
   * 根据名称获取预设 (PresetRepository接口)
   */
  async getByName(type: PresetType, name: string): Promise<Preset | null> {
    return this.getPresetByName(type, name);
  }

  /**
   * 保存预设
   */
  async savePreset(type: PresetType, preset: Preset): Promise<void> {
    if (!this.db) throw new Error('数据库未初始化');

    const data = JSON.stringify(preset);
    const now = new Date().toISOString();

    await this.db.run(`
      INSERT OR REPLACE INTO presets (id, type, name, description, data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 
        COALESCE((SELECT created_at FROM presets WHERE id = ?), ?),
        ?
      )
    `, [
      preset.id, type, preset.name, preset.description, data,
      preset.id, now, now
    ]);
  }

  /**
   * 保存预设 (PresetRepository接口)
   */
  async save(type: PresetType, preset: Preset): Promise<Preset> {
    await this.savePreset(type, preset);
    return preset;
  }

  /**
   * 删除预设
   */
  async deletePreset(type: PresetType, id: string): Promise<void> {
    if (!this.db) throw new Error('数据库未初始化');

    await this.db.run(
      'DELETE FROM presets WHERE type = ? AND id = ?',
      [type, id]
    );
  }

  /**
   * 删除预设 (PresetRepository接口)
   */
  async delete(type: PresetType, id: string): Promise<void> {
    return this.deletePreset(type, id);
  }

  /**
   * 导入主预设
   */
  async importMasterPreset(masterPreset: MasterPreset): Promise<void> {
    if (!this.db) throw new Error('数据库未初始化');

    // 开始事务
    await this.db.run('BEGIN TRANSACTION');

    try {
      // 导入各个子预设
      if (masterPreset.instruct) {
        await this.savePreset(PresetType.INSTRUCT, masterPreset.instruct);
      }

      if (masterPreset.context) {
        await this.savePreset(PresetType.CONTEXT, masterPreset.context);
      }

      if (masterPreset.systemPrompt) {
        await this.savePreset(PresetType.SYSTEM_PROMPT, masterPreset.systemPrompt);
      }

      // 提交事务
      await this.db.run('COMMIT');
    } catch (error) {
      // 回滚事务
      await this.db.run('ROLLBACK');
      throw error;
    }
  }

  /**
   * 保存配置
   */
  async saveConfiguration(key: string, value: any): Promise<void> {
    if (!this.db) throw new Error('数据库未初始化');

    await this.db.run(`
      INSERT OR REPLACE INTO configurations (key, value, updated_at)
      VALUES (?, ?, ?)
    `, [key, JSON.stringify(value), new Date().toISOString()]);
  }

  /**
   * 获取配置
   */
  async getConfiguration(key: string): Promise<any> {
    if (!this.db) throw new Error('数据库未初始化');

    const row = await this.db.get(
      'SELECT value FROM configurations WHERE key = ?',
      [key]
    );

    return row ? JSON.parse(row.value) : null;
  }

  /**
   * 反序列化预设
   */
  private deserializePreset(row: any): Preset {
    const basePreset = JSON.parse(row.data);
    
    // 确保时间字段正确
    basePreset.createdAt = new Date(row.created_at);
    basePreset.updatedAt = new Date(row.updated_at);
    
    return basePreset;
  }

  /**
   * 关闭数据库连接
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
} 