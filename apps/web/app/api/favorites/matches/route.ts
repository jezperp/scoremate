import { getMatchesByDate } from '@scoremate/api'
import { ApiFootballError } from '@scoremate/api'
import type { Match } from '@scoremate/types'
import { NextRequest, NextResponse } from 'next/server'

const LIVE_STATUSES = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE'])
const FINISHED_STATUSES = new Set(['FT', 'AET', 'PEN', 'AWD', 'WO'])

function offsetDateStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * GET /api/favorites/matches?teamIds=1,2,3
 * Returns { live: Match[], upcoming: Match[] } filtered to the given team IDs.
 * - live: live matches + matches finished within the last 5 hours (today only)
 * - upcoming: NS matches for today + next 7 days
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const teamIdsParam = searchParams.get('teamIds')

  if (!teamIdsParam) {
    return NextResponse.json({ error: 'Missing teamIds parameter' }, { status: 400 })
  }

  const teamIds = new Set(
    teamIdsParam
      .split(',')
      .map(Number)
      .filter((n) => !isNaN(n) && n > 0),
  )

  if (teamIds.size === 0) {
    return NextResponse.json({ error: 'No valid teamIds provided' }, { status: 400 })
  }

  const today = getTodayStr()

  // Fetch today + next 7 days in parallel
  const dates = Array.from({ length: 8 }, (_, i) => offsetDateStr(today, i))

  try {
    const results = await Promise.all(dates.map((date) => getMatchesByDate(date)))

    const allMatches = results.flat()

    // Filter to user's favorite teams
    const favoriteMatches = allMatches.filter(
      (m) => teamIds.has(m.home.id) || teamIds.has(m.away.id),
    )

    const now = Date.now()
    const fiveHoursMs = 5 * 60 * 60 * 1000

    const live: Match[] = []
    const upcoming: Match[] = []

    for (const match of favoriteMatches) {
      if (LIVE_STATUSES.has(match.status.short)) {
        live.push(match)
      } else if (FINISHED_STATUSES.has(match.status.short)) {
        const kickoff = new Date(match.date).getTime()
        if (now - kickoff <= fiveHoursMs) {
          live.push(match)
        }
      } else {
        // Upcoming (NS / TBD)
        upcoming.push(match)
      }
    }

    // Sort live: live matches first, then by kickoff desc
    live.sort((a, b) => {
      const aIsLive = LIVE_STATUSES.has(a.status.short)
      const bIsLive = LIVE_STATUSES.has(b.status.short)
      if (aIsLive && !bIsLive) return -1
      if (!aIsLive && bIsLive) return 1
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })

    // Sort upcoming by kickoff asc
    upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return NextResponse.json({ data: { live, upcoming } })
  } catch (err) {
    if (err instanceof ApiFootballError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('[/api/favorites/matches]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
