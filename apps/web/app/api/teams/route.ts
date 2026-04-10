import { searchTeams, ApiFootballError } from '@scoremate/api'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/teams?search=Arsenal
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('search') ?? ''

  if (!query.trim()) {
    return NextResponse.json({ data: [] })
  }

  try {
    const teams = await searchTeams(query)
    return NextResponse.json({ data: teams })
  } catch (err) {
    if (err instanceof ApiFootballError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('[/api/teams]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
