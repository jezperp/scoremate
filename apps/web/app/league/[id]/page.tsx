'use client'

import { useParams, useRouter } from 'next/navigation'

export default function LeaguePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  return (
    <div
      className="flex min-h-[calc(100vh-var(--nav-height))] flex-col"
      style={{ background: '#0F0F11' }}
    >
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
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm" style={{ color: '#8A8A9A' }}>League {id} – coming soon</p>
      </div>
    </div>
  )
}
