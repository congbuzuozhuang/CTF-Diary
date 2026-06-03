import { ipcMain } from 'electron'
import { getDatabase } from '../db'

export function registerDiaryHandlers(): void {
  // Check in for a specific date
  ipcMain.handle('diary:checkIn', (_event, date: string, content: string, tags: string, mood: string) => {
    const db = getDatabase()
    db.prepare(
      `INSERT INTO checkins (date, content, tags, mood)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(date) DO UPDATE SET
         content = excluded.content,
         tags = excluded.tags,
         mood = excluded.mood`
    ).run(date, content, tags || '[]', mood || '')
    return true
  })

  // Get checkins for a month
  ipcMain.handle('diary:getCheckins', (_event, year: number, month: number) => {
    const db = getDatabase()
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endMonth = month === 12 ? 1 : month + 1
    const endYear = month === 12 ? year + 1 : year
    const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`

    return db.prepare(
      `SELECT * FROM checkins WHERE date >= ? AND date < ? ORDER BY date`
    ).all(startDate, endDate)
  })

  // Get a specific day's log
  ipcMain.handle('diary:getDayLog', (_event, date: string) => {
    const db = getDatabase()
    return db.prepare('SELECT * FROM checkins WHERE date = ?').get(date)
  })

  // Get diary stats
  ipcMain.handle('diary:getStats', () => {
    const db = getDatabase()
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

    const totalDays = (db.prepare('SELECT COUNT(*) as count FROM checkins').get() as any).count
    const thisMonthDays = (db.prepare(
      "SELECT COUNT(*) as count FROM checkins WHERE date LIKE ?"
    ).get(`${thisMonth}%`) as any).count

    // Calculate streak: count consecutive days with checkins going backward from today
    const streakDays = calculateStreak(db, todayStr)

    return {
      totalDays,
      streakDays,
      totalCheckins: totalDays,
      thisMonthDays
    }
  })
}

/**
 * Calculate consecutive check-in streak from today backwards.
 */
function calculateStreak(db: ReturnType<typeof getDatabase>, todayStr: string): number {
  const rows = db.prepare(
    'SELECT date FROM checkins ORDER BY date DESC'
  ).all() as { date: string }[]

  if (rows.length === 0) return 0

  // Parse dates and sort descending
  const dates = rows.map(r => r.date).sort().reverse()

  // Check if today or yesterday has a checkin
  const today = new Date(todayStr)
  let streak = 0
  let checkDate = new Date(today)

  for (const dateStr of dates) {
    const expected = checkDate.toISOString().split('T')[0]
    if (dateStr === expected) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else if (dateStr < expected) {
      break
    }
    // If dateStr > expected, skip (shouldn't happen, future dates can't be checked in)
  }

  return streak
}
