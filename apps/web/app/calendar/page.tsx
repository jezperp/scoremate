import { createClient } from '@scoremate/supabase/server'
import { CalendarClient } from '@/components/calendar/calendar-client'

export default async function CalendarPage() {
  let favLeagueIds: number[] = []

  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data } = await supabase
        .from('user_favorite_leagues')
        .select('league_id')
        .eq('user_id', user.id)

      favLeagueIds = (data ?? []).map((r: { league_id: number }) => r.league_id)
    }
  } catch {
    // Not authenticated or Supabase unavailable — show calendar without favorites
  }

  return <CalendarClient favLeagueIds={favLeagueIds} />
}
