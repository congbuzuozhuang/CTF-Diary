import Database from 'better-sqlite3'
import { mkdirSync, existsSync } from 'fs'
import { dirname } from 'path'
import { getDbPath } from '../utils/paths'

let db: Database.Database | null = null

/**
 * Initialize the SQLite database.
 * Creates the database file and runs migrations.
 */
export function initDatabase(): Database.Database {
  const dbPath = getDbPath()

  // Ensure data directory exists
  const dataDir = dirname(dbPath)
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }

  db = new Database(dbPath)

  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  // Run migrations
  runMigrations(db)

  return db
}

/**
 * Get the database instance.
 * Must be called after initDatabase().
 */
export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

/**
 * Create all tables if they don't exist.
 */
function runMigrations(database: Database.Database): void {
  database.exec(`
    -- 比赛表
    CREATE TABLE IF NOT EXISTS competitions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      ctftime_id  INTEGER,
      name        TEXT NOT NULL,
      start_date  TEXT,
      end_date    TEXT,
      url         TEXT,
      format      TEXT,
      weight      REAL,
      status      TEXT DEFAULT 'upcoming',
      directory   TEXT,
      notes       TEXT,
      created_at  TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- 打卡表
    CREATE TABLE IF NOT EXISTS checkins (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      date        TEXT UNIQUE NOT NULL,
      content     TEXT,
      tags        TEXT DEFAULT '[]',
      mood        TEXT DEFAULT '',
      created_at  TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- 文件标签表
    CREATE TABLE IF NOT EXISTS file_tags (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path       TEXT NOT NULL,
      tag             TEXT NOT NULL,
      competition_id  INTEGER REFERENCES competitions(id) ON DELETE CASCADE
    );

    -- 设置表
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)

  // Add unique index on ctftime_id for upsert operations (IF NOT EXISTS safe)
  database.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_competitions_ctftime_id
    ON competitions(ctftime_id)
  `)

  // Insert default settings if not exist
  const insertDefault = database.prepare(
    'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)'
  )

  insertDefault.run('theme', 'light')
  insertDefault.run('font_size', '16')
  insertDefault.run('language', 'zh')
  insertDefault.run('background_image', '')
}

/**
 * Close the database connection.
 */
export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}
