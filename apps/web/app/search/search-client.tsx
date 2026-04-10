'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@scoremate/supabase/client'
import type { Team, League } from '@scoremate/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchClientProps {
  userId: string | null
  initialFavTeamIds: number[]
  initialFavLeagueIds: number[]
  popularLeagues: League[]
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ResultSkeleton() {
  return (
    <div className="animate-pulse flex flex-col gap-2">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: '#1A1A1F', border: '1px solid #2A2A32' }}
        >
          <div className="h-9 w-9 shrink-0 rounded-full" style={{ background: '#2A2A32' }} />
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="h-3 w-28 rounded" style={{ background: '#2A2A32' }} />
            <div className="h-2.5 w-16 rounded" style={{ background: '#2A2A32' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Star button ──────────────────────────────────────────────────────────────

function StarButton({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onToggle()
      }}
      className="shrink-0 text-xl leading-none transition-transform active:scale-90"
      aria-label={active ? 'Remove from favourites' : 'Add to favourites'}
    >
      <span style={{ color: active ? '#F5A623' : '#3A3A44' }}>★</span>
    </button>
  )
}

// ─── Result row ───────────────────────────────────────────────────────────────

function ResultRow({
  href,
  logo,
  name,
  sub,
  isFav,
  onToggleFav,
}: {
  href: string
  logo: string
  name: string
  sub?: string
  isFav: boolean
  onToggleFav: () => void
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl px-4 py-3 transition-opacity active:opacity-70"
      style={{ background: '#1A1A1F', border: '1px solid #2A2A32' }}
    >
      <div className="relative h-9 w-9 shrink-0">
        <Image src={logo} alt={name} fill className="object-contain" unoptimized />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium" style={{ color: '#E8E8F0' }}>
          {name}
        </span>
        {sub && (
          <span className="truncate text-xs" style={{ color: '#8A8A9A' }}>
            {sub}
          </span>
        )}
      </div>
      <StarButton active={isFav} onToggle={onToggleFav} />
    </Link>
  )
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ label, count }: { label: string; count?: number }) {
  return (
    <p
      className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-widest"
      style={{ color: '#8A8A9A' }}
    >
      {label}
      {count !== undefined && ` (${count})`}
    </p>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SearchClient({
  userId,
  initialFavTeamIds,
  initialFavLeagueIds,
  popularLeagues,
}: SearchClientProps) {
  const [query, setQuery] = useState('')
  const [teams, setTeams] = useState<Team[]>([])
  const [leagues, setLeagues] = useState<League[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const [favTeamIds, setFavTeamIds] = useState(() => new Set(initialFavTeamIds))
  const [favLeagueIds, setFavLeagueIds] = useState(() => new Set(initialFavLeagueIds))

  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabase = createClient()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.length < 2) {
      setTeams([])
      setLeagues([])
      setSearched(false)
      setLoading(false)
      return
    }

    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const [teamsRes, leaguesRes] = await Promise.all([
          fetch(`/api/teams?search=${encodeURIComponent(query)}`).then((r) => r.json()),
          fetch(`/api/leagues?search=${encodeURIComponent(query)}`).then((r) => r.json()),
        ])
        setTeams(teamsRes.data ?? [])
        setLeagues(leaguesRes.data ?? [])
      } finally {
        setLoading(false)
        setSearched(true)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  async function toggleTeam(team: Team) {
    if (!userId) return
    if (favTeamIds.has(team.id)) {
      setFavTeamIds((prev) => { const s = new Set(prev); s.delete(team.id); return s })
      await supabase
        .from('user_favorite_teams')
        .delete()
        .eq('user_id', userId)
        .eq('team_id', team.id)
    } else {
      setFavTeamIds((prev) => new Set(Array.from(prev).concat(team.id)))
      await supabase.from('user_favorite_teams').upsert({
        user_id: userId,
        team_id: team.id,
        team_name: team.name,
        team_logo: team.logo ?? null,
      })
    }
  }

  async function toggleLeague(league: League) {
    if (!userId) return
    if (favLeagueIds.has(league.id)) {
      setFavLeagueIds((prev) => { const s = new Set(prev); s.delete(league.id); return s })
      await supabase
        .from('user_favorite_leagues')
        .delete()
        .eq('user_id', userId)
        .eq('league_id', league.id)
    } else {
      setFavLeagueIds((prev) => new Set(Array.from(prev).concat(league.id)))
      await supabase.from('user_favorite_leagues').upsert({
        user_id: userId,
        league_id: league.id,
        league_name: league.name,
        league_logo: league.logo,
      })
    }
  }

  const showEmpty = query.length < 2
  const noResults = searched && !loading && teams.length === 0 && leagues.length === 0

  return (
    <div
      className="flex min-h-[calc(100vh-var(--nav-height))] flex-col"
      style={{ background: '#0F0F11' }}
    >
      {/* Search input */}
      <div className="px-4 pb-3 pt-4">
        <div className="relative flex items-center">
          <svg
            className="pointer-events-none absolute left-3.5 shrink-0"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#8A8A9A"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search teams & leagues…"
            className="w-full rounded-xl py-3 pl-10 pr-10 text-sm outline-none"
            style={{
              background: '#1A1A1F',
              border: '1px solid #2A2A32',
              color: '#E8E8F0',
              caretColor: '#F5A623',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#F5A623' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#2A2A32' }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 flex items-center justify-center transition-opacity active:opacity-60"
              aria-label="Clear search"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8A8A9A"
                strokeWidth={2.5}
                strokeLinecap="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-5 px-4 pb-6">
        {showEmpty ? (
          popularLeagues.length > 0 && (
            <div>
              <SectionLabel label="Popular Leagues" />
              <div className="flex flex-col gap-2">
                {popularLeagues.map((league) => (
                  <ResultRow
                    key={league.id}
                    href={`/league/${league.id}`}
                    logo={league.logo}
                    name={league.name}
                    sub={league.country.name}
                    isFav={favLeagueIds.has(league.id)}
                    onToggleFav={() => toggleLeague(league)}
                  />
                ))}
              </div>
            </div>
          )
        ) : loading ? (
          <ResultSkeleton />
        ) : noResults ? (
          <p
            className="py-14 text-center text-sm"
            style={{ color: '#8A8A9A' }}
          >
            No results for &ldquo;{query}&rdquo;
          </p>
        ) : (
          <>
            {teams.length > 0 && (
              <div>
                <SectionLabel label="Teams" count={teams.length} />
                <div className="flex flex-col gap-2">
                  {teams.map((team) => (
                    <ResultRow
                      key={team.id}
                      href={`/team/${team.id}`}
                      logo={team.logo}
                      name={team.name}
                      sub={team.country}
                      isFav={favTeamIds.has(team.id)}
                      onToggleFav={() => toggleTeam(team)}
                    />
                  ))}
                </div>
              </div>
            )}
            {leagues.length > 0 && (
              <div>
                <SectionLabel label="Leagues" count={leagues.length} />
                <div className="flex flex-col gap-2">
                  {leagues.map((league) => (
                    <ResultRow
                      key={league.id}
                      href={`/league/${league.id}`}
                      logo={league.logo}
                      name={league.name}
                      sub={league.country.name}
                      isFav={favLeagueIds.has(league.id)}
                      onToggleFav={() => toggleLeague(league)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
