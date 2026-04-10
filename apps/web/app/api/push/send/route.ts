import { sendPushToUser, sendPushToAll, type PushPayload } from '@/lib/push'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/push/send
 * Protected by PUSH_SECRET – for internal server-to-server use only.
 *
 * Body:
 *   { userId?: string, payload: PushPayload }
 *   Omit userId to broadcast to all subscribers.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.PUSH_SECRET
  const authHeader = request.headers.get('authorization')

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const { userId, payload } = (body ?? {}) as { userId?: string; payload?: PushPayload }

  if (!payload?.title || !payload?.body) {
    return NextResponse.json({ error: 'Missing payload.title or payload.body' }, { status: 400 })
  }

  try {
    if (userId) {
      await sendPushToUser(userId, payload)
    } else {
      await sendPushToAll(payload)
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[push/send]', err)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
