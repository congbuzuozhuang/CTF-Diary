import { ipcMain } from 'electron'
import { spawn } from 'child_process'
import { existsSync } from 'fs'

export function registerPythonHandlers(): void {
  // Check if Python is available
  ipcMain.handle('python:checkPython', () => {
    return new Promise((resolve) => {
      const proc = spawn('python', ['--version'], { timeout: 5000 })
      let output = ''

      proc.stdout?.on('data', (data) => {
        output += data.toString()
      })
      proc.stderr?.on('data', (data) => {
        output += data.toString()
      })

      proc.on('close', (code) => {
        resolve({
          available: code === 0,
          version: output.trim()
        })
      })

      proc.on('error', () => {
        resolve({
          available: false,
          version: ''
        })
      })
    })
  })

  // Run a Python script
  ipcMain.handle('python:runScript', (_event, scriptPath: string) => {
    return new Promise((resolve) => {
      if (!existsSync(scriptPath)) {
        resolve({
          success: false,
          stdout: '',
          stderr: `File not found: ${scriptPath}`,
          exitCode: -1
        })
        return
      }

      const proc = spawn('python', [scriptPath], {
        timeout: 60000, // 60 second timeout
        cwd: require('path').dirname(scriptPath)
      })

      let stdout = ''
      let stderr = ''

      proc.stdout?.on('data', (data) => {
        stdout += data.toString()
      })

      proc.stderr?.on('data', (data) => {
        stderr += data.toString()
      })

      proc.on('close', (code) => {
        resolve({
          success: code === 0,
          stdout,
          stderr,
          exitCode: code
        })
      })

      proc.on('error', (err) => {
        resolve({
          success: false,
          stdout,
          stderr: err.message,
          exitCode: -1
        })
      })
    })
  })
}
