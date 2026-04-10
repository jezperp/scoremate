import { getTransfers } from '@scoremate/api'
import { createClient } from '@scoremate/supabase/server'
import { NextResponse } from 'next/server'
import type { Transfer } from '@scoremate/types'

/**
 * GET /api/transfers
 * Returns transfers for the authenticated user's favorite teams only.
 * Each team's transfer history is cached 24h in the API package's in-memory cache.
 */
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch the user's favorite team IDs
  const { data: favTeams } = await supabase
    .from('user_favorite_teams')
    .select('team_id')
    .eq('user_id', user.id)

  if (!favTeams?.length) {
    return NextResponse.json({ data: [] })
  }

  const teamIds = favTeams.map((r: { team_id: number }) => r.team_id)

  try {
    const results = await Promise.allSettled(teamIds.map((id: number) => getTransfers(id)))

    const seen = new Set<string>()
    const transfers: Transfer[] = []

    for (const result of results) {
      if (result.status !== 'fulfilled') continue
      for (const t of result.value) {
        if (!seen.has(t.id)) {
          seen.add(t.id)
          transfers.push(t)
        }
      }
    }

    transfers.sort((a, b) => {
      const ta = a.date ? new Date(a.date).getTime() : 0
      const tb = b.date ? new Date(b.date).getTime() : 0
      return tb - ta
    })

    return NextResponse.json({ data: transfers })
  } catch (err) {
    console.error('[/api/transfers]', err)
    return NextResponse.json({ error: 'Failed to load transfers' }, { status: 500 })
  }
}
