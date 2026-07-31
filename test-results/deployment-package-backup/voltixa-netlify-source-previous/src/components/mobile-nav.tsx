"use client";
import Link from "next/link";
import { Grid2X2, Heart, Home, Search, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
const links = [
  ["Home", "/", Home],
  ["Categories", "/category/mobile-phones", Grid2X2],
  ["Search", "/search", Search],
  ["Wishlist", "/account/wishlist", Heart],
  ["Account", "/account", UserRound],
] as const;
export function MobileNav() {
  const path = usePathname();
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-50 grid h-[calc(4rem+env(safe-area-inset-bottom))] grid-cols-5 border-t border-slate-200 bg-white px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(15,23,42,.08)] md:hidden"
    >
      {links.map(([label, href, Icon]) => {
        const active = href === "/" ? path === href : path.startsWith(href);
        return (
          <Link
            key={label}
            href={href}
            className={`min-w-0 flex flex-col items-center justify-center gap-1 text-[9px] font-semibold sm:text-[10px] ${active ? "text-blue-600" : "text-slate-500"}`}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
            <span className="max-w-full truncate px-0.5">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
