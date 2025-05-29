import sqlite3 from 'sqlite3'
import { open, Database } from 'sqlite'
import { ChatRepository } from '../../domain/repositories/ChatRepository'
import { Chat } from '../../domain/entities/Chat'
import { Message } from '../../domain/entities/Message'
import { ChatId, CharacterId } from '../../shared/types'

/**
 * SQLite聊天存储库实现
 */
export class SQLiteChatRepository implements ChatRepository {
  private db: Database | null = null

  constructor(private readonly dbPath: string) {}

  async initialize(): Promise<void> {
    this.db = await open({
      filename: this.dbPath,
      driver: sqlite3.Database
    })

    await this.createTables()
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('数据库未初始化')

    // 创建chats表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        character_id TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `)

    // 创建messages表
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        chat_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        metadata TEXT,
        FOREIGN KEY (chat_id) REFERENCES chats (id) ON DELETE CASCADE
      )
    `)

    // 创建索引
    await this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
      CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
      CREATE INDEX IF NOT EXISTS idx_chats_character_id ON chats(character_id);
    `)
  }

  async save(chat: Chat): Promise<void> {
    if (!this.db) throw new Error('数据库未初始化')

    const chatData = chat.toData()

    // 开始事务
    await this.db.exec('BEGIN TRANSACTION')

    try {
      // 保存或更新chat记录
      await this.db.run(`
        INSERT OR REPLACE INTO chats (id, title, character_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `, [
        chatData.id,
        chatData.title,
        chatData.characterId,
        chatData.createdAt.toISOString(),
        chatData.updatedAt.toISOString()
      ])

      // 删除现有消息
      await this.db.run('DELETE FROM messages WHERE chat_id = ?', [chatData.id])

      // 插入所有消息
      for (const messageData of chatData.messages) {
        await this.db.run(`
          INSERT INTO messages (id, chat_id, role, content, timestamp, metadata)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          messageData.id,
          chatData.id,
          messageData.role,
          messageData.content,
          messageData.timestamp.toISOString(),
          messageData.metadata ? JSON.stringify(messageData.metadata) : null
        ])
      }

      await this.db.exec('COMMIT')

    } catch (error) {
      await this.db.exec('ROLLBACK')
      throw error
    }
  }

  async findById(id: ChatId): Promise<Chat | null> {
    if (!this.db) throw new Error('数据库未初始化')

    // 获取chat记录
    const chatRow = await this.db.get(`
      SELECT id, title, character_id, created_at, updated_at
      FROM chats WHERE id = ?
    `, [id])

    if (!chatRow) return null

    // 获取消息
    const messageRows = await this.db.all(`
      SELECT id, role, content, timestamp, metadata
      FROM messages 
      WHERE chat_id = ? 
      ORDER BY timestamp ASC
    `, [id])

    // 重构消息实体
    const messages = messageRows.map(row => 
      Message.fromData({
        id: row.id,
        role: row.role,
        content: row.content,
        timestamp: new Date(row.timestamp),
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined
      })
    )

    // 重构Chat实体
    return Chat.fromData({
      id: chatRow.id,
      title: chatRow.title,
      characterId: chatRow.character_id || undefined,
      messages,
      createdAt: new Date(chatRow.created_at),
      updatedAt: new Date(chatRow.updated_at)
    })
  }

  async findByCharacterId(characterId: CharacterId): Promise<Chat[]> {
    if (!this.db) throw new Error('数据库未初始化')

    const chatRows = await this.db.all(`
      SELECT id, title, character_id, created_at, updated_at
      FROM chats 
      WHERE character_id = ?
      ORDER BY updated_at DESC
    `, [characterId])

    const chats: Chat[] = []
    for (const row of chatRows) {
      const chat = await this.findById(row.id)
      if (chat) chats.push(chat)
    }

    return chats
  }

  async findAll(): Promise<Chat[]> {
    if (!this.db) throw new Error('数据库未初始化')

    const chatRows = await this.db.all(`
      SELECT id, title, character_id, created_at, updated_at
      FROM chats 
      ORDER BY updated_at DESC
    `)

    const chats: Chat[] = []
    for (const row of chatRows) {
      const chat = await this.findById(row.id)
      if (chat) chats.push(chat)
    }

    return chats
  }

  async delete(id: ChatId): Promise<boolean> {
    if (!this.db) throw new Error('数据库未初始化')

    const result = await this.db.run('DELETE FROM chats WHERE id = ?', [id])
    return (result.changes || 0) > 0
  }

  async exists(id: ChatId): Promise<boolean> {
    if (!this.db) throw new Error('数据库未初始化')

    const result = await this.db.get(
      'SELECT 1 FROM chats WHERE id = ? LIMIT 1',
      [id]
    )
    return !!result
  }
} 