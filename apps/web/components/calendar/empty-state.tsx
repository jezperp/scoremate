import { CalendarX } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-20 text-center">
      <CalendarX size={40} style={{ color: "#2A2A32" }} />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium" style={{ color: "#8A8A9A" }}>
          No matches found
        </p>
        <p className="text-xs" style={{ color: "#8A8A9A" }}>
          There are no scheduled matches for the selected date.
        </p>
      </div>
    </div>
  );
}
