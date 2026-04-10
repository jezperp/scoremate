"use client";

import { useEffect, useState, useCallback } from "react";
import type { Match } from "@scoremate/types";
import { leaguePriorityIndex } from "@/lib/league-priority";
import { DayNav } from "./day-nav";
import { LeagueGroup } from "./league-group";
import { MatchesSkeleton } from "./skeleton";
import { EmptyState } from "./empty-state";

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function offsetDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

interface LeagueGroupData {
  leagueId: number;
  leagueName: string;
  leagueLogo: string;
  country: string;
  matches: Match[];
}

const LIVE_STATUSES = ["1H", "HT", "2H", "ET", "BT", "P", "LIVE"];

function groupByLeague(matches: Match[], favLeagueIds: Set<number>): LeagueGroupData[] {
  const map = new Map<number, LeagueGroupData>();

  for (const match of matches) {
    const id = match.league.id;
    if (!map.has(id)) {
      map.set(id, {
        leagueId: id,
        leagueName: match.league.name,
        leagueLogo: match.league.logo,
        country: match.league.country,
        matches: [],
      });
    }
    map.get(id)!.matches.push(match);
  }

  return Array.from(map.values()).sort((a, b) => {
    const aFav = favLeagueIds.has(a.leagueId);
    const bFav = favLeagueIds.has(b.leagueId);
    const aPrio = leaguePriorityIndex(a.leagueId);
    const bPrio = leaguePriorityIndex(b.leagueId);
    const aLive = a.matches.some((m) => LIVE_STATUSES.includes(m.status.short));
    const bLive = b.matches.some((m) => LIVE_STATUSES.includes(m.status.short));

    // Tier 1: favorite leagues
    if (aFav !== bFav) return aFav ? -1 : 1;

    // Tier 2: priority leagues
    const aIsPrio = aPrio !== Infinity;
    const bIsPrio = bPrio !== Infinity;
    if (aIsPrio !== bIsPrio) return aIsPrio ? -1 : 1;
    if (aIsPrio && bIsPrio && aPrio !== bPrio) return aPrio - bPrio;

    // Tier 3: live leagues
    if (aLive !== bLive) return aLive ? -1 : 1;

    // Tier 4: rest — sort by match count
    return b.matches.length - a.matches.length;
  });
}

interface CalendarClientProps {
  favLeagueIds: number[];
}

export function CalendarClient({ favLeagueIds }: CalendarClientProps) {
  const favSet = new Set(favLeagueIds);
  const [date, setDate] = useState(getTodayStr);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async (dateStr: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/matches?date=${dateStr}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      setMatches(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches(date);
  }, [date, fetchMatches]);

  const groups = groupByLeague(matches, favSet);

  return (
    <div className="flex min-h-[calc(100vh-var(--nav-height))] flex-col" style={{ backgroundColor: "#0F0F11" }}>
      <DayNav
        date={date}
        onPrev={() => setDate((d) => offsetDate(d, -1))}
        onNext={() => setDate((d) => offsetDate(d, 1))}
        onToday={() => setDate(getTodayStr())}
      />

      <div className="flex flex-1 flex-col">
        {loading ? (
          <MatchesSkeleton />
        ) : error ? (
          <div className="flex flex-1 items-center justify-center px-6 py-20 text-center">
            <p className="text-sm" style={{ color: "#E8383A" }}>{error}</p>
          </div>
        ) : groups.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-6 py-4">
            {groups.map((group) => (
              <LeagueGroup
                key={group.leagueId}
                leagueName={group.leagueName}
                leagueLogo={group.leagueLogo}
                country={group.country}
                matches={group.matches}
                isFavorite={favSet.has(group.leagueId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
