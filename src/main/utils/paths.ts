import { app } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'

/**
 * Get the base data directory for storing user data.
 * In development: project_root/data/
 * In production: userData/
 */
export function getDataDir(): string {
  if (!app.isPackaged) {
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

// ── Config file for custom paths ──

interface AppConfig {
  competitionsDir?: string
}

function getConfigPath(): string {
  return join(getDataDir(), 'config.json')
}

function readConfig(): AppConfig {
  try {
    const p = getConfigPath()
    if (existsSync(p)) {
      return JSON.parse(readFileSync(p, 'utf-8'))
    }
  } catch { /* ignore */ }
  return {}
}

function writeConfig(config: AppConfig): void {
  const dir = getDataDir()
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(getConfigPath(), JSON.stringify(config, null, 2), 'utf-8')
}

export function getCustomCompetitionsDir(): string | null {
  const cfg = readConfig()
  return cfg.competitionsDir?.trim() || null
}

export function setCustomCompetitionsDir(dirPath: string | null): void {
  const cfg = readConfig()
  if (dirPath) {
    cfg.competitionsDir = dirPath
  } else {
    delete cfg.competitionsDir
  }
  writeConfig(cfg)
}

// ── Competition dirs (may be overridden by config.json) ──

export function getCompetitionsDir(): string {
  const custom = getCustomCompetitionsDir()
  if (custom) return custom
  return join(getDataDir(), 'competitions')
}

export function getCompetitionDir(competitionId: number): string {
  return join(getCompetitionsDir(), String(competitionId))
}

// ── CVE dirs ──

export function getCvesDir(): string {
  return join(getDataDir(), 'cves')
}

export function getCveDir(cveId: number): string {
  return join(getCvesDir(), String(cveId))
}
