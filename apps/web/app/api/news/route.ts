import { getAllNews } from '@/lib/rss'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/news[?source=Sportbladet]
 * Aggregates all RSS feeds. Each feed is cached 10 min in-memory.
 */
export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get('source')

  try {
    const { items, errors } = await getAllNews()

    const filtered =
      source && source !== 'Alla'
        ? items.filter((item) => item.source === source)
        : items

    return NextResponse.json({ data: filtered, errors: errors.length ? errors : undefined })
  } catch (err) {
    console.error('[/api/news]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
