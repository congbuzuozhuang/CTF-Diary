import { ipcMain, dialog, BrowserWindow } from 'electron'
import { createWriteStream, existsSync, mkdirSync, copyFileSync, rmSync } from 'fs'
import { join, dirname } from 'path'
import { execSync } from 'child_process'
import { getDatabase } from '../db'

function getBackupFileName(): string {
  const now = new Date()
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
  return `CTF-Diary-backup-${stamp}.zip`
}

export function registerBackupHandlers(): void {
  // Export: create backup zip
  ipcMain.handle('backup:export', async () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return { success: false, error: 'No window' }

    const fileName = getBackupFileName()
    const result = await dialog.showSaveDialog(win, {
      title: '导出备份',
      defaultPath: fileName,
      filters: [{ name: 'ZIP 压缩包', extensions: ['zip'] }]
    })

    if (result.canceled || !result.filePath) {
      return { success: false, cancelled: true }
    }

    try {
      const archiver = require('archiver')
      const output = createWriteStream(result.filePath)
      const archive = archiver('zip', { zlib: { level: 9 } })

      await new Promise<void>((resolve, reject) => {
        output.on('close', resolve)
        archive.on('error', reject)

        archive.pipe(output)

        // Add database
        const db = getDatabase()
        try {
          db.close()
        } catch { /* might already be closed */ }
        const dbPath = join(process.env.APPDATA || '', 'ctf-diary', 'ctf-diary.db')
        if (existsSync(dbPath)) {
          archive.file(dbPath, { name: 'ctf-diary.db' })
        }

        // Add competitions directory
        const compsDir = join(process.env.APPDATA || '', 'ctf-diary', 'competitions')
        if (existsSync(compsDir)) {
          archive.directory(compsDir, 'competitions')
        }

        archive.finalize()
      })

      return { success: true, path: result.filePath }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // Import: restore backup zip
  ipcMain.handle('backup:import', async () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return { success: false, error: 'No window' }

    const result = await dialog.showOpenDialog(win, {
      title: '导入备份',
      filters: [{ name: 'ZIP 压缩包', extensions: ['zip'] }],
      properties: ['openFile']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, cancelled: true }
    }

    const zipPath = result.filePaths[0]
    const dataDir = join(process.env.APPDATA || '', 'ctf-diary')
    const tempDir = join(dataDir, '_restore_temp')

    try {
      // Extract zip to temp directory
      if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true })
      }
      mkdirSync(tempDir, { recursive: true })

      // Use PowerShell Expand-Archive on Windows
      if (process.platform === 'win32') {
        execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${tempDir}' -Force"`, {
          timeout: 60000,
          windowsHide: true
        })
      } else {
        execSync(`unzip -o "${zipPath}" -d "${tempDir}"`, {
          timeout: 60000
        })
      }

      // Close DB before replacing
      const db = getDatabase()
      try { db.close() } catch { /* ok */ }

      // Restore database
      const tempDb = join(tempDir, 'ctf-diary.db')
      const targetDb = join(dataDir, 'ctf-diary.db')
      if (existsSync(tempDb)) {
        copyFileSync(tempDb, targetDb)
      }

      // Restore competitions directory
      const tempComps = join(tempDir, 'competitions')
      const targetComps = join(dataDir, 'competitions')
      if (existsSync(tempComps)) {
        if (existsSync(targetComps)) {
          rmSync(targetComps, { recursive: true, force: true })
        }
        const { cpSync } = require('fs')
        cpSync(tempComps, targetComps, { recursive: true })
      }

      // Cleanup
      rmSync(tempDir, { recursive: true, force: true })

      return { success: true }
    } catch (err: any) {
      // Cleanup temp dir
      try { rmSync(tempDir, { recursive: true, force: true }) } catch { /* ok */ }
      return { success: false, error: err.message }
    }
  })
}
