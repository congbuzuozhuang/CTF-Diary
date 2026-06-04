import { ipcMain } from 'electron'
import { getDatabase } from '../db'
import { setupCveDirs, removeCveDirs } from '../services/filesystem'

export function registerCvesHandlers(): void {
  // Get all CVEs, ordered by updated_at descending
  ipcMain.handle('cves:getList', () => {
    const db = getDatabase()
    return db.prepare('SELECT * FROM cves ORDER BY updated_at DESC').all()
  })

  // Get a single CVE by ID
  ipcMain.handle('cves:getById', (_event, id: number) => {
    const db = getDatabase()
    return db.prepare('SELECT * FROM cves WHERE id = ?').get(id)
  })

  // Create a new CVE entry
  ipcMain.handle('cves:create', (_event, data: {
    cve_number: string
    title?: string
    severity?: string
    cvss_score?: number
    description?: string
  }) => {
    const db = getDatabase()

    // Validate required fields
    if (!data.cve_number || !data.cve_number.trim()) {
      throw new Error('CVE number is required')
    }

    // Check for duplicate CVE number
    const existing = db.prepare('SELECT id FROM cves WHERE cve_number = ?').get(data.cve_number.trim())
    if (existing) {
      throw new Error(`CVE ${data.cve_number} already exists`)
    }

    const result = db.prepare(`
      INSERT INTO cves (cve_number, title, severity, cvss_score, description, status)
      VALUES (@cve_number, @title, @severity, @cvss_score, @description, 'pending')
    `).run({
      cve_number: data.cve_number.trim(),
      title: data.title || '',
      severity: data.severity || '',
      cvss_score: data.cvss_score ?? 0,
      description: data.description || ''
    })

    const newId = result.lastInsertRowid as number

    // Set up directory structure
    const dirPath = setupCveDirs(newId)
    db.prepare('UPDATE cves SET directory = ? WHERE id = ?').run(dirPath, newId)

    return db.prepare('SELECT * FROM cves WHERE id = ?').get(newId)
  })

  // Update CVE fields
  ipcMain.handle('cves:update', (_event, id: number, fields: Record<string, unknown>) => {
    const db = getDatabase()

    const cve = db.prepare('SELECT * FROM cves WHERE id = ?').get(id) as any
    if (!cve) {
      throw new Error(`CVE ${id} not found`)
    }

    // Build dynamic UPDATE
    const allowedFields = ['cve_number', 'title', 'severity', 'cvss_score', 'description', 'status', 'docker_image', 'docker_container', 'notes']
    const setClauses: string[] = []
    const params: Record<string, unknown> = { id }

    for (const field of allowedFields) {
      if (field in fields) {
        setClauses.push(`${field} = @${field}`)
        params[field] = fields[field]
      }
    }

    if (setClauses.length === 0) {
      return cve
    }

    // Always update updated_at
    setClauses.push("updated_at = datetime('now', 'localtime')")

    db.prepare(`UPDATE cves SET ${setClauses.join(', ')} WHERE id = @id`).run(params)

    return db.prepare('SELECT * FROM cves WHERE id = ?').get(id)
  })

  // Update CVE status only
  ipcMain.handle('cves:updateStatus', (_event, id: number, status: string) => {
    const db = getDatabase()

    db.prepare("UPDATE cves SET status = ?, updated_at = datetime('now', 'localtime') WHERE id = ?").run(status, id)

    return db.prepare('SELECT * FROM cves WHERE id = ?').get(id)
  })

  // Delete a CVE
  ipcMain.handle('cves:delete', (_event, id: number) => {
    const db = getDatabase()

    const cve = db.prepare('SELECT * FROM cves WHERE id = ?').get(id) as any
    if (!cve) {
      throw new Error(`CVE ${id} not found`)
    }

    // Remove files and DB record
    removeCveDirs(id)
    db.prepare('DELETE FROM cves WHERE id = ?').run(id)

    return { success: true }
  })
}
