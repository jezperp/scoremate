export class ApiFootballError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiFootballError'
  }
}

function getCredentials(): { key: string; host: string } {
  const key = process.env.API_FOOTBALL_KEY
  const host = process.env.API_FOOTBALL_HOST
  if (!key) throw new Error('API_FOOTBALL_KEY is not set in .env.local')
  if (!host) throw new Error('API_FOOTBALL_HOST is not set in .env.local')
  return { key, host }
}

/**
 * Low-level fetch wrapper for API-Football (RapidAPI).
 * Returns the `response` array from the JSON envelope.
 */
export async function apiFetch<T>(
  path: string,
  params: Record<string, string | number> = {},
): Promise<T[]> {
  const { key, host } = getCredentials()
  const url = new URL(`https://${host}${path}`)

  for (const [k, value] of Object.entries(params)) {
    url.searchParams.set(k, String(value))
  }

  const response = await fetch(url.toString(), {
    headers: {
      'x-rapidapi-key': key,
      'x-rapidapi-host': host,
    },
    // Opt-out of Next.js data cache – we handle caching ourselves.
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new ApiFootballError(
      response.status,
      `API-Football ${response.status}: ${response.statusText} (${path})`,
    )
  }

  const json = (await response.json()) as { response: T[]; errors?: Record<string, string> }

  if (json.errors && Object.keys(json.errors).length > 0) {
    const message = Object.values(json.errors)[0]
    throw new ApiFootballError(response.status, message)
  }

  return json.response
}
