import { app } from 'electron'
import { join } from 'path'

/**
 * Get the data directory for storing user data.
 * In development: project_root/data/
 * In production: userData/
 */
export function getDataDir(): string {
  if (!app.isPackaged) {
    // Development: use project root /data
    return join(app.getAppPath(), 'data')
  }
  return app.getPath('userData')
}

export function getDbPath(): string {
  return join(getDataDir(), 'ctf-diary.db')
}

export function getBackgroundsDir(): string {
  return join(getDataDir(), 'backgrounds')
}

export function getCompetitionsDir(): string {
  return join(getDataDir(), 'competitions')
}

export function getCompetitionDir(competitionId: number): string {
  return join(getCompetitionsDir(), String(competitionId))
}
