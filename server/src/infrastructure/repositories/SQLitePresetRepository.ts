import { DB } from "sqlite";
import { PresetRepository } from "@/domain/repositories/PresetRepository.ts";
import { MasterPreset, Preset, PresetType } from "@/domain/entities/Preset.ts";

/**
 * SQLite预设存储库实现
 */
export class SQLitePresetRepository implements PresetRepository {
  private db!: DB;
  private dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  /**
   * 初始化数据库
   */
  async initialize(): Promise<void> {
    this.db = new DB(this.dbPath);
    this.createTables();
  }

  /**
   * 创建数据库表
   */
  private createTables(): void {
    // 创建预设表
    this.db.execute(`
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
  async getAll(type: PresetType): Promise<Preset[]> {
    const rows = this.db.queryEntries(
      "SELECT id, name, description, data FROM presets WHERE type = ? ORDER BY name",
      [type],
    );
    return rows.map((row) =>
      JSON.parse(row.data as string) as Preset
    );
  }

  /**
   * 根据ID获取预设
   */
  async getById(type: PresetType, id: string): Promise<Preset | null> {
    const rows = this.db.queryEntries(
      "SELECT id, name, description, data FROM presets WHERE type = ? AND id = ?",
      [type, id],
    );
    return rows.length > 0 ? JSON.parse(rows[0].data as string) as Preset : null;
  }

  /**
   * 根据名称获取预设
   */
  async getByName(type: PresetType, name: string): Promise<Preset | null> {
    const rows = this.db.queryEntries(
      "SELECT id, name, description, data FROM presets WHERE type = ? AND name = ?",
      [type, name],
    );
    return rows.length > 0 ? JSON.parse(rows[0].data as string) as Preset : null;
  }

  /**
   * 保存预设
   */
  async save(type: PresetType, preset: Preset): Promise<Preset> {
    const data = JSON.stringify(preset);
    const now = new Date().toISOString();
    this.db.execute("BEGIN");
    try {
      this.db.query(
        `
        INSERT OR REPLACE INTO presets (id, type, name, description, data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 
          COALESCE((SELECT created_at FROM presets WHERE id = ?), ?),
          ?
        )
      `,
        [
          preset.id,
          type,
          preset.name,
          preset.description,
          data,
          preset.id,
          now,
          now,
        ],
      );
      this.db.execute("COMMIT");
      return preset;
    } catch (e) {
      this.db.execute("ROLLBACK");
      throw e;
    }
  }

  /**
   * 删除预设
   */
  async delete(type: PresetType, id: string): Promise<void> {
    this.db.query(
      "DELETE FROM presets WHERE type = ? AND id = ?",
      [type, id],
    );
  }

  /**
   * 检查预设是否存在
   */
  async exists(type: PresetType, id: string): Promise<boolean> {
    if (!this.db) throw new Error("数据库未初始化");

    const rows = this.db.queryEntries(
      "SELECT 1 FROM presets WHERE type = ? AND id = ?",
      [type, id],
    );

    return rows.length > 0;
  }

  /**
   * 导入主预设
   */
  async importMasterPreset(masterPreset: MasterPreset): Promise<void> {
    if (!this.db) throw new Error("数据库未初始化");

    // 开始事务
    this.db.execute("BEGIN TRANSACTION");

    try {
      // 导入各个子预设
      if (masterPreset.instruct) {
        await this.save(PresetType.INSTRUCT, masterPreset.instruct);
      }

      if (masterPreset.context) {
        await this.save(PresetType.CONTEXT, masterPreset.context);
      }

      if (masterPreset.systemPrompt) {
        await this.save(PresetType.SYSTEM_PROMPT, masterPreset.systemPrompt);
      }

      if (masterPreset.postHistoryInstructions) {
        await this.save(
          PresetType.POST_HISTORY_INSTRUCTIONS,
          masterPreset.postHistoryInstructions,
        );
      }

      // 提交事务
      this.db.execute("COMMIT");
    } catch (error) {
      // 回滚事务
      this.db.execute("ROLLBACK");
      throw error;
    }
  }

  /**
   * 保存配置
   */
  async saveConfiguration(key: string, value: any): Promise<void> {
    if (!this.db) throw new Error("数据库未初始化");

    const valueStr = JSON.stringify(value);
    const now = new Date().toISOString();

    this.db.query(
      `
      INSERT OR REPLACE INTO configurations (key, value, updated_at)
      VALUES (?, ?, ?)
    `,
      [key, valueStr, now],
    );
  }

  /**
   * 获取配置
   */
  async getConfiguration(key: string): Promise<any> {
    if (!this.db) throw new Error("数据库未初始化");

    const rows = this.db.queryEntries(
      "SELECT value FROM configurations WHERE key = ?",
      [key],
    );

    if (rows.length === 0) {
      return null;
    }

    return JSON.parse(rows[0].value as string);
  }

  /**
   * 关闭数据库连接
   */
  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
    }
  }
}
