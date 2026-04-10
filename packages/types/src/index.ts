// ─── Match / Fixture ────────────────────────────────────────────────────────

export interface MatchStatus {
  long: string
  short: string
  elapsed: number | null
}

export interface MatchLeague {
  id: number
  name: string
  country: string
  logo: string
  flag: string | null
  season: number
  round: string
}

export interface MatchTeam {
  id: number
  name: string
  logo: string
  winner: boolean | null
  goals: number | null
}

export interface ScoreLine {
  home: number | null
  away: number | null
}

export interface MatchScore {
  halftime: ScoreLine
  fulltime: ScoreLine
  extratime: ScoreLine
  penalty: ScoreLine
}

export interface Match {
  id: number
  date: string
  status: MatchStatus
  league: MatchLeague
  home: MatchTeam
  away: MatchTeam
  score: MatchScore
}

// ─── Match events ────────────────────────────────────────────────────────────

export interface MatchEvent {
  elapsed: number
  extra: number | null
  teamId: number
  teamName: string
  playerId: number | null
  playerName: string | null
  assistId: number | null
  assistName: string | null
  type: 'Goal' | 'Card' | 'subst' | 'Var' | string
  detail: string
}

export interface MatchDetail extends Match {
  events: MatchEvent[]
}

// ─── League ─────────────────────────────────────────────────────────────────

export interface Country {
  name: string
  code: string | null
  flag: string | null
}

export interface Season {
  year: number
  start: string
  end: string
  current: boolean
}

export interface League {
  id: number
  name: string
  type: string
  logo: string
  country: Country
  seasons: Season[]
}

// ─── Team ────────────────────────────────────────────────────────────────────

export interface Venue {
  id: number | null
  name: string | null
  address: string | null
  city: string | null
  capacity: number | null
  surface: string | null
  image: string | null
}

export interface Team {
  id: number
  name: string
  code: string | null
  country: string
  founded: number | null
  national: boolean
  logo: string
  venue: Venue
}

// ─── Player ──────────────────────────────────────────────────────────────────

export interface Player {
  id: number
  name: string
  firstname: string
  lastname: string
  age: number
  nationality: string
  photo: string
  position: string
}

// ─── Transfer ────────────────────────────────────────────────────────────────

export interface TransferPlayer {
  id: number
  name: string
  photo: string | null
}

export interface TransferClub {
  id: number
  name: string
  logo: string | null
}

export interface Transfer {
  /** Composite key: playerId-date-teamInId-teamOutId */
  id: string
  player: TransferPlayer
  /** ISO date string, e.g. "2024-07-01" */
  date: string
  /** "Transfer" | "Loan" | "Free" | "N/A" | ... */
  type: string
  teamIn: TransferClub
  teamOut: TransferClub
}

// ─── API response wrapper ────────────────────────────────────────────────────

export interface ApiError {
  message: string
  status?: number
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError }
