import { ipcMain } from 'electron'
import { getDatabase } from '../db'
import { setupCompetitionDirs } from '../services/filesystem'
import { fetchCtftimeEvents } from '../services/ctftime'

export function registerCompetitionHandlers(): void {
  // Get all competitions from local DB
  ipcMain.handle('competitions:getList', () => {
    const db = getDatabase()
    return db.prepare('SELECT * FROM competitions ORDER BY start_date DESC').all()
  })

  // Fetch events from CTFtime API and upsert into local DB
  ipcMain.handle('competitions:getFromCtftime', async () => {
    const db = getDatabase()

    // Fetch from CTFtime API
    const events = await fetchCtftimeEvents(100)

    // Upsert each event into local DB
    const upsert = db.prepare(`
      INSERT INTO competitions (ctftime_id, name, start_date, end_date, url, format, weight, status)
      VALUES (@ctftime_id, @name, @start_date, @end_date, @url, @format, @weight, @status)
      ON CONFLICT(ctftime_id) DO UPDATE SET
        name       = excluded.name,
        start_date = excluded.start_date,
        end_date   = excluded.end_date,
        url        = excluded.url,
        format     = excluded.format,
        weight     = excluded.weight
    `)

    const now = new Date().toISOString()

    const insertMany = db.transaction(() => {
      for (const event of events) {
        const eventStart = new Date(event.start)
        const eventEnd = new Date(event.finish)
        const nowDate = new Date()

        // Determine status
        let status: string
        if (eventEnd < nowDate) {
          status = 'finished'
        } else if (eventStart <= nowDate && eventEnd >= nowDate) {
          status = 'running'
        } else {
          status = 'upcoming'
        }

        upsert.run({
          ctftime_id: event.id,
          name: event.title,
          start_date: event.start,
          end_date: event.finish,
          url: event.ctftime_url,
          format: event.format,
          weight: event.weight,
          status
        })
      }
    })

    insertMany()

    // Return the updated list
    return db.prepare('SELECT * FROM competitions ORDER BY start_date DESC').all()
  })

  // Mark a competition as participating: create dirs + update status
  ipcMain.handle('competitions:participate', (_event, id: number) => {
    const db = getDatabase()

    // Update status in DB
    db.prepare("UPDATE competitions SET status = 'participating' WHERE id = ?").run(id)

    // Create directory structure
    const dirPath = setupCompetitionDirs(id)

    // Update directory path in DB
    db.prepare('UPDATE competitions SET directory = ? WHERE id = ?').run(dirPath, id)

    // Return updated competition
    return db.prepare('SELECT * FROM competitions WHERE id = ?').get(id)
  })

  // Get competition detail
  ipcMain.handle('competitions:getDetail', (_event, id: number) => {
    const db = getDatabase()
    return db.prepare('SELECT * FROM competitions WHERE id = ?').get(id)
  })

  // Manually create a competition
  ipcMain.handle('competitions:create', (_event, data: {
    name: string
    start_date: string
    end_date: string
    format?: string
    url?: string
    weight?: number
    auto_participate?: boolean
  }) => {
    const db = getDatabase()

    // Determine status based on dates
    const now = new Date()
    const start = new Date(data.start_date)
    const end = new Date(data.end_date)

    let status: string
    if (data.auto_participate) {
      status = 'participating'
    } else if (end < now) {
      status = 'finished'
    } else if (start <= now && end >= now) {
      status = 'running'
    } else {
      status = 'upcoming'
    }

    const result = db.prepare(`
      INSERT INTO competitions (name, start_date, end_date, url, format, weight, status)
      VALUES (@name, @start_date, @end_date, @url, @format, @weight, @status)
    `).run({
      name: data.name,
      start_date: data.start_date,
      end_date: data.end_date,
      url: data.url || '',
      format: data.format || 'Jeopardy',
      weight: data.weight ?? 0,
      status
    })

    const newId = result.lastInsertRowid as number

    // If auto-participate, set up directories
    if (data.auto_participate) {
      const dirPath = setupCompetitionDirs(newId)
      db.prepare('UPDATE competitions SET directory = ? WHERE id = ?').run(dirPath, newId)
    }

    return db.prepare('SELECT * FROM competitions WHERE id = ?').get(newId)
  })
}
