import { ipcMain, dialog, BrowserWindow } from 'electron'
import {
  readDirectory,
  readFileContent,
  writeFileContent,
  deleteFile,
  importFile,
  setupCompetitionDirs,
  getCompDir
} from '../services/filesystem'
import { mkdirSync, existsSync, createWriteStream, createReadStream, statSync, readdirSync } from 'fs'
import { join, basename } from 'path'
import archiver from 'archiver'
import { getCustomCompetitionsDir, setCustomCompetitionsDir, getDataDir } from '../utils/paths'

export function registerFilesHandlers(): void {
  // Read directory tree
  ipcMain.handle('files:readDir', (_event, dirPath: string) => {
    return readDirectory(dirPath)
  })

  // Read file content
  ipcMain.handle('files:readFile', (_event, filePath: string) => {
    return readFileContent(filePath)
  })

  // Write file content
  ipcMain.handle('files:writeFile', (_event, filePath: string, content: string) => {
    return writeFileContent(filePath, content)
  })

  // Delete file
  ipcMain.handle('files:deleteFile', (_event, filePath: string) => {
    return deleteFile(filePath)
  })

  // Import file (copy source to dest)
  ipcMain.handle('files:importFile', (_event, source: string, dest: string) => {
    return importFile(source, dest)
  })

  // Get competition directory path
  ipcMain.handle('files:getCompetitionDir', (_event, id: number) => {
    return getCompDir(id)
  })

  // Create competition directory structure
  ipcMain.handle('files:setupCompetitionDirs', (_event, id: number) => {
    return setupCompetitionDirs(id)
  })

  // Create a directory
  ipcMain.handle('files:createDirectory', (_event, dirPath: string) => {
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true })
    }
    return { success: true, path: dirPath }
  })

  // ── Config ──

  ipcMain.handle('config:getCompetitionsDir', () => {
    return getCustomCompetitionsDir()
  })

  ipcMain.handle('config:setCompetitionsDir', (_event, dirPath: string | null) => {
    setCustomCompetitionsDir(dirPath)
    return { success: true }
  })

  ipcMain.handle('config:getDataDir', () => {
    return getDataDir()
  })

  // ── Export ──

  ipcMain.handle('export:competition', async (_event, compId: number, compName: string, asZip: boolean) => {
    const srcDir = getCompDir(compId)
    if (!existsSync(srcDir)) {
      throw new Error(`Directory not found: ${srcDir}`)
    }
    return doExport(srcDir, compName, asZip)
  })

  ipcMain.handle('export:challenge', async (_event, challengeDir: string, challengeName: string, asZip: boolean) => {
    if (!existsSync(challengeDir)) {
      throw new Error(`Directory not found: ${challengeDir}`)
    }
    return doExport(challengeDir, challengeName, asZip)
  })
}

async function doExport(srcDir: string, defaultName: string, asZip: boolean): Promise<{ success: boolean; dest?: string }> {
  const win = BrowserWindow.getFocusedWindow()
  if (!win) throw new Error('No window')

  if (asZip) {
    const result = await dialog.showSaveDialog(win, {
      title: '导出为压缩包',
      defaultPath: `${defaultName}.zip`,
      filters: [{ name: 'ZIP 压缩包', extensions: ['zip'] }]
    })
    if (result.canceled || !result.filePath) return { success: false }

    await zipDirectory(srcDir, result.filePath)
    return { success: true, dest: result.filePath }
  } else {
    const result = await dialog.showSaveDialog(win, {
      title: '导出文件夹',
      defaultPath: defaultName,
      properties: ['createDirectory']
    })
    if (result.canceled || !result.filePath) return { success: false }

    copyDirectoryRecursive(srcDir, result.filePath)
    return { success: true, dest: result.filePath }
  }
}

function copyDirectoryRecursive(src: string, dest: string): void {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true })
  }
  const entries = readdirSync(src)
  for (const entry of entries) {
    const srcPath = join(src, entry)
    const destPath = join(dest, entry)
    if (statSync(srcPath).isDirectory()) {
      copyDirectoryRecursive(srcPath, destPath)
    } else {
      const { copyFileSync } = require('fs')
      copyFileSync(srcPath, destPath)
    }
  }
}

function zipDirectory(srcDir: string, destZip: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(destZip)
    const archive = archiver('zip', { zlib: { level: 9 } })

    output.on('close', resolve)
    archive.on('error', reject)

    archive.pipe(output)
    archive.directory(srcDir, basename(srcDir))
    archive.finalize()
  })
}
