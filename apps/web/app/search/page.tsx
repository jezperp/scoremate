import { createClient } from '@scoremate/supabase/server'
import { getLeagues, PRIORITY_LEAGUE_IDS } from '@scoremate/api'
import type { League } from '@scoremate/types'
import SearchClient from './search-client'

export const metadata = { title: 'Search – Scoremate' }

export default async function SearchPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let favTeamIds: number[] = []
  let favLeagueIds: number[] = []

  if (user) {
    const [{ data: teams }, { data: leagues }] = await Promise.all([
      supabase.from('user_favorite_teams').select('team_id').eq('user_id', user.id),
      supabase.from('user_favorite_leagues').select('league_id').eq('user_id', user.id),
    ])
    favTeamIds = (teams ?? []).map((r) => r.team_id)
    favLeagueIds = (leagues ?? []).map((r) => r.league_id)
  }

  // Popular leagues for empty state – use cached API call directly
  let popularLeagues: League[] = []
  try {
    const all = await getLeagues()
    const prioritySet = new Set(PRIORITY_LEAGUE_IDS)
    const priorityOrder = [...PRIORITY_LEAGUE_IDS]
    popularLeagues = all
      .filter((l) => prioritySet.has(l.id))
      .sort((a, b) => priorityOrder.indexOf(a.id) - priorityOrder.indexOf(b.id))
  } catch {
    // non-fatal
  }

  return (
    <SearchClient
      userId={user?.id ?? null}
      initialFavTeamIds={favTeamIds}
      initialFavLeagueIds={favLeagueIds}
      popularLeagues={popularLeagues}
    />
  )
}
