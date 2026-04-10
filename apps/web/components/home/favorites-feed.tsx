"use client";

import { useEffect, useState } from "react";
import type { Match } from "@scoremate/types";
import { MatchesSection } from "./matches-section";
import { FeedSkeleton } from "./feed-skeleton";

interface FavoritesFeedProps {
  teamIds: number[];
}

interface FeedData {
  live: Match[];
  upcoming: Match[];
}

export function FavoritesFeed({ teamIds }: FavoritesFeedProps) {
  const [data, setData] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (teamIds.length === 0) return;

    setLoading(true);
    setError(null);

    fetch(`/api/favorites/matches?teamIds=${teamIds.join(",")}`)
      .then(async (res) => {
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error ?? `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((json) => setData(json.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Something went wrong"))
      .finally(() => setLoading(false));
  }, [teamIds]);

  if (loading) return <FeedSkeleton />;

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-20 text-center">
        <p className="text-sm" style={{ color: "#E8383A" }}>
          {error}
        </p>
      </div>
    );
  }

  const hasLive = (data?.live?.length ?? 0) > 0;
  const hasUpcoming = (data?.upcoming?.length ?? 0) > 0;

  if (!hasLive && !hasUpcoming) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-20 text-center">
        <p className="text-sm" style={{ color: "#8A8A9A" }}>
          No matches found for your favorite teams in the coming days.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      {hasLive && (
        <MatchesSection
          title="Live & recent"
          matches={data!.live}
          accent={true}
        />
      )}
      {hasUpcoming && (
        <MatchesSection
          title="Upcoming"
          matches={data!.upcoming}
          accent={false}
        />
      )}
    </div>
  );
}
