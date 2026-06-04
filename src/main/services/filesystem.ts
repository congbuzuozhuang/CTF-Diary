import { mkdirSync, existsSync, readdirSync, statSync, readFileSync, writeFileSync, unlinkSync, copyFileSync, rmSync } from 'fs'
import { join, basename } from 'path'
import { getCompetitionDir, getCveDir } from '../utils/paths'

export interface FileEntry {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  mtime?: string
  children?: FileEntry[]
}

/**
 * Recursively read a directory and return a tree structure.
 */
export function readDirectory(dirPath: string): FileEntry[] {
  if (!existsSync(dirPath)) return []

  const entries = readdirSync(dirPath)
  const result: FileEntry[] = []

  for (const entry of entries) {
    // Skip hidden files
    if (entry.startsWith('.')) continue

    const fullPath = join(dirPath, entry)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      result.push({
        name: entry,
        path: fullPath,
        type: 'directory',
        mtime: stat.mtime.toISOString(),
        children: readDirectory(fullPath)
      })
    } else {
      result.push({
        name: entry,
        path: fullPath,
        type: 'file',
        size: stat.size,
        mtime: stat.mtime.toISOString()
      })
    }
  }

  // Directories first, then files, alphabetically
  result.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  return result
}

/**
 * Read a file's content as string.
 */
export function readFileContent(filePath: string): string {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }
  return readFileSync(filePath, 'utf-8')
}

/**
 * Write content to a file.
 */
export function writeFileContent(filePath: string, content: string): boolean {
  writeFileSync(filePath, content, 'utf-8')
  return true
}

/**
 * Delete a file.
 */
export function deleteFile(filePath: string): boolean {
  unlinkSync(filePath)
  return true
}

/**
 * Import/copy a file to destination.
 */
export function importFile(source: string, dest: string): boolean {
  const destDir = join(dest, '..')
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true })
  }
  copyFileSync(source, dest)
  return true
}

/**
 * Create competition directory structure.
 */
export function setupCompetitionDirs(competitionId: number): string {
  const baseDir = getCompetitionDir(competitionId)

  if (!existsSync(baseDir)) {
    mkdirSync(baseDir, { recursive: true })
  }

  // Create required subdirectories
  const subdirs = ['pwn', 're', 'notes']
  for (const dir of subdirs) {
    const dirPath = join(baseDir, dir)
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true })
    }
  }

  return baseDir
}

/**
 * Delete competition directory and all contents.
 */
export function removeCompetitionDirs(competitionId: number): boolean {
  const baseDir = getCompetitionDir(competitionId)
  if (existsSync(baseDir)) {
    rmSync(baseDir, { recursive: true, force: true })
  }
  return true
}

/**
 * Get the competition's base directory path.
 */
export function getCompDir(competitionId: number): string {
  return getCompetitionDir(competitionId)
}

// ── CVE filesystem operations ──

/**
 * Create CVE directory structure.
 */
export function setupCveDirs(cveId: number): string {
  const baseDir = getCveDir(cveId)

  if (!existsSync(baseDir)) {
    mkdirSync(baseDir, { recursive: true })
  }

  // Create subdirectories
  const subdirs = ['exploits', 'poc', 'attachments']
  for (const dir of subdirs) {
    const dirPath = join(baseDir, dir)
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true })
    }
  }

  // Create template files
  const notesPath = join(baseDir, 'notes.md')
  if (!existsSync(notesPath)) {
    writeFileSync(notesPath, `# Notes\n\n## 漏洞分析\n\n## 复现步骤\n\n## 修复建议\n`, 'utf-8')
  }

  const writeupPath = join(baseDir, 'writeup.md')
  if (!existsSync(writeupPath)) {
    writeFileSync(writeupPath, `# Writeup\n\n## 基本信息\n\n## 漏洞原理\n\n## 复现环境\n\n## 利用过程\n\n## 参考链接\n`, 'utf-8')
  }

  return baseDir
}

/**
 * Delete CVE directory and all contents.
 */
export function removeCveDirs(cveId: number): boolean {
  const baseDir = getCveDir(cveId)
  if (existsSync(baseDir)) {
    rmSync(baseDir, { recursive: true, force: true })
  }
  return true
}
