# Scoremate

A modern football app for live scores, match results, news, and transfers. Built with a Swedish focus (Allsvenskan, Superettan) alongside the major European leagues.

> Inspired by Forza Football.

---

## Tech Stack

| Part | Choice |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Supabase Auth (Google + Apple OAuth) |
| Database | Supabase (PostgreSQL) |
| Sports data | API-Football v3 |
| News | RSS feeds |
| Deploy | Vercel |
| Monorepo | Turborepo |
| Native (future) | Expo (React Native) |

---

## Project Structure

```
scoremate/
├── apps/
│   ├── web/          ← Next.js app
│   └── native/       ← Expo app (future)
├── packages/
│   ├── ui/           ← Shared components
│   ├── api/          ← API clients
│   └── types/        ← TypeScript types
├── turbo.json
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- An [API-Football](https://www.api-football.com) account (via RapidAPI)
- VAPID keys for web push (generate with `npx web-push generate-vapid-keys`)

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/scoremate.git
cd scoremate
npm install
```

### 2. Set up environment variables

Create `apps/web/.env.local` and add the following:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

API_FOOTBALL_KEY=
API_FOOTBALL_HOST=v3.football.api-sports.io

NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=

PUSH_SECRET=
```

### 3. Set up Supabase

Run the following in the Supabase SQL Editor:

```sql
-- Favorite teams
create table if not exists user_favorite_teams (
  user_id     uuid    not null references auth.users(id) on delete cascade,
  team_id     integer not null,
  team_name   text    not null,
  team_logo   text,
  created_at  timestamptz not null default now(),
  primary key (user_id, team_id)
);
alter table user_favorite_teams enable row level security;
create policy "Users manage own favorite teams"
  on user_favorite_teams for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Favorite leagues
create table if not exists user_favorite_leagues (
  user_id     uuid    not null references auth.users(id) on delete cascade,
  league_id   integer not null,
  league_name text    not null,
  league_logo text,
  created_at  timestamptz not null default now(),
  primary key (user_id, league_id)
);
alter table user_favorite_leagues enable row level security;
create policy "Users manage own favorite leagues"
  on user_favorite_leagues for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Push subscriptions
create table if not exists push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  endpoint    text not null,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now(),
  unique (user_id, endpoint)
);
alter table push_subscriptions enable row level security;
create policy "Users can manage own subscriptions"
  on push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

### 4. Run the development server

```bash
cd apps/web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Features

### Phase 1 – MVP ✅
- **Home** – upcoming and recent matches for favorite teams
- **Calendar** – day-by-day match view grouped by league, sorted by favorites
- **News** – RSS feeds from Aftonbladet, Expressen, SVT Sport, BBC Sport, The Guardian
- **Settings** – favorite teams & leagues, account, notifications

### Phase 2 – In progress 🔜
- **Live scores** – match detail page with 1-minute polling
- **Web push notifications** – match start, goals, full time (Chrome/Edge/Android)
- **Search** – find teams and leagues, add to favorites
- **Transfers** – recent transfers tab on the news page

### Phase 3 – Requires API-Football upgrade
- Upcoming matches beyond 3 days (`?team=ID&next=10`)
- Extended calendar range
- Shorter live polling intervals
- Detailed match stats, lineups, events

### Phase 4 – Native app (future)
- Expo app for iOS + Android
- Native push notifications (resolves iOS limitation)

---

## Leagues

| League | ID |
|---|---|
| Allsvenskan | 113 |
| Superettan | 114 |
| Premier League | 39 |
| La Liga | 140 |
| Bundesliga | 78 |
| Serie A | 135 |
| Ligue 1 | 61 |
| Champions League | 2 |
| Europa League | 3 |

---

## News Sources

| Source | Language | Type |
|---|---|---|
| Aftonbladet | Swedish | Football-only |
| Expressen | Swedish | Football-filtered |
| SVT Sport | Swedish | Football-filtered |
| BBC Sport | English | Football-only |
| The Guardian | English | Football-only |

---

## Deployment

The app is deployed on [Vercel](https://vercel.com). Set root directory to `apps/web` and add all environment variables listed above.

After deploying, update your Supabase auth settings:
- **Site URL:** `https://your-domain.vercel.app`
- **Redirect URL:** `https://your-domain.vercel.app/auth/callback`

---

## API

Sports data is powered by [API-Football v3](https://www.api-football.com/documentation-v3).

> **Note:** The free tier only covers yesterday, today, and tomorrow (3 days). Upgrading to Starter (~$9/mo) unlocks all dates and the `next` parameter.

---

## License

MIT
