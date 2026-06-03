import { ipcMain } from 'electron'
import { getDatabase } from '../db'

export function registerSettingsHandlers(): void {
  // Get a single setting
  ipcMain.handle('settings:get', (_event, key: string) => {
    const db = getDatabase()
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
    return row?.value ?? null
  })

  // Set a setting value (upsert)
  ipcMain.handle('settings:set', (_event, key: string, value: string) => {
    const db = getDatabase()
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value)
    return true
  })

  // Get all settings as key-value object
  ipcMain.handle('settings:getAll', () => {
    const db = getDatabase()
    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[]
    const result: Record<string, string> = {}
    for (const row of rows) {
      result[row.key] = row.value
    }
    return result
  })
}
