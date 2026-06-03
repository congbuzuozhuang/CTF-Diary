import { ipcMain, Notification, BrowserWindow } from 'electron'
import { getDatabase } from '../db'

interface PendingCompetition {
  id: number
  name: string
  start_date: string
  end_date: string
  status: string
}

function getNotifyBeforeDays(): number {
  const db = getDatabase()
  const row = db.prepare("SELECT value FROM settings WHERE key = 'notify_before_days'").get() as { value: string } | undefined
  return row ? parseInt(row.value, 10) || 3 : 3
}

function isNotifyEnabled(): boolean {
  const db = getDatabase()
  const row = db.prepare("SELECT value FROM settings WHERE key = 'notify_enabled'").get() as { value: string } | undefined
  return row ? row.value === 'true' : true
}

function wasNotified(key: string): boolean {
  const db = getDatabase()
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined
  return row?.value === '1'
}

function markNotified(key: string): void {
  const db = getDatabase()
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, '1')").run(key)
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function daysUntil(iso: string): number {
  const now = new Date()
  const target = new Date(iso)
  // Reset time to compare dates only
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const targetDate = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  return Math.ceil((targetDate.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24))
}

export function checkNotifications(force = false): { notified: number } {
  if (!isNotifyEnabled()) return { notified: 0 }

  const db = getDatabase()
  const beforeDays = getNotifyBeforeDays()
  const now = new Date()

  // Find participating competitions that haven't ended yet
  const comps = db.prepare(`
    SELECT id, name, start_date, end_date, status
    FROM competitions
    WHERE status = 'participating'
    ORDER BY start_date ASC
  `).all() as PendingCompetition[]

  let notified = 0

  for (const comp of comps) {
    const startDate = new Date(comp.start_date)
    const endDate = new Date(comp.end_date)
    const daysLeft = daysUntil(comp.start_date)

    // Skip competitions that have already ended
    if (endDate < now) continue

    // Case 1: Competition starts soon (within notify_before_days, not yet started)
    if (daysLeft >= 0 && daysLeft <= beforeDays) {
      const notifyKey = `notified_soon_${comp.id}_${comp.start_date}`
      if (!wasNotified(notifyKey) || force) {
        const sessionKey = `notify_session_soon_${comp.id}`
        if (!wasNotified(sessionKey) || force) {
          const title = '📅 比赛即将开始'
          const body = daysLeft === 0
            ? `「${comp.name}」今天开始！(${formatDate(comp.start_date)} ~ ${formatDate(comp.end_date)})`
            : `「${comp.name}」将在 ${daysLeft} 天后开始 (${formatDate(comp.start_date)} ~ ${formatDate(comp.end_date)})`

          showNativeNotification(title, body)
          markNotified(notifyKey)
          // Session-only mark to prevent duplicate in same session
          markNotified(sessionKey)
          notified++
        }
      }
    }

    // Case 2: Competition is currently running (started but not ended)
    if (startDate <= now && endDate >= now) {
      const notifyKey = `notified_running_${comp.id}_${comp.start_date}`
      if (!wasNotified(notifyKey) || force) {
        const title = '🚩 比赛正在进行'
        const body = `「${comp.name}」已经开始，截止 ${formatDate(comp.end_date)}`

        showNativeNotification(title, body)
        markNotified(notifyKey)
        notified++
      }
    }
  }

  return { notified }
}

function showNativeNotification(title: string, body: string): void {
  // Try to show Notification even if no window (e.g., app just launched)
  const win = BrowserWindow.getAllWindows()[0]
  if (win && !win.isDestroyed()) {
    const notif = new Notification({ title, body })
    notif.on('click', () => {
      if (!win.isDestroyed()) {
        if (win.isMinimized()) win.restore()
        win.focus()
      }
    })
    notif.show()
  } else {
    // Fallback: show notification without a window
    const notif = new Notification({ title, body })
    notif.show()
  }
}

export function registerNotificationHandlers(): void {
  ipcMain.handle('notifications:checkNow', async () => {
    return checkNotifications(true)
  })

  ipcMain.handle('notifications:getEnabled', () => {
    return isNotifyEnabled()
  })

  ipcMain.handle('notifications:getBeforeDays', () => {
    return getNotifyBeforeDays()
  })
}
