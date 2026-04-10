import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

// Configure VAPID lazily so build doesn't fail when env vars are absent
function configureVapid() {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  )
}

// Admin client bypasses RLS – only used server-side
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PushPayload {
  title: string
  body: string
  icon?: string
  url?: string
}

interface Subscription {
  id: string
  endpoint: string
  p256dh: string
  auth: string
}

// ─── Core sender ─────────────────────────────────────────────────────────────

/**
 * Send a push notification to all active subscriptions for a user.
 * Automatically removes expired/invalid subscriptions (HTTP 410/404).
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<void> {
  const supabase = adminClient()

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (!subs?.length) return

  configureVapid()
  const results = await Promise.allSettled(
    (subs as Subscription[]).map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
      ),
    ),
  )

  // Clean up expired subscriptions
  const expired = (subs as Subscription[])
    .filter((_, i) => {
      const r = results[i]
      if (r.status !== 'rejected') return false
      const status = (r.reason as { statusCode?: number })?.statusCode
      return status === 410 || status === 404
    })
    .map((s) => s.id)

  if (expired.length) {
    await supabase.from('push_subscriptions').delete().in('id', expired)
  }
}

/**
 * Send a push notification to all users who have subscriptions.
 * Used for broadcast events (e.g. breaking transfer news).
 */
export async function sendPushToAll(payload: PushPayload): Promise<void> {
  const supabase = adminClient()
  const { data: userIds } = await supabase
    .from('push_subscriptions')
    .select('user_id')

  if (!userIds?.length) return

  const unique = Array.from(new Set((userIds as { user_id: string }[]).map((r) => r.user_id)))
  await Promise.allSettled(unique.map((uid) => sendPushToUser(uid, payload)))
}

// ─── Notification triggers ────────────────────────────────────────────────────

export async function notifyMatchStart(
  userId: string,
  matchId: number,
  homeTeam: string,
  awayTeam: string,
): Promise<void> {
  await sendPushToUser(userId, {
    title: '⏱ Match starting soon',
    body: `${homeTeam} vs ${awayTeam} – kick-off in 5 minutes`,
    url: `/match/${matchId}`,
  })
}

export async function notifyGoal(
  userId: string,
  matchId: number,
  scoringTeam: string,
  homeTeam: string,
  awayTeam: string,
  score: string,
): Promise<void> {
  await sendPushToUser(userId, {
    title: `⚽ Goal! ${scoringTeam}`,
    body: `${homeTeam} ${score} ${awayTeam}`,
    url: `/match/${matchId}`,
  })
}

export async function notifyMatchEnd(
  userId: string,
  matchId: number,
  homeTeam: string,
  awayTeam: string,
  score: string,
): Promise<void> {
  await sendPushToUser(userId, {
    title: '🏁 Full time',
    body: `${homeTeam} ${score} ${awayTeam}`,
    url: `/match/${matchId}`,
  })
}
