export function MatchesSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-4 py-4 animate-pulse">
      {[0, 1, 2].map((groupIdx) => (
        <div key={groupIdx} className="flex flex-col gap-2">
          {/* League header skeleton */}
          <div className="flex items-center gap-2 px-0 py-2">
            <div className="h-5 w-5 rounded-full" style={{ backgroundColor: "#2A2A32" }} />
            <div className="h-3 w-32 rounded" style={{ backgroundColor: "#2A2A32" }} />
          </div>

          {/* Match card skeletons */}
          {[0, 1, 2].map((cardIdx) => (
            <div
              key={cardIdx}
              className="flex flex-col gap-3 rounded-xl px-4 py-3"
              style={{ backgroundColor: "#1A1A1F", border: "1px solid #2A2A32" }}
            >
              {/* Status row */}
              <div className="h-2.5 w-20 rounded" style={{ backgroundColor: "#2A2A32" }} />

              {/* Teams row */}
              <div className="flex items-center gap-3">
                <div className="flex flex-1 items-center gap-2">
                  <div className="h-7 w-7 rounded-full shrink-0" style={{ backgroundColor: "#2A2A32" }} />
                  <div className="h-3 w-24 rounded" style={{ backgroundColor: "#2A2A32" }} />
                </div>
                <div className="h-5 w-12 rounded" style={{ backgroundColor: "#2A2A32" }} />
                <div className="flex flex-1 items-center justify-end gap-2">
                  <div className="h-3 w-24 rounded" style={{ backgroundColor: "#2A2A32" }} />
                  <div className="h-7 w-7 rounded-full shrink-0" style={{ backgroundColor: "#2A2A32" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
