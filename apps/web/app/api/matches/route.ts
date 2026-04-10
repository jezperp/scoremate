import { getMatchesByDate } from '@scoremate/api'
import { ApiFootballError } from '@scoremate/api'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/matches?date=YYYY-MM-DD[&leagueId=39]
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const date = searchParams.get('date')
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: 'Missing or invalid `date` parameter (expected YYYY-MM-DD)' },
      { status: 400 },
    )
  }

  const leagueParam = searchParams.get('leagueId')
  const leagueId = leagueParam ? Number(leagueParam) : undefined

  if (leagueParam !== null && (isNaN(leagueId!) || leagueId! <= 0)) {
    return NextResponse.json(
      { error: 'Invalid `leagueId` parameter' },
      { status: 400 },
    )
  }

  try {
    const matches = await getMatchesByDate(date, leagueId)
    return NextResponse.json({ data: matches })
  } catch (err) {
    if (err instanceof ApiFootballError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('[/api/matches]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
