import { ipcMain } from 'electron'
import {
  readDirectory,
  readFileContent,
  writeFileContent,
  deleteFile,
  importFile,
  setupCompetitionDirs,
  getCompDir
} from '../services/filesystem'
import { mkdirSync, existsSync } from 'fs'

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
}
