import { ipcMain, app, shell, BrowserWindow } from 'electron'

const ALLOWED_PROTOCOLS = ['http:', 'https:']

export function registerAppHandlers(): void {
  ipcMain.handle('app:getVersion', () => {
    return app.getVersion()
  })

  ipcMain.handle('app:openExternal', (_event, url: string) => {
    try {
      const parsed = new URL(url)
      if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
        return false
      }
    } catch {
      return false
    }
    return shell.openExternal(url)
  })

  // Window controls for frameless title bar
  ipcMain.handle('window:minimize', () => {
    BrowserWindow.getFocusedWindow()?.minimize()
  })

  ipcMain.handle('window:maximize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win?.isMaximized()) {
      win.unmaximize()
    } else {
      win?.maximize()
    }
  })

  ipcMain.handle('window:close', () => {
    BrowserWindow.getFocusedWindow()?.close()
  })

  ipcMain.handle('window:isMaximized', () => {
    return BrowserWindow.getFocusedWindow()?.isMaximized() ?? false
  })
}
