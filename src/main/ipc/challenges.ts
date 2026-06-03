import { ipcMain } from 'electron'
import { getDatabase } from '../db'
import { mkdirSync, existsSync, rmSync } from 'fs'
import { join } from 'path'

function getChallengeDir(compDir: string, category: string, name: string): string {
  return join(compDir, category, name)
}

export function registerChallengeHandlers(): void {
  // Get all challenges for a competition
  ipcMain.handle('challenges:getByCompetition', (_event, compId: number) => {
    const db = getDatabase()
    return db.prepare(
      'SELECT * FROM challenges WHERE competition_id = ? ORDER BY category, name'
    ).all(compId)
  })

  // Create a new challenge (creates folder in competition directory)
  ipcMain.handle('challenges:create', (_event, compId: number, name: string, category: string) => {
    const db = getDatabase()
    const comp = db.prepare('SELECT directory FROM competitions WHERE id = ?').get(compId) as any
    if (!comp?.directory) {
      throw new Error('Competition directory not found')
    }

    const dirPath = getChallengeDir(comp.directory, category, name)

    // Ensure parent category directory exists
    const categoryDir = join(comp.directory, category)
    if (!existsSync(categoryDir)) {
      mkdirSync(categoryDir, { recursive: true })
    }

    // Create challenge directory
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true })
    }

    const result = db.prepare(
      'INSERT INTO challenges (competition_id, name, category, directory) VALUES (?, ?, ?, ?)'
    ).run(compId, name, category, dirPath)

    return db.prepare('SELECT * FROM challenges WHERE id = ?').get(result.lastInsertRowid)
  })

  // Update challenge status
  ipcMain.handle('challenges:updateStatus', (_event, id: number, status: string) => {
    const db = getDatabase()
    db.prepare('UPDATE challenges SET status = ? WHERE id = ?').run(status, id)
    return db.prepare('SELECT * FROM challenges WHERE id = ?').get(id)
  })

  // Update challenge fields (name, category, notes)
  ipcMain.handle('challenges:update', (_event, id: number, fields: { name?: string; category?: string; notes?: string }) => {
    const db = getDatabase()
    const challenge = db.prepare('SELECT * FROM challenges WHERE id = ?').get(id) as any
    if (!challenge) throw new Error('Challenge not found')

    const newName = fields.name ?? challenge.name
    const newCategory = fields.category ?? challenge.category
    const newNotes = fields.notes ?? challenge.notes

    // If name or category changed, rename/move directory
    if ((fields.name && fields.name !== challenge.name) || (fields.category && fields.category !== challenge.category)) {
      const comp = db.prepare('SELECT directory FROM competitions WHERE id = ?').get(challenge.competition_id) as any
      if (comp?.directory) {
        const oldPath = challenge.directory
        const newPath = getChallengeDir(comp.directory, newCategory, newName)
        if (oldPath && existsSync(oldPath) && oldPath !== newPath) {
          // Create parent category dir if needed
          const newCategoryDir = join(comp.directory, newCategory)
          if (!existsSync(newCategoryDir)) {
            mkdirSync(newCategoryDir, { recursive: true })
          }
          // Move directory
          try {
            const { renameSync } = require('fs')
            renameSync(oldPath, newPath)
          } catch { /* best effort */ }
        }
        db.prepare(
          'UPDATE challenges SET name = ?, category = ?, notes = ?, directory = ? WHERE id = ?'
        ).run(newName, newCategory, newNotes, newPath, id)
      }
    } else {
      db.prepare('UPDATE challenges SET name = ?, category = ?, notes = ? WHERE id = ?')
        .run(newName, newCategory, newNotes, id)
    }

    return db.prepare('SELECT * FROM challenges WHERE id = ?').get(id)
  })

  // Delete a challenge (optionally keep files)
  ipcMain.handle('challenges:delete', (_event, id: number, keepFiles?: boolean) => {
    const db = getDatabase()
    const challenge = db.prepare('SELECT * FROM challenges WHERE id = ?').get(id) as any
    if (!challenge) throw new Error('Challenge not found')

    if (!keepFiles && challenge.directory && existsSync(challenge.directory)) {
      rmSync(challenge.directory, { recursive: true, force: true })
    }

    db.prepare('DELETE FROM challenges WHERE id = ?').run(id)
    return { success: true }
  })

  // Auto-update competition solved status based on challenges
  ipcMain.handle('challenges:updateCompSolved', (_event, compId: number) => {
    const db = getDatabase()
    const challenges = db.prepare(
      'SELECT status FROM challenges WHERE competition_id = ?'
    ).all(compId) as any[]

    const total = challenges.length
    const solved = challenges.filter(c => c.status === 'solved').length
    const allSolved = total > 0 && total === solved ? 1 : 0

    db.prepare('UPDATE competitions SET solved = ? WHERE id = ?').run(allSolved, compId)
    return { total, solved, allSolved: !!allSolved }
  })
}
