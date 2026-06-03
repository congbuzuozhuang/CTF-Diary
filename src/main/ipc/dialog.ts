import { ipcMain, dialog, BrowserWindow } from 'electron'
import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { join, basename } from 'path'
import { getBackgroundsDir } from '../utils/paths'

export function registerDialogHandlers(): void {
  // Open file picker for images
  ipcMain.handle('dialog:openImage', async () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null

    const result = await dialog.showOpenDialog(win, {
      title: '选择背景图片',
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'] }
      ],
      properties: ['openFile']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const sourcePath = result.filePaths[0]

    // Copy to backgrounds directory
    const bgDir = getBackgroundsDir()
    if (!existsSync(bgDir)) {
      mkdirSync(bgDir, { recursive: true })
    }

    const ext = sourcePath.split('.').pop() || 'jpg'
    const targetName = `custom_${Date.now()}.${ext}`
    const targetPath = join(bgDir, targetName)

    copyFileSync(sourcePath, targetPath)

    // Return the path as file:// protocol for renderer
    return `file://${targetPath.replace(/\\/g, '/')}`
  })

  // Remove a custom background
  ipcMain.handle('dialog:removeBackground', (_event, path: string) => {
    try {
      const fs = require('fs')
      // Extract file path from file:// protocol
      const filePath = path.replace('file://', '')
      if (existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
      return true
    } catch {
      return false
    }
  })

  // Open file picker for importing files (any type)
  ipcMain.handle('dialog:openFile', async (_event, options?: { title?: string; filters?: { name: string; extensions: string[] }[] }) => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null

    const result = await dialog.showOpenDialog(win, {
      title: options?.title || '选择文件',
      filters: options?.filters || [{ name: 'All Files', extensions: ['*'] }],
      properties: ['openFile', 'multiSelections']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    return result.filePaths
  })
}
