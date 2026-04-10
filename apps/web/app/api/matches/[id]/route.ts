import { getMatchById, ApiFootballError } from '@scoremate/api'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = Number(params.id)
  if (isNaN(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid match ID' }, { status: 400 })
  }

  try {
    const match = await getMatchById(id)
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }
    return NextResponse.json({ data: match })
  } catch (err) {
    if (err instanceof ApiFootballError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error(`[/api/matches/${id}]`, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
