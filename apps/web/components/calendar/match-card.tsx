"use client";

import Image from "next/image";
import Link from "next/link";
import type { Match } from "@scoremate/types";

const LIVE_STATUSES = new Set(["1H", "HT", "2H", "ET", "BT", "P", "SUSP", "INT", "LIVE"]);
const FINISHED_STATUSES = new Set(["FT", "AET", "PEN", "AWD", "WO"]);

function getMatchState(status: Match["status"]): "upcoming" | "live" | "finished" {
  if (LIVE_STATUSES.has(status.short)) return "live";
  if (FINISHED_STATUSES.has(status.short)) return "finished";
  return "upcoming";
}

function formatKickoff(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  });
}

interface TeamLogoProps {
  src: string;
  alt: string;
}

function TeamLogo({ src, alt }: TeamLogoProps) {
  return (
    <div className="relative h-7 w-7 shrink-0">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-contain"
        sizes="28px"
        unoptimized
      />
    </div>
  );
}

interface StatusBadgeProps {
  state: "upcoming" | "live" | "finished";
  elapsed: number | null;
  statusShort: string;
}

function StatusBadge({ state, elapsed, statusShort }: StatusBadgeProps) {
  if (state === "live") {
    const label = statusShort === "HT" ? "HT" : elapsed ? `${elapsed}'` : "Live";
    return (
      <div className="flex items-center gap-1">
        <span
          className="h-2 w-2 rounded-full animate-pulse"
          style={{ backgroundColor: "#E8383A" }}
          aria-hidden="true"
        />
        <span className="text-[11px] font-bold tabular-nums" style={{ color: "#E8383A" }}>
          {label}
        </span>
      </div>
    );
  }
  if (state === "finished") {
    return (
      <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "#8A8A9A" }}>
        Finished
      </span>
    );
  }
  return (
    <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "#8A8A9A" }}>
      Upcoming
    </span>
  );
}

interface MatchCardProps {
  match: Match;
}

export function MatchCard({ match }: MatchCardProps) {
  const state = getMatchState(match.status);
  const showScore = state === "live" || state === "finished";

  return (
    <Link
      href={`/match/${match.id}`}
      className="flex flex-col gap-2 rounded-xl px-4 py-3 transition-opacity active:opacity-70"
      style={{ backgroundColor: "#1A1A1F", border: "1px solid #2A2A32" }}
    >
      {/* Status row */}
      <div className="flex items-center justify-between">
        <span className="text-[11px]" style={{ color: "#8A8A9A" }}>
          {match.league.round}
        </span>
        <StatusBadge state={state} elapsed={match.status.elapsed} statusShort={match.status.short} />
      </div>

      {/* Teams + score row */}
      <div className="flex items-center gap-3">
        {/* Home team */}
        <div className="flex flex-1 items-center gap-2 overflow-hidden">
          <TeamLogo src={match.home.logo} alt={match.home.name} />
          <span
            className="truncate text-sm font-medium"
            style={{
              color: state === "finished" && match.home.winner ? "#E8E8F0" : "#E8E8F0",
              fontWeight: state === "finished" && match.home.winner === true ? 700 : 500,
            }}
          >
            {match.home.name}
          </span>
        </div>

        {/* Score or time */}
        <div className="flex shrink-0 flex-col items-center justify-center" style={{ minWidth: "52px" }}>
          {showScore ? (
            <span
              className="text-lg font-bold tabular-nums"
              style={{ color: "#E8E8F0", fontVariantNumeric: "tabular-nums" }}
            >
              {match.home.goals ?? 0} – {match.away.goals ?? 0}
            </span>
          ) : (
            <span className="text-sm font-semibold tabular-nums" style={{ color: "#F5A623" }}>
              {formatKickoff(match.date)}
            </span>
          )}
        </div>

        {/* Away team */}
        <div className="flex flex-1 items-center justify-end gap-2 overflow-hidden">
          <span
            className="truncate text-sm font-medium text-right"
            style={{
              color: "#E8E8F0",
              fontWeight: state === "finished" && match.away.winner === true ? 700 : 500,
            }}
          >
            {match.away.name}
          </span>
          <TeamLogo src={match.away.logo} alt={match.away.name} />
        </div>
      </div>
    </Link>
  );
}
