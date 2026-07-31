"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  ChevronDown,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  UserRound,
  X,
  ChevronRight,
} from "lucide-react";
import { Brand } from "./brand";
import { categories, products } from "@/lib/data";
import { formatPrice } from "@/lib/utils";
import { useShop } from "@/lib/store";

export function Header() {
  const router = useRouter();
  const [menu, setMenu] = useState(false),
    [query, setQuery] = useState(""),
    [searchOpen, setSearchOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const { cart, wishlist, compare, setCartOpen } = useShop();
  const suggestions = useMemo(
    () =>
      query.trim().length < 2
        ? products.slice(0, 4)
        : products
            .filter((p) =>
              `${p.name} ${p.brand}`
                .toLowerCase()
                .includes(query.toLowerCase()),
            )
            .slice(0, 5),
    [query],
  );
  const subtotal = cart.reduce((s, x) => s + x.product.price * x.quantity, 0),
    count = cart.reduce((s, x) => s + x.quantity, 0);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node))
        setSearchOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim())
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    setSearchOpen(false);
  }
  return (
    <>
      <div className="bg-slate-950 text-white">
        <div className="container-shell flex h-9 items-center justify-between text-[11px] font-medium sm:text-xs">
          <p className="min-w-0 truncate">
            <span className="text-cyan-400">
              <span className="sm:hidden">Free delivery</span>
              <span className="hidden sm:inline">Free nationwide delivery</span>
            </span>{" "}
            on orders over Rs. 5,000
          </p>
          <div className="hidden items-center gap-5 sm:flex">
            <span>Official warranty</span>
            <Link href="/installments">Easy installments</Link>
            <Link href="/track-order">Track order</Link>
          </div>
        </div>
      </div>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="container-shell flex h-16 items-center gap-2 sm:h-[72px] sm:gap-3 lg:gap-6">
          <button
            onClick={() => setMenu(!menu)}
            aria-label="Open category menu"
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 sm:size-11 lg:hidden"
          >
            {menu ? <X /> : <Menu />}
          </button>
          <div className="sm:hidden">
            <Brand compact />
          </div>
          <div className="hidden sm:block">
            <Brand />
          </div>
          <button
            onClick={() => setMenu(!menu)}
            className="hidden h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold hover:border-blue-300 hover:bg-blue-50 lg:flex"
          >
            <Menu size={18} /> Categories <ChevronDown size={15} />
          </button>
          <div ref={wrap} className="relative hidden flex-1 md:block">
            <form
              onSubmit={submit}
              className="relative flex h-12 overflow-hidden rounded-xl border-2 border-slate-200 bg-slate-50 focus-within:border-blue-500"
            >
              <Search className="ml-4 self-center text-slate-400" size={20} />
              <input
                value={query}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSearchOpen(true);
                }}
                placeholder="Search mobiles, earbuds, laptops and more"
                aria-label="Search products"
                className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
              />
              <button className="bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700">
                Search
              </button>
            </form>
            {searchOpen && (
              <div className="absolute inset-x-0 top-14 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                <div className="flex items-center justify-between px-3 py-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    {query ? "Suggestions" : "Trending now"}
                  </p>
                  <span className="text-xs text-slate-400">
                    Press Enter to search
                  </span>
                </div>
                {suggestions.length ? (
                  suggestions.map((p) => (
                    <Link
                      onClick={() => setSearchOpen(false)}
                      href={`/product/${p.slug}`}
                      key={p.id}
                      className="flex items-center gap-3 rounded-xl p-3 hover:bg-slate-50"
                    >
                      <span className="grid size-10 place-items-center rounded-lg bg-blue-50 text-blue-600">
                        <Search size={17} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <strong className="block truncate text-sm">
                          {p.name}
                        </strong>
                        <span className="text-xs text-slate-500">
                          {p.brand} · {formatPrice(p.price)}
                        </span>
                      </span>
                      <ChevronRight size={16} className="text-slate-400" />
                    </Link>
                  ))
                ) : (
                  <div className="p-8 text-center text-sm text-slate-500">
                    No matches yet. Try a product category or brand.
                  </div>
                )}
              </div>
            )}
          </div>
          <nav className="ml-auto flex items-center gap-1">
            <Link
              href="/compare"
              aria-label="Compare products"
              title="Compare"
              className="relative hidden size-11 place-items-center rounded-xl hover:bg-slate-100 sm:grid"
            >
              <BarChart3 size={21} />
              {compare.length > 0 && <Count value={compare.length} />}
            </Link>
            <Link
              href="/account/wishlist"
              aria-label="Wishlist"
              title="Wishlist"
              className="relative hidden size-11 place-items-center rounded-xl hover:bg-slate-100 sm:grid"
            >
              <Heart size={21} />
              {wishlist.length > 0 && <Count value={wishlist.length} />}
            </Link>
            <Link
              href="/account"
              aria-label="My account"
              title="My account"
              className="hidden size-11 place-items-center rounded-xl hover:bg-slate-100 sm:grid"
            >
              <UserRound size={21} />
            </Link>
            <button
              onClick={() => setCartOpen(true)}
              aria-label={`Open cart with ${count} items`}
              className="relative flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-3 text-white hover:bg-blue-600 sm:h-12 sm:px-4"
            >
              <ShoppingBag size={21} />
              <span className="hidden text-left lg:block">
                <small className="block text-[10px] text-slate-300">
                  {count} items
                </small>
                <strong className="block text-xs">
                  {formatPrice(subtotal)}
                </strong>
              </span>
              {count > 0 && <Count value={count} />}
            </button>
          </nav>
        </div>
        <div className="container-shell pb-2.5 md:hidden">
          <button
            onClick={() => router.push("/search")}
            className="flex h-10 w-full items-center gap-3 rounded-xl bg-slate-100 px-4 text-sm text-slate-500 sm:h-11"
          >
            <Search size={18} /> Search products and brands
          </button>
        </div>
        {menu && (
          <div className="absolute inset-x-0 top-full border-t border-slate-200 bg-white shadow-xl">
            <div className="container-shell grid max-h-[calc(100dvh-9rem)] grid-cols-1 gap-1 overflow-y-auto overscroll-contain py-3 pb-24 sm:grid-cols-2 sm:py-5 sm:pb-5 lg:grid-cols-4">
              {categories.map(([slug, label]) => (
                <Link
                  key={slug}
                  href={`/category/${slug}`}
                  onClick={() => setMenu(false)}
                  className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold hover:bg-blue-50 hover:text-blue-700"
                >
                  {label}
                  <ChevronRight size={16} />
                </Link>
              ))}
              <Link
                href="/deals"
                onClick={() => setMenu(false)}
                className="m-1 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 p-5 text-white sm:col-span-2 lg:col-span-4"
              >
                <strong className="block text-lg">Volt Week is live</strong>
                <span className="text-sm text-blue-50">
                  Shop limited-time prices across the store →
                </span>
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
function Count({ value }: { value: number }) {
  return (
    <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-cyan-500 text-[10px] font-black text-white ring-2 ring-white">
      {value}
    </span>
  );
}
