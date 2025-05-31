import { DB } from "sqlite";
import { ChatRepository } from "@/domain/repositories/ChatRepository.ts";
import { Chat } from "@/domain/entities/Chat.ts";
import { Message } from "@/domain/entities/Message.ts";
import type { CharacterId, ChatId, MessageRole } from "@/shared/types";

/**
 * SQLite聊天存储库实现（使用 Deno sqlite）
 */
export class SQLiteChatRepository implements ChatRepository {
  private db!: DB;

  constructor(private readonly dbPath: string) {}

  async initialize(): Promise<void> {
    this.db = new DB(this.dbPath);
    this.createTables();
  }

  private createTables(): void {
    this.db.execute(`
      CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        character_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        chat_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        metadata TEXT,
        FOREIGN KEY (chat_id) REFERENCES chats (id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
      CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
      CREATE INDEX IF NOT EXISTS idx_chats_character_id ON chats(character_id);
    `);
  }

  async save(chat: Chat): Promise<void> {
    this.db.execute("BEGIN");
    try {
      const d = chat.toData();
      this.db.query(
        `
        INSERT OR REPLACE INTO chats (id, title, character_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `,
        [
          d.id,
          d.title,
          d.characterId,
          d.createdAt.toISOString(),
          d.updatedAt.toISOString(),
        ],
      );
      this.db.query("DELETE FROM messages WHERE chat_id = ?", [d.id]);
      for (const m of d.messages) {
        this.db.query(
          `
          INSERT INTO messages (id, chat_id, role, content, timestamp, metadata)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
          [
            m.id,
            d.id,
            m.role,
            m.content,
            m.timestamp.toISOString(),
            m.metadata ? JSON.stringify(m.metadata) : null,
          ],
        );
      }
      this.db.execute("COMMIT");
    } catch (err) {
      this.db.execute("ROLLBACK");
      throw err;
    }
  }

  async findById(id: ChatId): Promise<Chat | null> {
    const rows = this.db.queryEntries(
      "SELECT id, title, character_id, created_at, updated_at FROM chats WHERE id = ?",
      [id],
    );
    if (rows.length === 0) return null;
    const row = rows[0];
    const cid = row.id as string;
    const title = row.title as string;
    const characterId = row.character_id as string | null;
    const ca = row.created_at as string;
    const ua = row.updated_at as string;

    const msgs = this.db.queryEntries(
      "SELECT id, role, content, timestamp, metadata FROM messages WHERE chat_id = ? ORDER BY timestamp ASC",
      [id],
    );
    const messages = msgs.map((msg) =>
      Message.fromData({
        id: msg.id as string,
        role: msg.role as MessageRole,
        content: msg.content as string,
        timestamp: new Date(msg.timestamp as string),
        metadata: msg.metadata ? JSON.parse(msg.metadata as string) : undefined,
      })
    );
    return Chat.fromData({
      id: cid,
      title,
      characterId: characterId || undefined,
      messages,
      createdAt: new Date(ca),
      updatedAt: new Date(ua),
    });
  }

  async findByCharacterId(characterId: CharacterId): Promise<Chat[]> {
    const rows = this.db.queryEntries(
      "SELECT id FROM chats WHERE character_id = ? ORDER BY updated_at DESC",
      [characterId],
    );
    const ids = rows.map((row) => row.id as string);
    const res: Chat[] = [];
    for (const cid of ids) {
      const c = await this.findById(cid);
      if (c) res.push(c);
    }
    return res;
  }

  async findAll(): Promise<Chat[]> {
    const rows = this.db.queryEntries(
      "SELECT id FROM chats ORDER BY updated_at DESC",
      [],
    );
    const ids = rows.map((row) => row.id as string);
    const res: Chat[] = [];
    for (const cid of ids) {
      const c = await this.findById(cid);
      if (c) res.push(c);
    }
    return res;
  }

  async delete(id: ChatId): Promise<boolean> {
    this.db.query("DELETE FROM chats WHERE id = ?", [id]);
    return true;
  }

  async exists(id: ChatId): Promise<boolean> {
    const rows = this.db.queryEntries(
      "SELECT 1 FROM chats WHERE id = ? LIMIT 1",
      [id],
    );
    return rows.length > 0;
  }

  async close(): Promise<void> {
    this.db.close();
  }
}
