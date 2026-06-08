/**
 * Shared formatting utilities — extracted from duplicated Vue component functions.
 */

/** Format an ISO date string to a readable Chinese locale date */
export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

/** Format date with time (for competition schedule) */
export function formatDateTime(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/** Relative date: "今天" / "昨天" / "X 天前" / locale date */
export function formatDateRelative(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / 86400000)

  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days} 天前`
  return d.toLocaleDateString('zh-CN')
}

/** Format competition duration from start/end ISO strings */
export function getDuration(startStr: string, endStr: string): string {
  if (!startStr || !endStr) return '—'
  const start = new Date(startStr)
  const end = new Date(endStr)
  const diffMs = end.getTime() - start.getTime()
  const hours = Math.round(diffMs / 3600000)
  if (hours < 24) return `${hours} 小时`
  const days = Math.floor(hours / 24)
  const remainHours = hours % 24
  return remainHours > 0 ? `${days} 天 ${remainHours} 小时` : `${days} 天`
}

/** Format file size in human-readable units */
export function formatSize(bytes?: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

/** Detect code language from file extension */
export function detectLanguage(path: string): 'markdown' | 'python' | 'text' {
  const ext = path.split('.').pop()?.toLowerCase()
  if (ext === 'py') return 'python'
  if (ext === 'md' || ext === 'markdown') return 'markdown'
  return 'text'
}

/** Status badge color classes (layout classes belong in templates) */
export function statusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    'upcoming': 'bg-blue-500/15 text-blue-400',
    'running': 'bg-green-500/15 text-green-400',
    'participating': 'bg-purple-500/15 text-purple-400',
    'finished': 'bg-gray-500/15 text-gray-400'
  }
  return map[status] || 'bg-gray-500/15 text-gray-400'
}

/** Status label in Chinese */
export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    'upcoming': '即将开始',
    'running': '进行中',
    'participating': '已参加',
    'finished': '已结束'
  }
  return map[status] || status
}
