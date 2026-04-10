import { getTeam, ApiFootballError } from '@scoremate/api'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/teams/[id]
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const teamId = Number(params.id)

  if (isNaN(teamId) || teamId <= 0) {
    return NextResponse.json({ error: 'Invalid team id' }, { status: 400 })
  }

  try {
    const team = await getTeam(teamId)

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    return NextResponse.json({ data: team })
  } catch (err) {
    if (err instanceof ApiFootballError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('[/api/teams]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
