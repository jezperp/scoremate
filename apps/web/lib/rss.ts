export interface NewsItem {
  id: string
  title: string
  link: string
  description: string
  pubDate: string // ISO string
  image: string | null
  source: string
}

export const RSS_FEEDS = [
  { name: 'Aftonbladet', url: 'https://rss.aftonbladet.se/rss2/small/pages/sections/sportbladet/fotboll/' },
  { name: 'Expressen',   url: 'https://feeds.expressen.se/sport/' },
  { name: 'SVT Sport',   url: 'https://www.svt.se/sport/rss.xml' },
  { name: 'BBC Sport',   url: 'https://feeds.bbci.co.uk/sport/football/rss.xml' },
  { name: 'Guardian',    url: 'https://www.theguardian.com/football/rss' },
] as const

export const SOURCES = ['News', 'Transfers'] as const

// Max age – articles older than this are discarded
const MAX_AGE_MS = 48 * 60 * 60 * 1000

// Transfer keywords (title match → show in Transfers tab)
export const TRANSFER_KEYWORDS = [
  'transfer', 'signing', 'signs', 'signed', 'joins', 'deal', 'fee',
  'bid', 'loan', 'contract', 'move', 'unveiled', 'announce',
  'värvning', 'värvad', 'värvar', 'nyförvärv', 'övergång',
  'klar för', 'klar till', 'skriver på', 'skriver under',
  'låneavtal', 'kontrakt', 'friköpsklausul',
]

export function isTransfer(title: string): boolean {
  const t = title.toLowerCase()
  return TRANSFER_KEYWORDS.some((kw) => t.includes(kw))
}

// ─── Fetch with correct charset ───────────────────────────────────────────────

async function fetchXml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Scoremate/1.0 RSS Reader' },
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const buffer = await res.arrayBuffer()
  // Peek at start to detect encoding declared in XML prolog
  const peek = new TextDecoder('utf-8', { fatal: false }).decode(
    new Uint8Array(buffer).slice(0, 200),
  )
  const encMatch = peek.match(/encoding="([^"]+)"/i)
  const encoding = encMatch ? encMatch[1] : 'utf-8'
  return new TextDecoder(encoding, { fatal: false }).decode(buffer)
}

// ─── HTML entity decoding ─────────────────────────────────────────────────────

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  nbsp: ' ', shy: '',
  // Swedish / common European
  aring: 'å', Aring: 'Å', auml: 'ä', Auml: 'Ä', ouml: 'ö', Ouml: 'Ö',
  eacute: 'é', Eacute: 'É', egrave: 'è', ecirc: 'ê',
  aacute: 'á', Aacute: 'Á', uuml: 'ü', Uuml: 'Ü',
  ntilde: 'ñ', Ntilde: 'Ñ', ccedil: 'ç', Ccedil: 'Ç',
  laquo: '«', raquo: '»', ldquo: '"', rdquo: '"', lsquo: '\u2018', rsquo: '\u2019',
  mdash: '—', ndash: '–', hellip: '…',
}

function decodeEntities(str: string): string {
  return str
    .replace(/&([a-zA-Z]+);/g, (_, name) => NAMED_ENTITIES[name] ?? _)
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
}

// ─── XML helpers ──────────────────────────────────────────────────────────────

function extractTag(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const m = xml.match(re)
  if (!m) return ''
  const content = m[1].trim()
  return content.startsWith('<![CDATA[')
    ? content.slice(9, content.lastIndexOf(']]>')).trim()
    : content
}

function extractAttr(xml: string, tagPattern: string, attr: string): string {
  const re = new RegExp(`<${tagPattern}[^>]*\\s${attr}="([^"]*)"`, 'i')
  const m = xml.match(re)
  return m ? m[1] : ''
}

function extractLink(itemXml: string): string {
  // Atom: <link href="..." rel="alternate"/> or <link href="..."/>
  const atomRel = itemXml.match(/<link[^>]+rel="alternate"[^>]+href="([^"]+)"/i)
    ?? itemXml.match(/<link[^>]+href="([^"]+)"[^>]*\/>/i)
  if (atomRel) return atomRel[1]

  // RSS 2.0: <link>https://…</link>
  const tag = extractTag(itemXml, 'link')
  if (tag.startsWith('http')) return tag

  // Fallback: any href on a link tag
  const any = extractAttr(itemXml, 'link', 'href')
  if (any) return any

  return ''
}

function extractImage(itemXml: string): string | null {
  const encUrl = extractAttr(itemXml, 'enclosure', 'url')
  if (encUrl && /\.(jpe?g|png|webp|gif)/i.test(encUrl)) return encUrl

  const thumb = extractAttr(itemXml, 'media:thumbnail', 'url')
  if (thumb) return thumb

  const mcA = itemXml.match(/<media:content[^>]*\smedium="image"[^>]*\surl="([^"]*)"/i)
  const mcB = itemXml.match(/<media:content[^>]*\surl="([^"]*)"[^>]*\smedium="image"/i)
  const mc = mcA ?? mcB
  if (mc) return mc[1]

  // Any media:content with an image URL
  const mcAny = itemXml.match(/<media:content[^>]*\surl="([^"]*\.(jpe?g|png|webp|gif)[^"]*)"/i)
  if (mcAny) return mcAny[1]

  const desc = extractTag(itemXml, 'description') || extractTag(itemXml, 'content')
  const img = desc.match(/<img[^>]+\ssrc="([^"]+)"/i)
  if (img) return img[1]

  return null
}

function stripHtml(html: string): string {
  return decodeEntities(
    html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim(),
  )
}

function parseDate(raw: string): string {
  if (!raw) return new Date(0).toISOString()
  const d = new Date(raw)
  return isNaN(d.getTime()) ? new Date(0).toISOString() : d.toISOString()
}

// ─── Football filter (for mixed-sport sources) ────────────────────────────────

const FOOTBALL_ONLY_SOURCES = new Set(['Aftonbladet', 'BBC Sport', 'Guardian'])

const FOOTBALL_URL_FRAGMENTS = [
  '/fotboll', '/football', '/soccer', '/bundesliga', '/premier-league',
  '/allsvenskan', '/superettan', '/champions-league', '/europa-league',
  '/la-liga', '/serie-a', '/ligue-1',
]

const NON_FOOTBALL_URL_FRAGMENTS = [
  '/trav', '/galopp', '/hockey', '/ishockey', '/tennis', '/golf',
  '/basket', '/handboll', '/friidrott', '/motorsport', '/simning',
  '/cykling', '/boxning', '/mma', '/ufc', '/rugby', '/baseball',
  '/cricket', '/nfl', '/nba', '/nhl', '/atletik', '/formel', '/rally',
]

const FOOTBALL_TITLE_WORDS = [
  'fotboll', 'football', 'soccer', 'bundesliga', 'premier league',
  'allsvenskan', 'superettan', 'serie a', 'la liga', 'ligue 1',
  'champions league', 'europa league', 'em-kval', 'vm-kval',
  'fifa', 'uefa', 'transfer', 'anfallare', 'mittfältare', 'målvakt',
  'el clásico', 'clasico', 'mls', 'eredivisie', 'värvning', 'värvad',
]

const NON_FOOTBALL_TITLE_WORDS = [
  'travhäst', 'travsport', 'travlopp', 'galopp', 'ishockey', ' nhl',
  ' nba', ' nfl', 'wimbledon', 'friidrott', ' golf', 'handboll',
  'simning', 'cykling', 'boxning', 'mma-', 'ufc-', 'rugby',
  'formel 1', ' f1 ', 'baseball', 'cricket',
]

function isFootball(title: string, link: string): boolean {
  const l = link.toLowerCase()
  const t = title.toLowerCase()
  if (NON_FOOTBALL_URL_FRAGMENTS.some((f) => l.includes(f))) return false
  if (FOOTBALL_URL_FRAGMENTS.some((f) => l.includes(f))) return true
  if (NON_FOOTBALL_TITLE_WORDS.some((w) => t.includes(w))) return false
  if (FOOTBALL_TITLE_WORDS.some((w) => t.includes(w))) return true
  return false
}

// ─── Item parsers ─────────────────────────────────────────────────────────────

function parseBlock(
  blockXml: string,
  sourceName: string,
  footballOnly: boolean,
): NewsItem | null {
  const title = stripHtml(extractTag(blockXml, 'title'))
  const link = extractLink(blockXml)
  if (!title || !link) return null
  if (!footballOnly && !isFootball(title, link)) return null

  const rawDate =
    extractTag(blockXml, 'pubDate') ||
    extractTag(blockXml, 'updated') ||
    extractTag(blockXml, 'published')
  const pubDate = parseDate(rawDate)

  // Discard articles older than MAX_AGE_MS
  if (Date.now() - new Date(pubDate).getTime() > MAX_AGE_MS) return null

  const rawDesc =
    extractTag(blockXml, 'description') ||
    extractTag(blockXml, 'summary') ||
    extractTag(blockXml, 'content')
  const description = stripHtml(rawDesc).slice(0, 300)

  return {
    id: Buffer.from(link).toString('base64').slice(0, 16),
    title,
    link,
    description,
    pubDate,
    image: extractImage(blockXml),
    source: sourceName,
  }
}

function parseXml(xml: string, sourceName: string): NewsItem[] {
  const footballOnly = FOOTBALL_ONLY_SOURCES.has(sourceName)
  const items: NewsItem[] = []

  // Try RSS 2.0 <item> blocks
  const rssRe = /<item>([\s\S]*?)<\/item>/gi
  let m: RegExpExecArray | null
  while ((m = rssRe.exec(xml)) !== null) {
    const item = parseBlock(m[1], sourceName, footballOnly)
    if (item) items.push(item)
  }

  // Try Atom <entry> blocks (if RSS items yielded nothing)
  if (items.length === 0) {
    const atomRe = /<entry>([\s\S]*?)<\/entry>/gi
    while ((m = atomRe.exec(xml)) !== null) {
      const item = parseBlock(m[1], sourceName, footballOnly)
      if (item) items.push(item)
    }
  }

  return items
}

// ─── In-memory cache ──────────────────────────────────────────────────────────

const TTL_MS = 10 * 60 * 1000
const feedCache = new Map<string, { data: NewsItem[]; expiresAt: number }>()

async function fetchFeed(feed: { name: string; url: string }): Promise<NewsItem[]> {
  const cached = feedCache.get(feed.url)
  if (cached && Date.now() < cached.expiresAt) return cached.data

  const xml = await fetchXml(feed.url)
  const items = parseXml(xml, feed.name)
  feedCache.set(feed.url, { data: items, expiresAt: Date.now() + TTL_MS })
  return items
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getAllNews(): Promise<{ items: NewsItem[]; errors: string[] }> {
  const results = await Promise.allSettled(RSS_FEEDS.map(fetchFeed))

  const items: NewsItem[] = []
  const errors: string[] = []

  for (const result of results) {
    if (result.status === 'fulfilled') {
      items.push(...result.value)
    } else {
      errors.push(
        result.reason instanceof Error ? result.reason.message : String(result.reason),
      )
    }
  }

  items.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())

  return { items, errors }
}
