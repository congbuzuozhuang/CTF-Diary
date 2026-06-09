import { ipcMain } from 'electron'
import { getDatabase } from '../db'

interface SearchResult {
  source: 'diary' | 'competition' | 'challenge' | 'cve'
  id: number
  title: string
  subtitle: string
  snippet: string
  navigateTo: string
}

interface RawRow {
  source: 'diary' | 'competition' | 'challenge' | 'cve'
  id: number
  title: string | null
  subtitle: string | null
  text_content: string | null
  tags: string | null
  ref_id: number | null
}

const SNIPPET_LENGTH = 80

function extractSnippet(row: RawRow, term: string): string {
  const searchTargets = [
    row.text_content,
    row.tags,
    row.subtitle
  ].filter(Boolean) as string[]

  const lowerTerm = term.toLowerCase()

  for (const target of searchTargets) {
    const idx = target.toLowerCase().indexOf(lowerTerm)
    if (idx !== -1) {
      const start = Math.max(0, idx - Math.floor((SNIPPET_LENGTH - term.length) / 2))
      const end = Math.min(target.length, start + SNIPPET_LENGTH)
      let snippet = target.slice(start, end)
      if (start > 0) snippet = '…' + snippet
      if (end < target.length) snippet = snippet + '…'
      return snippet
    }
  }

  // Fallback: return title
  return row.title || ''
}

function buildNavigateTo(row: RawRow): string {
  switch (row.source) {
    case 'diary':
      return '/diary'
    case 'competition':
      return `/competitions/${row.id}`
    case 'challenge':
      return `/competitions/${row.ref_id ?? row.id}`
    case 'cve':
      return `/cves/${row.id}`
  }
}

const SOURCE_LABELS: Record<string, string> = {
  diary: '日记',
  competition: '比赛',
  challenge: '题目',
  cve: 'CVE 复现'
}

const QUERY = `
  SELECT 'diary' as source, id, date as title, mood as subtitle,
         content as text_content, tags, NULL as ref_id
  FROM checkins
  WHERE content LIKE @term ESCAPE '\\'
     OR tags LIKE @term ESCAPE '\\'
     OR mood LIKE @term ESCAPE '\\'

  UNION ALL

  SELECT 'competition' as source, id, name as title, status as subtitle,
         notes as text_content, NULL as tags, NULL as ref_id
  FROM competitions
  WHERE name LIKE @term ESCAPE '\\'
     OR notes LIKE @term ESCAPE '\\'

  UNION ALL

  SELECT 'challenge' as source, c.id, c.name as title,
         COALESCE(c.category, '') || ' / ' || c.status as subtitle,
         c.notes as text_content, NULL as tags, c.competition_id as ref_id
  FROM challenges c
  WHERE c.name LIKE @term ESCAPE '\\'
     OR c.category LIKE @term ESCAPE '\\'
     OR c.notes LIKE @term ESCAPE '\\'

  UNION ALL

  SELECT 'cve' as source, id, cve_number as title, severity as subtitle,
         description as text_content, notes as tags, NULL as ref_id
  FROM cves
  WHERE cve_number LIKE @term ESCAPE '\\'
     OR title LIKE @term ESCAPE '\\'
     OR description LIKE @term ESCAPE '\\'
     OR notes LIKE @term ESCAPE '\\'

  ORDER BY source, title
  LIMIT 50
`

function escapeLikeWildcards(term: string): string {
  return term.replace(/[%_\\]/g, '\\$&')
}

export function registerSearchHandlers(): void {
  ipcMain.handle('search:query', (_event, term: string) => {
    if (!term || term.trim().length === 0) {
      return { results: [], grouped: [] }
    }

    const db = getDatabase()
    const likeTerm = `%${escapeLikeWildcards(term.trim())}%`

    const rows = db.prepare(QUERY).all({ term: likeTerm }) as RawRow[]

    const results: SearchResult[] = rows.map(row => ({
      source: row.source,
      id: row.id,
      title: row.title || '(未命名)',
      subtitle: row.subtitle || '',
      snippet: extractSnippet(row, term.trim()),
      navigateTo: buildNavigateTo(row)
    }))

    // Group results by source
    const grouped: Record<string, SearchResult[]> = {}
    for (const r of results) {
      if (!grouped[r.source]) grouped[r.source] = []
      grouped[r.source]!.push(r)
    }

    const groupedArray = Object.entries(grouped).map(([source, items]) => ({
      source,
      label: SOURCE_LABELS[source] || source,
      items: items.slice(0, 5)
    }))

    return {
      results,
      grouped: groupedArray,
      total: results.length
    }
  })
}
