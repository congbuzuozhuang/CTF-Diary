import { get } from 'https'
import type { IncomingMessage } from 'http'

export interface CtftimeEventRaw {
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

const CTFTIME_API = 'https://ctftime.org/api/v1/events/'

/**
 * Fetch upcoming events from CTFtime API.
 * @param limit Maximum number of events to fetch (default 100)
 */
export function fetchCtftimeEvents(limit: number = 100): Promise<CtftimeEventRaw[]> {
  return new Promise((resolve, reject) => {
    const url = `${CTFTIME_API}?limit=${limit}`

    get(url, {
      headers: {
        'User-Agent': 'CTF-Diary/1.5'
      }
    }, (res: IncomingMessage) => {
      // Follow redirect if needed
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, CTFTIME_API).href
        get(redirectUrl, {
          headers: { 'User-Agent': 'CTF-Diary/1.5' }
        }, (redirectRes: IncomingMessage) => {
          consumeResponse(redirectRes, resolve, reject)
        }).on('error', reject)
        return
      }

      consumeResponse(res, resolve, reject)
    }).on('error', reject)
  })
}

function consumeResponse(
  res: IncomingMessage,
  resolve: (value: CtftimeEventRaw[]) => void,
  reject: (reason: Error) => void
): void {
  const { statusCode } = res
  if (statusCode !== 200) {
    reject(new Error(`CTFtime API returned status ${statusCode}`))
    res.resume()
    return
  }

  let data = ''
  res.setEncoding('utf8')
  res.on('data', (chunk: string) => { data += chunk })
  res.on('end', () => {
    try {
      const events = JSON.parse(data) as CtftimeEventRaw[]
      resolve(events)
    } catch (err) {
      reject(new Error(`Failed to parse CTFtime response: ${err}`))
    }
  })
  res.on('error', reject)
}
