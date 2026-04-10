-- Favoritlag
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
  on user_favorite_teams
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Favoritligor
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
  on user_favorite_leagues
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
