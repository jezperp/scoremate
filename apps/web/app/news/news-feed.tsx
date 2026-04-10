'use client'

import { useState, useEffect } from 'react'
import type { NewsItem } from '@/lib/rss'
import type { Transfer } from '@scoremate/types'
import { SOURCES } from '@/lib/rss'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} h ago`
  return `${Math.floor(hours / 24)} d ago`
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate)
  if (isNaN(d.getTime())) return '–'
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function ArticleSkeleton() {
  return (
    <div className="flex gap-3 rounded-lg border border-border bg-card p-3 animate-pulse">
      <div className="h-16 w-16 shrink-0 rounded-md bg-muted" />
      <div className="flex flex-1 flex-col gap-2 py-0.5">
        <div className="h-3.5 w-3/4 rounded bg-muted" />
        <div className="h-3.5 w-1/2 rounded bg-muted" />
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-5/6 rounded bg-muted" />
      </div>
    </div>
  )
}

function TransferSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 animate-pulse">
      <div className="mb-3 flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-muted" />
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="h-3.5 w-1/2 rounded bg-muted" />
          <div className="h-3 w-1/4 rounded bg-muted" />
        </div>
        <div className="h-5 w-16 rounded-full bg-muted" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded bg-muted shrink-0" />
        <div className="h-3 w-28 rounded bg-muted" />
        <div className="h-3 w-4 rounded bg-muted mx-1" />
        <div className="h-3 w-28 rounded bg-muted" />
        <div className="h-8 w-8 rounded bg-muted shrink-0" />
      </div>
    </div>
  )
}

// ─── Article card ─────────────────────────────────────────────────────────────

function ArticleCard({ item }: { item: NewsItem }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 rounded-lg border border-border bg-card p-3 transition-colors active:bg-muted"
    >
      {/* Thumbnail */}
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg
              className="h-6 w-6 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5M12 3.75v16.5" />
            </svg>
          </div>
        )}
      </div>

      {/* Text */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {item.title}
        </p>
        <p className="text-xs text-muted-foreground">
          {item.source} · {relativeTime(item.pubDate)}
        </p>
        {item.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {item.description}
          </p>
        )}
      </div>
    </a>
  )
}

// ─── Transfer card ────────────────────────────────────────────────────────────

type TransferCategory = 'Transfer' | 'Loan' | 'Return from loan' | 'Free'

interface ParsedType {
  category: TransferCategory
  label: string
}

const CLUB_NAME_OVERRIDES: Record<string, string> = {
  'aik stockholm': 'AIK',
}

function normalizeClubName(name: string): string {
  return CLUB_NAME_OVERRIDES[name.toLowerCase()] ?? name
}

function parseTransferType(raw: string): ParsedType {
  if (raw === 'Loan') return { category: 'Loan', label: 'Loan' }
  if (raw === 'Free') return { category: 'Free', label: 'Free' }
  if (/return from loan|back from loan/i.test(raw)) return { category: 'Return from loan', label: 'Return from loan' }
  if (/free agent/i.test(raw)) return { category: 'Free', label: 'Free' }
  // "Transfer" = paid, unknown fee; anything else (e.g. "€45M") = paid with known fee
  const fee = raw === 'Transfer' ? null : raw
  return { category: 'Transfer', label: fee ? `Transfer - ${fee}` : 'Transfer' }
}

const TRANSFER_TYPE_COLORS: Record<TransferCategory, string> = {
  'Transfer':        '#F5A623',
  'Loan':            '#8A8A9A',
  'Return from loan':'#60A5FA',
  'Free':            '#2ECC71',
}

function TransferTypeBadge({ type }: { type: string }) {
  const { category, label } = parseTransferType(type)
  const color = TRANSFER_TYPE_COLORS[category]
  return (
    <span
      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ color, backgroundColor: `${color}22` }}
    >
      {label}
    </span>
  )
}

function ClubLogo({ src, name }: { src: string | null; name: string }) {
  if (!src) {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-bold text-muted-foreground">
        {(name ?? '?').slice(0, 2).toUpperCase()}
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      className="h-8 w-8 shrink-0 object-contain"
      loading="lazy"
      onError={(e) => {
        ;(e.currentTarget as HTMLImageElement).style.display = 'none'
      }}
    />
  )
}

function TransferCard({ transfer }: { transfer: Transfer }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      {/* Player row */}
      <div className="mb-3 flex items-center gap-3">
        {transfer.player.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={transfer.player.photo}
            alt={transfer.player.name}
            className="h-10 w-10 shrink-0 rounded-full object-cover bg-muted"
            loading="lazy"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
            {transfer.player.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-semibold text-foreground">
            {transfer.player.name}
          </span>
          <span className="text-xs text-muted-foreground">{formatDate(transfer.date)}</span>
        </div>
        <TransferTypeBadge type={transfer.type} />
      </div>

      {/* Clubs row: Out → In */}
      <div className="flex items-center gap-2">
        <ClubLogo src={transfer.teamOut.logo} name={transfer.teamOut.name} />
        <span className="min-w-0 flex-1 truncate text-xs text-foreground">
          {normalizeClubName(transfer.teamOut.name)}
        </span>
        <span className="shrink-0 px-1 text-sm font-bold text-muted-foreground">→</span>
        <span className="min-w-0 flex-1 truncate text-right text-xs text-foreground">
          {normalizeClubName(transfer.teamIn.name)}
        </span>
        <ClubLogo src={transfer.teamIn.logo} name={transfer.teamIn.name} />
      </div>
    </div>
  )
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────

function FilterTabs({
  sources,
  active,
  onChange,
}: {
  sources: readonly string[]
  active: string
  onChange: (s: string) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {sources.map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={[
            'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
            active === s
              ? 'bg-gold text-[#0F0F11]'
              : 'bg-card border border-border text-muted-foreground',
          ].join(' ')}
        >
          {s}
        </button>
      ))}
    </div>
  )
}

// ─── Transfers feed ───────────────────────────────────────────────────────────

function TransfersFeed() {
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/transfers')
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error)
        setTransfers(json.data ?? [])
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <TransferSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-border bg-card px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">Could not load transfers.</p>
        <p className="mt-1 text-xs text-muted-foreground">{error}</p>
      </div>
    )
  }

  if (transfers.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">No recent transfers.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {transfers.map((t) => (
        <TransferCard key={t.id} transfer={t} />
      ))}
    </div>
  )
}

// ─── Main feed ────────────────────────────────────────────────────────────────

export default function NewsFeed() {
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeSource, setActiveSource] = useState<string>('News')

  useEffect(() => {
    fetch('/api/news')
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error)
        setItems(json.data ?? [])
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const visible = items

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      {/* Filter */}
      <FilterTabs sources={SOURCES} active={activeSource} onChange={setActiveSource} />

      {/* Transfers tab has its own dedicated feed from API-Football */}
      {activeSource === 'Transfers' ? (
        <TransfersFeed />
      ) : loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ArticleSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-border bg-card px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">Could not load news.</p>
          <p className="mt-1 text-xs text-muted-foreground">{error}</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-lg border border-border bg-card px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">No news found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map((item) => (
            <ArticleCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
