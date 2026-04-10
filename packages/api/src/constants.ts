export const LEAGUE_IDS = {
  CHAMPIONS_LEAGUE: 2,
  EUROPA_LEAGUE: 3,
  CONFERENCE_LEAGUE: 848,
  PREMIER_LEAGUE: 39,
  LA_LIGA: 140,
  BUNDESLIGA: 78,
  SERIE_A: 135,
  LIGUE_1: 61,
  ALLSVENSKAN: 113,
  SUPERETTAN: 114,
} as const

export type LeagueId = (typeof LEAGUE_IDS)[keyof typeof LEAGUE_IDS]

/**
 * Ordered by display priority (index 0 = highest).
 * Used to sort league groups in the calendar and home feed.
 */
export const LEAGUE_PRIORITY: number[] = [
  LEAGUE_IDS.CHAMPIONS_LEAGUE,
  LEAGUE_IDS.EUROPA_LEAGUE,
  LEAGUE_IDS.CONFERENCE_LEAGUE,
  LEAGUE_IDS.PREMIER_LEAGUE,
  LEAGUE_IDS.LA_LIGA,
  LEAGUE_IDS.BUNDESLIGA,
  LEAGUE_IDS.SERIE_A,
  LEAGUE_IDS.LIGUE_1,
  LEAGUE_IDS.ALLSVENSKAN,
  LEAGUE_IDS.SUPERETTAN,
]

export const PRIORITY_LEAGUE_IDS: number[] = Object.values(LEAGUE_IDS)
