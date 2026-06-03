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
}
