import { ipcMain } from 'electron'
import { getDatabase } from '../db'
import { statSync, rmSync, existsSync, unlinkSync } from 'fs'
import { getDbPath, getCompetitionsDir } from '../utils/paths'

function getDataStats() {
  const db = getDatabase()

  const competitions = db.prepare('SELECT COUNT(*) as count FROM competitions').get() as any
  const checkins = db.prepare('SELECT COUNT(*) as count FROM checkins').get() as any
  const fileTags = db.prepare('SELECT COUNT(*) as count FROM file_tags').get() as any
  const finished = db.prepare("SELECT COUNT(*) as count FROM competitions WHERE status = 'finished'").get() as any

  let dbSize = 0
  try {
    dbSize = statSync(getDbPath()).size
  } catch { /* ignore */ }

  return {
    competitions: competitions.count,
    checkins: checkins.count,
    fileTags: fileTags.count,
    finishedCompetitions: finished.count,
    dbSize
  }
}

/** Delete a competition from DB AND its filesystem directory */
function deleteCompetitionFully(compId: number): boolean {
  const db = getDatabase()
  const comp = db.prepare('SELECT directory FROM competitions WHERE id = ?').get(compId) as any
  if (comp?.directory && existsSync(comp.directory)) {
    rmSync(comp.directory, { recursive: true, force: true })
  }
  db.prepare('DELETE FROM file_tags WHERE competition_id = ?').run(compId)
  db.prepare('DELETE FROM competitions WHERE id = ?').run(compId)
  return true
}

/** Delete finished competitions (DB + files) */
function clearFinishedCompetitions(): { deleted: number } {
  const db = getDatabase()
  const finished = db.prepare("SELECT id, directory FROM competitions WHERE status = 'finished'").all() as any[]
  for (const comp of finished) {
    if (comp.directory && existsSync(comp.directory)) {
      rmSync(comp.directory, { recursive: true, force: true })
    }
  }
  db.prepare('DELETE FROM file_tags WHERE competition_id IN (SELECT id FROM competitions WHERE status = \'finished\')').run()
  const result = db.prepare("DELETE FROM competitions WHERE status = 'finished'").run()
  return { deleted: result.changes }
}

/** Delete all competitions (DB + files) */
function clearAllCompetitions(): { deleted: number } {
  const db = getDatabase()
  const all = db.prepare('SELECT id, directory FROM competitions').all() as any[]
  for (const comp of all) {
    if (comp.directory && existsSync(comp.directory)) {
      rmSync(comp.directory, { recursive: true, force: true })
    }
  }
  db.prepare('DELETE FROM file_tags').run()
  const result = db.prepare('DELETE FROM competitions').run()
  return { deleted: result.changes }
}

/** Clear everything and also remove all competition directories */
function clearAll(): { success: boolean } {
  const db = getDatabase()

  // Remove all competition directories
  const compsDir = getCompetitionsDir()
  if (existsSync(compsDir)) {
    rmSync(compsDir, { recursive: true, force: true })
  }

  db.exec(`
    DELETE FROM file_tags;
    DELETE FROM cves;
    DELETE FROM competitions;
    DELETE FROM checkins;
    DELETE FROM settings;
  `)
  // Re-insert default settings
  const insertDefault = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)')
  insertDefault.run('theme', 'light')
  insertDefault.run('font_size', '16')
  insertDefault.run('language', 'zh')
  insertDefault.run('background_image', '')
  insertDefault.run('card_opacity', '0.85')
  return { success: true }
}

export function registerDataHandlers(): void {
  ipcMain.handle('data:getStats', () => {
    return getDataStats()
  })

  ipcMain.handle('data:clearFinishedCompetitions', () => {
    return clearFinishedCompetitions()
  })

  ipcMain.handle('data:clearAllCompetitions', () => {
    return clearAllCompetitions()
  })

  ipcMain.handle('data:clearCheckins', () => {
    const db = getDatabase()
    const result = db.prepare('DELETE FROM checkins').run()
    return { deleted: result.changes }
  })

  ipcMain.handle('data:clearAll', () => {
    return clearAll()
  })

  // Delete a single competition (DB + files)
  ipcMain.handle('data:clearCompetition', (_event, compId: number) => {
    return deleteCompetitionFully(compId)
  })

  // Delete a single file
  ipcMain.handle('data:deleteFile', (_event, filePath: string) => {
    if (existsSync(filePath)) {
      const stat = statSync(filePath)
      if (stat.isDirectory()) {
        rmSync(filePath, { recursive: true, force: true })
      } else {
        unlinkSync(filePath)
      }
      return { success: true }
    }
    return { success: false, error: 'File not found' }
  })
}
