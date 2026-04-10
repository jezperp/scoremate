'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@scoremate/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Team } from '@scoremate/types'

// ─── Static league config ────────────────────────────────────────────────────

const LEAGUES = [
  { id: 2,   name: 'Champions League', logo: 'https://media.api-sports.io/football/leagues/2.png' },
  { id: 3,   name: 'Europa League',    logo: 'https://media.api-sports.io/football/leagues/3.png' },
  { id: 39,  name: 'Premier League',   logo: 'https://media.api-sports.io/football/leagues/39.png' },
  { id: 140, name: 'La Liga',          logo: 'https://media.api-sports.io/football/leagues/140.png' },
  { id: 78,  name: 'Bundesliga',       logo: 'https://media.api-sports.io/football/leagues/78.png' },
  { id: 135, name: 'Serie A',          logo: 'https://media.api-sports.io/football/leagues/135.png' },
  { id: 61,  name: 'Ligue 1',          logo: 'https://media.api-sports.io/football/leagues/61.png' },
  { id: 113, name: 'Allsvenskan',      logo: 'https://media.api-sports.io/football/leagues/113.png' },
  { id: 114, name: 'Superettan',       logo: 'https://media.api-sports.io/football/leagues/114.png' },
] as const

const MAX_TEAMS = 10

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface FavTeam {
  user_id: string
  team_id: number
  team_name: string
  team_logo: string | null
}

export interface FavLeague {
  user_id: string
  league_id: number
  league_name: string
  league_logo: string | null
}

// ─── Small shared components ─────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="border-b border-border px-4 py-2.5">
      <p className="text-[13px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  )
}

function Checkmark() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-gold"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function Logo({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
        {alt.slice(0, 2).toUpperCase()}
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="h-8 w-8 object-contain"
      loading="lazy"
      onError={(e) => {
        e.currentTarget.style.display = 'none'
      }}
    />
  )
}

// ─── Section A – Favoritlag ───────────────────────────────────────────────────

function FavoriteTeamsSection({
  userId,
  initial,
}: {
  userId: string
  initial: FavTeam[]
}) {
  const supabase = createClient()
  const [favs, setFavs] = useState<FavTeam[]>(initial)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Team[]>([])
  const [searching, setSearching] = useState(false)
  const [limitHit, setLimitHit] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setLimitHit(false)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!search.trim()) {
      setResults([])
      return
    }
    timerRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/teams?search=${encodeURIComponent(search.trim())}`)
        const json = await res.json()
        setResults(json.data ?? [])
      } finally {
        setSearching(false)
      }
    }, 400)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [search])

  const isFav = (teamId: number) => favs.some((f) => f.team_id === teamId)

  async function toggleTeam(team: Team) {
    if (isFav(team.id)) {
      // Remove
      setFavs((prev) => prev.filter((f) => f.team_id !== team.id))
      await supabase
        .from('user_favorite_teams')
        .delete()
        .eq('user_id', userId)
        .eq('team_id', team.id)
    } else {
      if (favs.length >= MAX_TEAMS) {
        setLimitHit(true)
        return
      }
      const row: FavTeam = {
        user_id: userId,
        team_id: team.id,
        team_name: team.name,
        team_logo: team.logo ?? null,
      }
      setFavs((prev) => [...prev, row])
      await supabase.from('user_favorite_teams').upsert(row)
    }
  }

  const displayList = search.trim() ? results : favs.map((f) => ({
    id: f.team_id,
    name: f.team_name,
    logo: f.team_logo ?? '',
    code: null,
    country: '',
    founded: null,
    national: false,
    venue: { id: null, name: null, address: null, city: null, capacity: null, surface: null, image: null },
  }) satisfies Team)

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <SectionHeader label="Favorite teams" />

      {/* Search input */}
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
          <svg className="h-4 w-4 shrink-0 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search teams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {searching && (
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          )}
        </div>
      </div>

      {/* Limit warning */}
      {limitHit && (
        <p className="border-b border-border px-4 py-2 text-xs text-gold">
          Maximum of {MAX_TEAMS} favorite teams reached.
        </p>
      )}

      {/* Count indicator (when not searching) */}
      {!search.trim() && favs.length === 0 && (
        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
          Search for teams to add.
        </div>
      )}

      {/* Results / Favorites list */}
      {displayList.map((team, i) => (
        <button
          key={team.id}
          onClick={() => toggleTeam(team)}
          className={[
            'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-muted',
            i < displayList.length - 1 ? 'border-b border-border' : '',
          ].join(' ')}
        >
          <Logo src={team.logo || null} alt={team.name} />
          <span className="flex-1 text-sm text-foreground">{team.name}</span>
          {isFav(team.id) && <Checkmark />}
        </button>
      ))}

      {/* Footer */}
      <div className="border-t border-border px-4 py-2">
        <p className="text-xs text-muted-foreground">{favs.length} / {MAX_TEAMS} teams selected</p>
      </div>
    </div>
  )
}

// ─── Section B – Favoritligor ─────────────────────────────────────────────────

function FavoriteLeaguesSection({
  userId,
  initial,
}: {
  userId: string
  initial: FavLeague[]
}) {
  const supabase = createClient()
  const [favs, setFavs] = useState<FavLeague[]>(initial)

  const isFav = (leagueId: number) => favs.some((f) => f.league_id === leagueId)

  async function toggleLeague(league: (typeof LEAGUES)[number]) {
    if (isFav(league.id)) {
      setFavs((prev) => prev.filter((f) => f.league_id !== league.id))
      await supabase
        .from('user_favorite_leagues')
        .delete()
        .eq('user_id', userId)
        .eq('league_id', league.id)
    } else {
      const row: FavLeague = {
        user_id: userId,
        league_id: league.id,
        league_name: league.name,
        league_logo: league.logo,
      }
      setFavs((prev) => [...prev, row])
      await supabase.from('user_favorite_leagues').upsert(row)
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <SectionHeader label="Favorite leagues" />
      {LEAGUES.map((league, i) => (
        <button
          key={league.id}
          onClick={() => toggleLeague(league)}
          className={[
            'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-muted',
            i < LEAGUES.length - 1 ? 'border-b border-border' : '',
          ].join(' ')}
        >
          <Logo src={league.logo} alt={league.name} />
          <span className="flex-1 text-sm text-foreground">{league.name}</span>
          {isFav(league.id) && <Checkmark />}
        </button>
      ))}
    </div>
  )
}

// ─── Toggle component ─────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: () => void
  disabled?: boolean
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={[
        'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none',
        checked ? 'bg-gold' : 'bg-muted',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
      ].join(' ')}
    >
      <span
        className={[
          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0',
        ].join(' ')}
      />
    </button>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

// ─── Section D – Notifications ────────────────────────────────────────────────

function NotificationsSection() {
  const [supported, setSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Always sync toggle state from actual SW subscription
  async function syncState() {
    if (!('serviceWorker' in navigator)) return
    const reg = await navigator.serviceWorker.ready.catch(() => null)
    if (!reg) return
    const sub = await reg.pushManager.getSubscription().catch(() => null)
    setSubscribed(!!sub)
    setPermission(Notification.permission)
  }

  useEffect(() => {
    const ok =
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window

    setSupported(ok)
    if (!ok) return

    navigator.serviceWorker
      .register('/sw.js')
      .then(() => syncState())
      .catch(console.error)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function subscribe() {
    setLoading(true)
    setError(null)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') return

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) throw new Error('VAPID public key not configured')

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as any,
      })

      const json = sub.toJSON()
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: json.endpoint,
          p256dh: json.keys?.p256dh,
          auth: json.keys?.auth,
        }),
      })
      if (!res.ok) throw new Error('Failed to save subscription on server')
    } catch (err) {
      console.error('Push subscribe error', err)
      setError('Could not enable notifications. Please try again.')
    } finally {
      // Always sync so toggle reflects actual SW state
      await syncState()
      setLoading(false)
    }
  }

  async function unsubscribe() {
    setLoading(true)
    setError(null)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
    } catch (err) {
      console.error('Push unsubscribe error', err)
    } finally {
      await syncState()
      setLoading(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <SectionHeader label="Notifications" />

      {!supported ? (
        <div className="px-4 py-4">
          <p className="text-sm text-foreground">Push notifications not supported</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Works in Chrome and Edge on Android and desktop. Not supported in Safari/iOS.
          </p>
        </div>
      ) : permission === 'denied' ? (
        <div className="px-4 py-4">
          <p className="text-sm text-foreground">Notifications blocked</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Change notification permissions in your browser settings to enable push alerts.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm text-foreground">Match notifications</span>
              <span className="text-xs text-muted-foreground">
                Goals, kick-off and full time for your favourite teams
              </span>
            </div>
            <Toggle
              checked={subscribed}
              onChange={subscribed ? unsubscribe : subscribe}
              disabled={loading}
            />
          </div>
          {error && (
            <p className="border-t border-border px-4 pb-3 text-xs text-destructive">{error}</p>
          )}
        </>
      )}
    </div>
  )
}

// ─── Section C – Konto ────────────────────────────────────────────────────────

function AccountSection({ user }: { user: User }) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const email = user.email ?? '–'
  const avatarUrl: string | undefined = user.user_metadata?.avatar_url
  const initial = email[0]?.toUpperCase() ?? '?'

  async function handleLogout() {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <SectionHeader label="Account" />

      {/* User info */}
      <div className="flex items-center gap-3 px-4 py-4">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={email}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-sm font-bold text-[#0F0F11]">
            {initial}
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">{email}</span>
          <span className="text-xs text-muted-foreground">Signed in</span>
        </div>
      </div>

      {/* Logout */}
      <div className="border-t border-border px-4 py-3">
        <button
          onClick={handleLogout}
          disabled={loading}
          className="w-full rounded-md border border-border py-2.5 text-sm font-medium text-foreground transition-colors active:bg-muted disabled:opacity-50"
        >
          {loading ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </div>
  )
}

// ─── Root export ─────────────────────────────────────────────────────────────

export default function SettingsClient({
  user,
  initialFavTeams,
  initialFavLeagues,
}: {
  user: User
  initialFavTeams: FavTeam[]
  initialFavLeagues: FavLeague[]
}) {
  return (
    <div className="min-h-[calc(100vh-var(--nav-height))] px-4 py-4">
      <header className="pb-4 pt-1">
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
      </header>

      <div className="flex flex-col gap-6">
        <FavoriteTeamsSection userId={user.id} initial={initialFavTeams} />
        <FavoriteLeaguesSection userId={user.id} initial={initialFavLeagues} />
        <NotificationsSection />
        <AccountSection user={user} />
      </div>
    </div>
  )
}
