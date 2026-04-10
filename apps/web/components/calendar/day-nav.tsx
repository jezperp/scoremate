"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface DayNavProps {
  date: string; // YYYY-MM-DD
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  if (dateStr === todayStr) return "Today";
  if (dateStr === yesterdayStr) return "Yesterday";
  if (dateStr === tomorrowStr) return "Tomorrow";

  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().slice(0, 10);
}

export function DayNav({ date, onPrev, onNext, onToday }: DayNavProps) {
  const label = formatDate(date);
  const today = isToday(date);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "#2A2A32" }}>
      <button
        onClick={onPrev}
        className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10 active:bg-white/20"
        aria-label="Previous day"
      >
        <ChevronLeft size={20} style={{ color: "#8A8A9A" }} />
      </button>

      <button
        onClick={onToday}
        className="flex flex-col items-center gap-0.5"
        aria-label="Go to today"
      >
        <span
          className="text-sm font-semibold capitalize tracking-wide"
          style={{ color: today ? "#F5A623" : "#E8E8F0" }}
        >
          {label}
        </span>
        {!today && (
          <span className="text-[10px] font-medium" style={{ color: "#F5A623" }}>
            Today
          </span>
        )}
      </button>

      <button
        onClick={onNext}
        className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10 active:bg-white/20"
        aria-label="Next day"
      >
        <ChevronRight size={20} style={{ color: "#8A8A9A" }} />
      </button>
    </div>
  );
}
