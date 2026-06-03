import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { initDatabase, closeDatabase } from './db'
import { registerSettingsHandlers } from './ipc/settings'
import { registerFilesHandlers } from './ipc/files'
import { registerCompetitionHandlers } from './ipc/competition'
import { registerDiaryHandlers } from './ipc/diary'
import { registerPythonHandlers } from './ipc/python'
import { registerAppHandlers } from './ipc/app'
import { registerDialogHandlers } from './ipc/dialog'
import { registerDataHandlers } from './ipc/data'
import { registerChallengeHandlers } from './ipc/challenges'

const isDev = !app.isPackaged

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    show: false,
    backgroundColor: '#ffffff',
    frame: false,
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for dev / load file for prod
  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Register all IPC handlers before creating window
function registerAllHandlers(): void {
  registerSettingsHandlers()
  registerFilesHandlers()
  registerCompetitionHandlers()
  registerDiaryHandlers()
  registerPythonHandlers()
  registerAppHandlers()
  registerDialogHandlers()
  registerDataHandlers()
  registerChallengeHandlers()
}

app.whenReady().then(() => {
  // Initialize database
  initDatabase()
  console.log('[CTF Diary] Database initialized')

  // Register IPC handlers
  registerAllHandlers()
  console.log('[CTF Diary] IPC handlers registered')

  // Create window
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  closeDatabase()
})
