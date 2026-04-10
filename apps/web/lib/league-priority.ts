/**
 * League display priority — index 0 = highest.
 * Used to sort league groups in the calendar and home feed.
 * Keep in sync with LEAGUE_IDS in packages/api/src/constants.ts.
 */
export const LEAGUE_PRIORITY: number[] = [
  2,   // UEFA Champions League
  3,   // UEFA Europa League
  848, // UEFA Conference League
  39,  // Premier League
  140, // La Liga
  78,  // Bundesliga
  135, // Serie A
  61,  // Ligue 1
  88,  // Eredivisie
  94,  // Primeira Liga
  203, // Süper Lig
  13,  // CONMEBOL Libertadores
  11,  // CONMEBOL Sudamericana
  113, // Allsvenskan
  114, // Superettan
]

export function leaguePriorityIndex(leagueId: number): number {
  const idx = LEAGUE_PRIORITY.indexOf(leagueId)
  return idx === -1 ? Infinity : idx
}
