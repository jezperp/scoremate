import Image from "next/image";
import type { User } from "@supabase/supabase-js";

interface HemHeaderProps {
  user: User;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function HemHeader({ user }: HemHeaderProps) {
  const name =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0] ??
    "User";
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const initials = getInitials(name);

  return (
    <header
      className="flex items-center justify-between px-4 py-3 border-b"
      style={{ borderColor: "#2A2A32" }}
    >
      {/* Wordmark */}
      <span className="text-lg font-extrabold tracking-tight text-white">
        Score<span style={{ color: "#F5A623" }}>mate</span>
      </span>

      {/* User avatar */}
      <div
        className="flex h-8 w-8 items-center justify-center rounded-full overflow-hidden shrink-0"
        style={{ backgroundColor: "#2A2A32", border: "1.5px solid #3A3A42" }}
        title={name}
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={name}
            width={32}
            height={32}
            className="h-full w-full object-cover"
            unoptimized
          />
        ) : (
          <span className="text-[11px] font-semibold" style={{ color: "#E8E8F0" }}>
            {initials}
          </span>
        )}
      </div>
    </header>
  );
}
