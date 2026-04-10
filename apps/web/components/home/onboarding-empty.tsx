import { Star } from "lucide-react";
import Link from "next/link";

export function OnboardingEmpty() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 py-20 text-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: "#1A1A1F", border: "1.5px solid #2A2A32" }}
      >
        <Star size={28} style={{ color: "#F5A623" }} />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-base font-semibold" style={{ color: "#E8E8F0" }}>
          No favorite teams yet
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "#8A8A9A" }}>
          Choose your favorite teams in Settings to see matches and live updates here.
        </p>
      </div>

      <Link
        href="/settings"
        className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 active:scale-[0.98]"
        style={{ backgroundColor: "#F5A623", color: "#0F0F11" }}
      >
        Choose favorite teams
      </Link>
    </div>
  );
}
