import type { Match } from "@scoremate/types";
import { MatchCard } from "@/components/calendar/match-card";

interface MatchesSectionProps {
  title: string;
  matches: Match[];
  accent?: boolean;
}

export function MatchesSection({ title, matches, accent = false }: MatchesSectionProps) {
  if (matches.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2 px-4">
        {accent && (
          <span
            className="h-2 w-2 rounded-full animate-pulse shrink-0"
            style={{ backgroundColor: "#E8383A" }}
            aria-hidden="true"
          />
        )}
        <h2
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: accent ? "#E8383A" : "#F5A623" }}
        >
          {title}
        </h2>
      </div>

      <div className="flex flex-col gap-2 px-4">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>
    </section>
  );
}
