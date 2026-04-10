import { redirect } from 'next/navigation'
import { createClient } from '@scoremate/supabase/server'
import { HemHeader } from '@/components/home/hem-header'
import { FavoritesFeed } from '@/components/home/favorites-feed'
import { OnboardingEmpty } from '@/components/home/onboarding-empty'

export default async function HomePage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: favorites } = await supabase
    .from('user_favorite_teams')
    .select('team_id, team_name, team_logo')
    .eq('user_id', user.id)

  const teamIds = (favorites ?? []).map((f: { team_id: number }) => f.team_id)

  return (
    <div
      className="flex min-h-[calc(100vh-var(--nav-height))] flex-col"
      style={{ backgroundColor: '#0F0F11' }}
    >
      <HemHeader user={user} />

      {teamIds.length === 0 ? (
        <OnboardingEmpty />
      ) : (
        <FavoritesFeed teamIds={teamIds} />
      )}
    </div>
  )
}
