import { getLeagues, searchLeagues, PRIORITY_LEAGUE_IDS, ApiFootballError } from '@scoremate/api'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/leagues[?priority=true][?search=query]
 * - `?priority=true` – filter to the hardcoded priority leagues only
 * - `?search=query`  – search leagues by name / country
 */
export async function GET(request: NextRequest) {
  const priorityOnly = request.nextUrl.searchParams.get('priority') === 'true'
  const search = request.nextUrl.searchParams.get('search') ?? ''

  try {
    if (search.trim()) {
      const leagues = await searchLeagues(search)
      return NextResponse.json({ data: leagues })
    }

    let leagues = await getLeagues()

    if (priorityOnly) {
      const prioritySet = new Set(PRIORITY_LEAGUE_IDS)
      leagues = leagues.filter((l) => prioritySet.has(l.id))
    }

    return NextResponse.json({ data: leagues })
  } catch (err) {
    if (err instanceof ApiFootballError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('[/api/leagues]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
