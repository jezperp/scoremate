import { getLiveMatches, ApiFootballError } from '@scoremate/api'
import { NextResponse } from 'next/server'

/**
 * GET /api/live
 * Returns all currently live fixtures. Cached for 60 seconds.
 */
export async function GET() {
  try {
    const matches = await getLiveMatches()
    return NextResponse.json({ data: matches })
  } catch (err) {
    if (err instanceof ApiFootballError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('[/api/live]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
