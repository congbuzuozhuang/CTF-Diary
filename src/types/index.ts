// ── Competition ──
export interface Competition {
  id: number
  ctftime_id: number | null
  name: string
  start_date: string
  end_date: string
  url: string
  format: string
  weight: number
  status: 'upcoming' | 'participating' | 'finished'
  directory: string | null
  notes: string | null
  solved: number
  created_at: string
}

// ── Challenge ──
export interface Challenge {
  id: number
  competition_id: number
  name: string
  category: string
  status: 'unsolved' | 'solved' | 'attempting'
  directory: string | null
  notes: string | null
  created_at: string
}

export interface CtftimeEvent {
  organizers: { name: string }[]
  ctftime_url: string
  weight: number
  duration: { hours: number; days: number }
  title: string
  format: string
  start: string
  finish: string
  id: number
  url: string
  logo: string
  description: string
}

// ── Diary ──
export interface Checkin {
  id: number
  date: string
  content: string
  tags: string[]
  mood: string
  created_at: string
}

export interface DiaryStats {
  totalDays: number
  streakDays: number
  totalCheckins: number
  thisMonthDays: number
}

// ── Files ──
export interface FileEntry {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  mtime?: string
  children?: FileEntry[]
}

// ── Settings ──
export interface AppSettings {
  background_image: string
  theme: 'dark' | 'light'
  font_size: string
  language: 'zh' | 'en'
  card_opacity: string
  notify_enabled: string
  notify_before_days: string
}

// ── CVE ──
export interface Cve {
  id: number
  cve_number: string
  title: string
  severity: string
  cvss_score: number
  description: string
  status: 'pending' | 'reproducing' | 'completed'
  directory: string
  docker_image: string
  docker_container: string
  notes: string
  created_at: string
  updated_at: string
}

export interface CreateCveInput {
  cve_number: string
  title?: string
  severity?: string
  cvss_score?: number
  description?: string
}

export interface CveUpdateFields {
  cve_number?: string
  title?: string
  severity?: string
  cvss_score?: number
  description?: string
  status?: string
  docker_image?: string
  docker_container?: string
  notes?: string
}

export interface RunContainerOptions {
  imageName: string
  portMappings?: string[]
  envVars?: string[]
  name?: string
}

export interface DockerImageInfo {
  Repository: string
  Tag: string
  ID: string
  CreatedAt: string
  Size: string
}
