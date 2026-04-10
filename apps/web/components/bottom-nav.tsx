"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Search, Newspaper, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home",     href: "/home",     icon: Home },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Search",   href: "/search",   icon: Search },
  { label: "News",     href: "/news",     icon: Newspaper },
  { label: "Settings", href: "/settings", icon: Settings },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex h-[var(--nav-height)] items-center justify-around border-t"
      style={{
        background: "var(--card)",
        borderColor: "var(--border)",
      }}
    >
      {navItems.map(({ label, href, icon: Icon }) => {
        const isActive = pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors",
              isActive
                ? "text-[var(--color-gold)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon
              size={22}
              strokeWidth={isActive ? 2.5 : 1.75}
              aria-hidden="true"
            />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
