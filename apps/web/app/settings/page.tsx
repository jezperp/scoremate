import { redirect } from 'next/navigation'
import { createClient } from '@scoremate/supabase/server'
import SettingsClient, { type FavTeam, type FavLeague } from './settings-client'

export const metadata = {
  title: 'Settings – Scoremate',
}

export default async function SettingsPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: favTeams }, { data: favLeagues }] = await Promise.all([
    supabase
      .from('user_favorite_teams')
      .select('user_id, team_id, team_name, team_logo')
      .eq('user_id', user.id),
    supabase
      .from('user_favorite_leagues')
      .select('user_id, league_id, league_name, league_logo')
      .eq('user_id', user.id),
  ])

  return (
    <SettingsClient
      user={user}
      initialFavTeams={(favTeams ?? []) as FavTeam[]}
      initialFavLeagues={(favLeagues ?? []) as FavLeague[]}
    />
  )
}
