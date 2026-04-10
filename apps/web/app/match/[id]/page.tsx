'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import type { MatchDetail, MatchEvent } from '@scoremate/types'

// ─── Constants ───────────────────────────────────────────────────────────────

const LIVE_STATUSES = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'SUSP', 'INT', 'LIVE'])
const FINISHED_STATUSES = new Set(['FT', 'AET', 'PEN', 'AWD', 'WO'])
const POLL_INTERVAL = 60 * 1000 // 1 minute

function getState(short: string): 'upcoming' | 'live' | 'finished' {
  if (LIVE_STATUSES.has(short)) return 'live'
  if (FINISHED_STATUSES.has(short)) return 'finished'
  return 'upcoming'
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/London',
  })
}

function minuteLabel(elapsed: number, extra: number | null) {
  return extra ? `${elapsed}+${extra}'` : `${elapsed}'`
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function MatchDetailSkeleton() {
  return (
    <div className="animate-pulse flex flex-col gap-4 p-4">
      <div className="h-4 w-32 rounded" style={{ background: '#2A2A32' }} />
      <div className="rounded-2xl p-6" style={{ background: '#1A1A1F', border: '1px solid #2A2A32' }}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 flex-col items-center gap-2">
            <div className="h-16 w-16 rounded-full" style={{ background: '#2A2A32' }} />
            <div className="h-3 w-20 rounded" style={{ background: '#2A2A32' }} />
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="h-10 w-20 rounded" style={{ background: '#2A2A32' }} />
            <div className="h-3 w-12 rounded" style={{ background: '#2A2A32' }} />
          </div>
          <div className="flex flex-1 flex-col items-center gap-2">
            <div className="h-16 w-16 rounded-full" style={{ background: '#2A2A32' }} />
            <div className="h-3 w-20 rounded" style={{ background: '#2A2A32' }} />
          </div>
        </div>
      </div>
      {[0, 1, 2].map(i => (
        <div key={i} className="h-10 rounded-xl" style={{ background: '#1A1A1F', border: '1px solid #2A2A32' }} />
      ))}
    </div>
  )
}

// ─── Header ──────────────────────────────────────────────────────────────────

function MatchHeader({ match, lastUpdated }: { match: MatchDetail; lastUpdated: Date }) {
  const state = getState(match.status.short)
  const showScore = state !== 'upcoming'
  const homeGoals = match.home.goals ?? 0
  const awayGoals = match.away.goals ?? 0

  return (
    <div className="flex flex-col gap-3 rounded-2xl px-4 py-5" style={{ background: '#1A1A1F', border: '1px solid #2A2A32' }}>
      {/* League + round */}
      <div className="flex items-center justify-center gap-1.5">
        <div className="relative h-4 w-4 shrink-0">
          <Image src={match.league.logo} alt={match.league.name} fill className="object-contain" unoptimized />
        </div>
        <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color: '#8A8A9A' }}>
          {match.league.name} · {match.league.round}
        </span>
      </div>

      {/* Teams + score */}
      <div className="flex items-center gap-2">
        {/* Home */}
        <div className="flex flex-1 flex-col items-center gap-2">
          <div className="relative h-16 w-16">
            <Image src={match.home.logo} alt={match.home.name} fill className="object-contain" unoptimized />
          </div>
          <span className="text-center text-sm font-semibold leading-tight" style={{ color: '#E8E8F0' }}>
            {match.home.name}
          </span>
        </div>

        {/* Score / time */}
        <div className="flex shrink-0 flex-col items-center gap-1" style={{ minWidth: '80px' }}>
          {showScore ? (
            <span className="text-4xl font-black tabular-nums" style={{ color: '#E8E8F0', fontVariantNumeric: 'tabular-nums' }}>
              {homeGoals} – {awayGoals}
            </span>
          ) : (
            <span className="text-xl font-bold" style={{ color: '#F5A623' }}>
              {new Date(match.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' })}
            </span>
          )}

          {/* Status badge */}
          {state === 'live' ? (
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: '#E8383A' }} />
              <span className="text-xs font-bold" style={{ color: '#E8383A' }}>
                {match.status.short === 'HT' ? 'Half Time' : match.status.elapsed ? `${match.status.elapsed}'` : 'Live'}
              </span>
            </div>
          ) : state === 'finished' ? (
            <span className="text-[11px] font-medium uppercase tracking-wide" style={{ color: '#8A8A9A' }}>Full Time</span>
          ) : (
            <span className="text-[11px]" style={{ color: '#8A8A9A' }}>{formatTime(match.date)}</span>
          )}

          {/* Halftime score */}
          {(state === 'live' || state === 'finished') && match.score.halftime.home !== null && (
            <span className="text-[11px]" style={{ color: '#8A8A9A' }}>
              HT {match.score.halftime.home} – {match.score.halftime.away}
            </span>
          )}
        </div>

        {/* Away */}
        <div className="flex flex-1 flex-col items-center gap-2">
          <div className="relative h-16 w-16">
            <Image src={match.away.logo} alt={match.away.name} fill className="object-contain" unoptimized />
          </div>
          <span className="text-center text-sm font-semibold leading-tight" style={{ color: '#E8E8F0' }}>
            {match.away.name}
          </span>
        </div>
      </div>

      {/* Last updated */}
      {state === 'live' && (
        <p className="text-center text-[10px]" style={{ color: '#8A8A9A' }}>
          Updated {lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
      )}
    </div>
  )
}

// ─── Events ──────────────────────────────────────────────────────────────────

function EventIcon({ event }: { event: MatchEvent }) {
  if (event.type === 'Goal') {
    const isOwn = event.detail === 'Own Goal'
    const isPen = event.detail === 'Penalty'
    return (
      <span className="text-base" title={event.detail}>
        {isOwn ? '⚽️' : isPen ? '⚽️ P' : '⚽️'}
      </span>
    )
  }
  if (event.type === 'Card') {
    return (
      <span
        className="inline-block h-4 w-3 rounded-sm"
        style={{ background: event.detail === 'Red Card' || event.detail === 'Second Yellow card' ? '#E8383A' : '#F5A623' }}
        title={event.detail}
      />
    )
  }
  if (event.type === 'subst') {
    return <span className="text-sm" title="Substitution">🔄</span>
  }
  return <span className="text-sm">•</span>
}

function EventRow({ event, isHome }: { event: MatchEvent; isHome: boolean }) {
  const isGoal = event.type === 'Goal'
  const isOwnGoal = isGoal && event.detail === 'Own Goal'
  const isSubst = event.type === 'subst'

  // Own goals are attributed to the scoring team but hurt the owning team
  const displaysHome = isOwnGoal ? !isHome : isHome

  const minute = minuteLabel(event.elapsed, event.extra)

  const playerText = isSubst
    ? `↑ ${event.playerName ?? ''}${event.assistName ? ` ↓ ${event.assistName}` : ''}`
    : event.playerName ?? ''

  const subText = isGoal && event.assistName ? `Assist: ${event.assistName}` : isGoal && isOwnGoal ? 'Own Goal' : ''

  return (
    <div className={`flex items-start gap-2 py-1.5 ${displaysHome ? '' : 'flex-row-reverse'}`}>
      <span className="shrink-0 text-[11px] tabular-nums w-8 text-center" style={{ color: '#8A8A9A' }}>{minute}</span>
      <div className="shrink-0 flex items-center justify-center w-5 pt-0.5">
        <EventIcon event={event} />
      </div>
      <div className={`flex flex-col ${displaysHome ? '' : 'items-end'}`}>
        <span className="text-sm font-medium" style={{ color: isGoal ? '#F5A623' : '#E8E8F0' }}>
          {playerText}
        </span>
        {subText && <span className="text-[11px]" style={{ color: '#8A8A9A' }}>{subText}</span>}
      </div>
    </div>
  )
}

function EventsSection({ match }: { match: MatchDetail }) {
  const events = [...match.events].reverse()
  if (events.length === 0) return null

  return (
    <div className="flex flex-col gap-1 rounded-2xl px-4 py-3" style={{ background: '#1A1A1F', border: '1px solid #2A2A32' }}>
      <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#8A8A9A' }}>Match Events</p>
      <div className="flex flex-col divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
        {events.map((ev, i) => (
          <EventRow
            key={i}
            event={ev}
            isHome={ev.teamId === match.home.id}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function MatchPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [match, setMatch] = useState<MatchDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchMatch = useCallback(async () => {
    try {
      const res = await fetch(`/api/matches/${id}`)
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? `HTTP ${res.status}`)
      }
      const json = await res.json()
      setMatch(json.data)
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchMatch()
  }, [fetchMatch])

  // Start/stop polling based on match state
  useEffect(() => {
    if (!match) return
    const state = getState(match.status.short)
    if (state !== 'live') return

    intervalRef.current = setInterval(fetchMatch, POLL_INTERVAL)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [match, fetchMatch])

  return (
    <div className="flex min-h-[calc(100vh-var(--nav-height))] flex-col" style={{ background: '#0F0F11' }}>
      {/* Back button */}
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
          style={{ color: '#8A8A9A' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M5 12l7 7M5 12l7-7" />
          </svg>
          Back
        </button>
      </div>

      {loading ? (
        <MatchDetailSkeleton />
      ) : error ? (
        <div className="flex flex-1 items-center justify-center px-6 py-20 text-center">
          <p className="text-sm" style={{ color: '#E8383A' }}>{error}</p>
        </div>
      ) : match ? (
        <div className="flex flex-col gap-3 px-4 pb-6">
          <MatchHeader match={match} lastUpdated={lastUpdated} />
          <EventsSection match={match} />
        </div>
      ) : null}
    </div>
  )
}
