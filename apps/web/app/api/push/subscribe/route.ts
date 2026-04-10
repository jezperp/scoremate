import { createClient } from '@scoremate/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/push/subscribe
 * Body: { endpoint: string, p256dh: string, auth: string }
 * Saves (or updates) a push subscription for the authenticated user.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const { endpoint, p256dh, auth } = body ?? {}

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: 'Missing endpoint, p256dh or auth' }, { status: 400 })
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      { user_id: user.id, endpoint, p256dh, auth },
      { onConflict: 'user_id, endpoint' },
    )

  if (error) {
    console.error('[push/subscribe]', error)
    return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

/**
 * DELETE /api/push/subscribe
 * Body: { endpoint: string }
 * Removes the subscription for the authenticated user.
 */
export async function DELETE(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const { endpoint } = body ?? {}

  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 })
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', endpoint)

  if (error) {
    console.error('[push/subscribe DELETE]', error)
    return NextResponse.json({ error: 'Failed to remove subscription' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
