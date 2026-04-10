"use client";

import Image from "next/image";
import type { Match } from "@scoremate/types";
import { MatchCard } from "./match-card";

interface LeagueGroupProps {
  leagueName: string;
  leagueLogo: string;
  country: string;
  matches: Match[];
  isFavorite?: boolean;
}

export function LeagueGroup({ leagueName, leagueLogo, country, matches, isFavorite }: LeagueGroupProps) {
  return (
    <section className="flex flex-col gap-2">
      {/* League header */}
      <div className="flex items-center gap-2 px-4 py-2">
        <div className="relative h-5 w-5 shrink-0">
          <Image
            src={leagueLogo}
            alt={leagueName}
            fill
            className="object-contain"
            sizes="20px"
            unoptimized
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="truncate text-xs font-semibold uppercase tracking-wide" style={{ color: "#E8E8F0" }}>
            {leagueName}
          </span>
          {country && (
            <>
              <span style={{ color: "#2A2A32" }}>·</span>
              <span className="truncate text-xs" style={{ color: "#8A8A9A" }}>
                {country}
              </span>
            </>
          )}
        </div>
        {isFavorite && (
          <span className="ml-auto shrink-0 text-[10px]" style={{ color: "#F5A623" }} aria-label="Favorite league">★</span>
        )}
      </div>

      {/* Match cards */}
      <div className="flex flex-col gap-2 px-4">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </section>
  );
}
