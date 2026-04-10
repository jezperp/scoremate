import type { League, Match, MatchDetail, MatchEvent, Team, Transfer } from '@scoremate/types'
import { cache } from './cache'
import { apiFetch } from './client'

// ─── Raw API-Football shapes ─────────────────────────────────────────────────

interface RawFixture {
  fixture: {
    id: number
    date: string
    status: { long: string; short: string; elapsed: number | null }
  }
  league: {
    id: number
    name: string
    country: string
    logo: string
    flag: string | null
    season: number
    round: string
  }
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null }
    away: { id: number; name: string; logo: string; winner: boolean | null }
  }
  goals: { home: number | null; away: number | null }
  score: {
    halftime: { home: number | null; away: number | null }
    fulltime: { home: number | null; away: number | null }
    extratime: { home: number | null; away: number | null }
    penalty: { home: number | null; away: number | null }
  }
}

interface RawLeague {
  league: {
    id: number
    name: string
    type: string
    logo: string
  }
  country: {
    name: string
    code: string | null
    flag: string | null
  }
  seasons: Array<{
    year: number
    start: string
    end: string
    current: boolean
  }>
}

interface RawTeam {
  team: {
    id: number
    name: string
    code: string | null
    country: string
    founded: number | null
    national: boolean
    logo: string
  }
  venue: {
    id: number | null
    name: string | null
    address: string | null
    city: string | null
    capacity: number | null
    surface: string | null
    image: string | null
  }
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapFixture(raw: RawFixture): Match {
  return {
    id: raw.fixture.id,
    date: raw.fixture.date,
    status: raw.fixture.status,
    league: raw.league,
    home: { ...raw.teams.home, goals: raw.goals.home },
    away: { ...raw.teams.away, goals: raw.goals.away },
    score: raw.score,
  }
}

function mapLeague(raw: RawLeague): League {
  return {
    id: raw.league.id,
    name: raw.league.name,
    type: raw.league.type,
    logo: raw.league.logo,
    country: raw.country,
    seasons: raw.seasons,
  }
}

function mapTeam(raw: RawTeam): Team {
  return {
    ...raw.team,
    venue: raw.venue,
  }
}

// ─── Season helper ───────────────────────────────────────────────────────────

/**
 * Derives the season year from a date string (YYYY-MM-DD).
 * European leagues (Jul–Jun): season = start year.
 * For months Jan–Jun we go back one year.
 */
function seasonFromDate(date: string): number {
  const month = new Date(date).getMonth() + 1 // 1-12
  const year = new Date(date).getFullYear()
  return month < 7 ? year - 1 : year
}

// ─── Public functions ─────────────────────────────────────────────────────────

/**
 * Fetch fixtures for a given date.
 * Pass `leagueId` to limit results to a specific league (season is derived automatically).
 */
export async function getMatchesByDate(
  date: string,
  leagueId?: number,
): Promise<Match[]> {
  const params: Record<string, string | number> = { date }

  if (leagueId !== undefined) {
    params.league = leagueId
    params.season = seasonFromDate(date)
  }

  const cacheKey = `matches:${date}:${leagueId ?? 'all'}`
  const cached = cache.get<Match[]>(cacheKey)
  if (cached) return cached

  const raw = await apiFetch<RawFixture>('/fixtures', params)
  const matches = raw.map(mapFixture)
  cache.set(cacheKey, matches, 60 * 1000) // 1 minute
  return matches
}

/**
 * Fetch all currently live fixtures.
 */
export async function getLiveMatches(): Promise<Match[]> {
  const cacheKey = 'matches:live'
  // Short TTL for live data – 60 seconds.
  const cached = cache.get<Match[]>(cacheKey)
  if (cached) return cached

  const raw = await apiFetch<RawFixture>('/fixtures', { live: 'all' })
  const matches = raw.map(mapFixture)
  cache.set(cacheKey, matches, 60 * 1000)
  return matches
}

/**
 * Fetch team details by ID.
 */
export async function getTeam(teamId: number): Promise<Team | null> {
  const cacheKey = `team:${teamId}`
  const cached = cache.get<Team>(cacheKey)
  if (cached) return cached

  const raw = await apiFetch<RawTeam>('/teams', { id: teamId })
  if (raw.length === 0) return null

  const team = mapTeam(raw[0])
  cache.set(cacheKey, team)
  return team
}

/**
 * Search teams by name. Returns up to 20 results.
 */
export async function searchTeams(query: string): Promise<Team[]> {
  const q = query.trim()
  if (!q) return []

  const cacheKey = `teams:search:${q.toLowerCase()}`
  const cached = cache.get<Team[]>(cacheKey)
  if (cached) return cached

  const raw = await apiFetch<RawTeam>('/teams', { search: q })
  const teams = raw.map(mapTeam)
  cache.set(cacheKey, teams)
  return teams
}

// ─── Raw event shape ─────────────────────────────────────────────────────────

interface RawEvent {
  time: { elapsed: number; extra: number | null }
  team: { id: number; name: string }
  player: { id: number | null; name: string | null }
  assist: { id: number | null; name: string | null }
  type: string
  detail: string
}

function mapEvent(raw: RawEvent): MatchEvent {
  return {
    elapsed: raw.time.elapsed,
    extra: raw.time.extra,
    teamId: raw.team.id,
    teamName: raw.team.name,
    playerId: raw.player.id,
    playerName: raw.player.name,
    assistId: raw.assist.id,
    assistName: raw.assist.name,
    type: raw.type,
    detail: raw.detail,
  }
}

/**
 * Fetch a single fixture with events by fixture ID.
 * Short TTL (30s) so live polling stays fresh.
 */
export async function getMatchById(fixtureId: number): Promise<MatchDetail | null> {
  const cacheKey = `match:${fixtureId}`
  const cached = cache.get<MatchDetail>(cacheKey)
  if (cached) return cached

  const [fixtures, events] = await Promise.all([
    apiFetch<RawFixture>('/fixtures', { id: fixtureId }),
    apiFetch<RawEvent>('/fixtures/events', { fixture: fixtureId }),
  ])

  if (fixtures.length === 0) return null

  const match: MatchDetail = {
    ...mapFixture(fixtures[0]),
    events: events.map(mapEvent),
  }

  cache.set(cacheKey, match, 30 * 1000)
  return match
}

/**
 * Search leagues by name or country (filters the cached all-leagues list).
 */
export async function searchLeagues(query: string): Promise<League[]> {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const all = await getLeagues()
  return all
    .filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.country.name.toLowerCase().includes(q),
    )
    .slice(0, 20)
}

// ─── Transfers ───────────────────────────────────────────────────────────────

interface RawTransferTeam {
  id: number
  name: string
  logo: string
}

interface RawTransferEntry {
  date: string
  type: string
  teams: { in: RawTransferTeam; out: RawTransferTeam }
}

interface RawTransfer {
  player: { id: number; name: string; photo: string }
  transfers: RawTransferEntry[]
}

/**
 * Fetch all recorded transfers for a given team ID.
 * Cached 30 minutes – transfer windows don't change by the minute.
 */
export async function getTransfers(teamId: number): Promise<Transfer[]> {
  const cacheKey = `transfers:team:${teamId}`
  const cached = cache.get<Transfer[]>(cacheKey)
  if (cached) return cached

  const raw = await apiFetch<RawTransfer>('/transfers', { team: teamId })

  const transfers: Transfer[] = []
  for (const item of raw) {
    for (const t of item.transfers) {
      // Skip entries with missing/invalid date or wrong format (must be YYYY-MM-DD)
      if (!t.date || !/^\d{4}-\d{2}-\d{2}$/.test(t.date) || isNaN(new Date(t.date).getTime())) continue
      // Skip entries where either club ID is missing (produces "null" in the composite key)
      if (!t.teams.in?.id || !t.teams.out?.id) continue
      // Skip unknown or duplicate transfer types
      if (t.type === 'N/A' || t.type === '-' || /free transfer/i.test(t.type)) continue

      transfers.push({
        id: `${item.player.id}-${t.date}-${t.teams.in.id}-${t.teams.out.id}`,
        player: { id: item.player.id, name: item.player.name, photo: item.player.photo || null },
        date: t.date,
        type: t.type,
        teamIn: { id: t.teams.in.id, name: t.teams.in.name, logo: t.teams.in.logo || null },
        teamOut: { id: t.teams.out.id, name: t.teams.out.name, logo: t.teams.out.logo || null },
      })
    }
  }

  cache.set(cacheKey, transfers, 24 * 60 * 60 * 1000)
  return transfers
}

/**
 * Fetch all available leagues.
 */
export async function getLeagues(): Promise<League[]> {
  const cacheKey = 'leagues:all'
  const cached = cache.get<League[]>(cacheKey)
  if (cached) return cached

  const raw = await apiFetch<RawLeague>('/leagues')
  const leagues = raw.map(mapLeague)
  cache.set(cacheKey, leagues)
  return leagues
}
