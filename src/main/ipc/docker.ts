import { ipcMain } from 'electron'
import { execSync, spawn } from 'child_process'
import { getDatabase } from '../db'

/**
 * Run a Docker CLI command and return the stdout as string.
 */
function docker(args: string[]): string {
  return execSync(`docker ${args.join(' ')}`, {
    encoding: 'utf-8',
    timeout: 120000, // 2 minutes max for image operations
    windowsHide: true
  }).trim()
}

/**
 * Run a Docker CLI command asynchronously (for long-running commands like load).
 */
function dockerAsync(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('docker', args, {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe']
    })

    let stdout = ''
    let stderr = ''

    child.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString()
    })

    child.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString()
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim())
      } else {
        reject(new Error(stderr || `Docker command failed with exit code ${code}`))
      }
    })

    child.on('error', (err) => {
      reject(new Error(`Failed to run docker: ${err.message}`))
    })
  })
}

export function registerDockerHandlers(): void {
  // Check if Docker is available
  ipcMain.handle('docker:checkAvailable', () => {
    try {
      const version = docker(['--version'])
      return { available: true, version }
    } catch {
      return { available: false }
    }
  })

  // List all Docker images
  ipcMain.handle('docker:listImages', () => {
    try {
      const output = docker(['images', '--format', '{{json .}}'])
      if (!output) return []

      return output.split('\n').map(line => {
        try {
          return JSON.parse(line)
        } catch {
          return null
        }
      }).filter(Boolean)
    } catch {
      return []
    }
  })

  // Import a Docker image from a tar file
  ipcMain.handle('docker:importImage', async (_event, filePath: string, tag?: string) => {
    try {
      const args = ['load', '-i', filePath]
      await dockerAsync(args)

      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // Tag a Docker image
  ipcMain.handle('docker:tagImage', (_event, sourceImage: string, newTag: string) => {
    try {
      docker(['tag', sourceImage, newTag])
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // Run a container (background, persistent)
  ipcMain.handle('docker:runContainer', async (_event, cveId: number, options: {
    imageName: string
    portMappings?: string[]
    envVars?: string[]
    name?: string
  }) => {
    try {
      const args = ['run', '-d']

      // Port mappings
      if (options.portMappings && options.portMappings.length > 0) {
        for (const mapping of options.portMappings) {
          args.push('-p', mapping)
        }
      }

      // Environment variables
      if (options.envVars && options.envVars.length > 0) {
        for (const env of options.envVars) {
          args.push('-e', env)
        }
      }

      // Container name
      const containerName = options.name || `cve-${cveId}-container`
      args.push('--name', containerName)
      args.push(options.imageName)

      const containerId = await dockerAsync(args)

      return { success: true, containerId: containerId.slice(0, 12), containerName }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // Run a temporary container (auto-remove on exit)
  ipcMain.handle('docker:runTempContainer', async (_event, options: {
    imageName: string
    portMappings?: string[]
    envVars?: string[]
    name?: string
  }) => {
    try {
      const args = ['run', '--rm']

      // Port mappings
      if (options.portMappings && options.portMappings.length > 0) {
        for (const mapping of options.portMappings) {
          args.push('-p', mapping)
        }
      }

      // Environment variables
      if (options.envVars && options.envVars.length > 0) {
        for (const env of options.envVars) {
          args.push('-e', env)
        }
      }

      // Container name
      const containerName = options.name || `cve-temp-${Date.now()}`
      args.push('--name', containerName)
      args.push(options.imageName)

      // Note: temp containers (--rm) run in foreground via execSync since they auto-cleanup
      // We use spawn so the process doesn't block the main thread
      const containerId = await dockerAsync(args)

      return { success: true, containerId: containerId.slice(0, 12), containerName }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // Stop a container
  ipcMain.handle('docker:stopContainer', (_event, containerId: string) => {
    try {
      docker(['stop', containerId])
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // Remove a container
  ipcMain.handle('docker:removeContainer', (_event, containerId: string) => {
    try {
      docker(['rm', containerId])
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // Get container status
  ipcMain.handle('docker:getContainerStatus', (_event, containerId: string) => {
    try {
      const output = docker(['inspect', '--format', '{{json .State}}', containerId])
      const state = JSON.parse(output)

      return {
        running: state.Running === true,
        status: state.Status || 'unknown',
        startedAt: state.StartedAt || '',
        finishedAt: state.FinishedAt || ''
      }
    } catch (err: any) {
      return { running: false, status: 'not found' }
    }
  })

  // Get container logs
  ipcMain.handle('docker:getContainerLogs', (_event, containerId: string, lines: number = 100) => {
    try {
      return docker(['logs', '--tail', String(lines), containerId])
    } catch (err: any) {
      return `Error fetching logs: ${err.message}`
    }
  })

  // Remove a Docker image
  ipcMain.handle('docker:removeImage', (_event, imageName: string, force: boolean = false) => {
    try {
      const args = ['rmi']
      if (force) args.push('-f')
      args.push(imageName)
      docker(args)
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // Link a Docker image to a CVE
  ipcMain.handle('docker:linkImageToCve', (_event, cveId: number, imageName: string) => {
    try {
      const db = getDatabase()

      // Verify the image exists
      try {
        docker(['image', 'inspect', imageName])
      } catch {
        return { success: false, error: `Image "${imageName}" not found in Docker` }
      }

      // Update the CVE record
      db.prepare("UPDATE cves SET docker_image = ?, updated_at = datetime('now', 'localtime') WHERE id = ?").run(imageName, cveId)

      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })
}
