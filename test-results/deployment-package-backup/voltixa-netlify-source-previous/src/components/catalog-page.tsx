"use client";
import Link from "next/link";
import {
  ChevronRight,
  Grid2X2,
  List,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { brands, products } from "@/lib/data";
import { ProductCard } from "./product-card";
import { StoreLayout } from "./store-layout";

export function CatalogPage({
  title,
  description,
  category,
  query = "",
}: {
  title: string;
  description: string;
  category?: string;
  query?: string;
}) {
  const [filterOpen, setFilterOpen] = useState(false),
    [selectedBrands, setBrands] = useState<string[]>([]),
    [sort, setSort] = useState("featured"),
    [inStock, setInStock] = useState(false);
  const list = useMemo(() => {
    const x = products.filter(
      (p) =>
        (!category || p.category === category) &&
        (!query ||
          `${p.name} ${p.brand} ${p.category}`
            .toLowerCase()
            .includes(query.toLowerCase())) &&
        (!selectedBrands.length || selectedBrands.includes(p.brand)) &&
        (!inStock || p.stock > 0),
    );
    return [...x].sort((a, b) =>
      sort === "low"
        ? a.price - b.price
        : sort === "high"
          ? b.price - a.price
          : sort === "rating"
            ? b.rating - a.rating
            : 0,
    );
  }, [category, query, selectedBrands, inStock, sort]);
  const filters = (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between">
          <h3 className="font-bold">Brand</h3>
          {selectedBrands.length > 0 && (
            <button
              className="text-xs font-semibold text-blue-600"
              onClick={() => setBrands([])}
            >
              Clear
            </button>
          )}
        </div>
        <div className="mt-3 space-y-2.5">
          {brands.map((b) => (
            <label
              key={b}
              className="flex cursor-pointer items-center gap-2.5 text-sm"
            >
              <input
                type="checkbox"
                checked={selectedBrands.includes(b)}
                onChange={() =>
                  setBrands((s) =>
                    s.includes(b) ? s.filter((x) => x !== b) : [...s, b],
                  )
                }
                className="size-4 accent-blue-600"
              />
              {b}
            </label>
          ))}
        </div>
      </div>
      <hr className="border-slate-200" />
      <div>
        <h3 className="font-bold">Availability</h3>
        <label className="mt-3 flex items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => setInStock(e.target.checked)}
            className="size-4 accent-blue-600"
          />{" "}
          In stock only
        </label>
      </div>
      <hr className="border-slate-200" />
      <div>
        <h3 className="font-bold">Price</h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <input
            aria-label="Minimum price"
            placeholder="Min"
            className="h-10 min-w-0 rounded-lg border px-3 text-sm"
          />
          <input
            aria-label="Maximum price"
            placeholder="Max"
            className="h-10 min-w-0 rounded-lg border px-3 text-sm"
          />
        </div>
      </div>
      <div>
        <h3 className="font-bold">Rating</h3>
        <div className="mt-3 space-y-2">
          {[4, 3, 2].map((x) => (
            <label key={x} className="flex gap-2 text-sm">
              <input type="radio" name="rating" className="accent-blue-600" />{" "}
              {x} stars & up
            </label>
          ))}
        </div>
      </div>
    </div>
  );
  return (
    <StoreLayout>
      <div className="container-shell py-6 sm:py-9">
        <nav className="flex items-center gap-1 text-xs text-slate-500">
          <Link href="/">Home</Link>
          <ChevronRight size={13} />
          <span>{title}</span>
        </nav>
        <div className="mt-5 max-w-3xl">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <div className="mt-7 flex flex-col gap-3 border-y border-slate-200 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            <strong className="text-slate-900">{list.length}</strong> products
          </p>
          <div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:w-auto">
            <button
              onClick={() => setFilterOpen(true)}
              className="flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-bold lg:hidden"
            >
              <SlidersHorizontal size={16} />
              <span className="hidden sm:inline">Filters</span>
            </button>
            <select
              aria-label="Sort products"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-10 min-w-0 rounded-xl border bg-white px-2 text-xs font-semibold sm:px-3 sm:text-sm"
            >
              <option value="featured">Featured</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
              <option value="rating">Highest rated</option>
            </select>
            <button
              aria-label="Grid view"
              className="grid size-10 place-items-center rounded-lg bg-slate-950 text-white"
            >
              <Grid2X2 size={17} />
            </button>
            <button
              aria-label="List view"
              className="hidden size-10 place-items-center rounded-lg border sm:grid"
            >
              <List size={17} />
            </button>
          </div>
        </div>
        <div className="mt-6 grid gap-7 lg:grid-cols-[230px_1fr]">
          <aside className="hidden rounded-2xl border border-slate-200 bg-white p-5 lg:block">
            {filters}
          </aside>
          <div>
            {(selectedBrands.length > 0 || inStock) && (
              <div className="mb-4 flex flex-wrap gap-2">
                {selectedBrands.map((b) => (
                  <button
                    onClick={() => setBrands((s) => s.filter((x) => x !== b))}
                    key={b}
                    className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"
                  >
                    {b}
                    <X size={13} />
                  </button>
                ))}
                {inStock && (
                  <button
                    onClick={() => setInStock(false)}
                    className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"
                  >
                    In stock
                    <X size={13} />
                  </button>
                )}
              </div>
            )}
            {list.length ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                {list.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed bg-white p-14 text-center">
                <h2 className="text-xl font-bold">No products match</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Try removing one or more filters.
                </p>
                <button
                  onClick={() => {
                    setBrands([]);
                    setInStock(false);
                  }}
                  className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {filterOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button
            className="absolute inset-0 bg-slate-950/40"
            aria-label="Close filters"
            onClick={() => setFilterOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto overscroll-contain rounded-t-3xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:p-6">
            <div className="mb-6 flex justify-between">
              <h2 className="text-xl font-extrabold">Filters</h2>
              <button
                onClick={() => setFilterOpen(false)}
                className="grid size-9 place-items-center rounded-full bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            {filters}
            <button
              onClick={() => setFilterOpen(false)}
              className="sticky bottom-0 mt-8 h-12 w-full rounded-xl bg-blue-600 font-bold text-white"
            >
              Show {list.length} products
            </button>
          </div>
        </div>
      )}
    </StoreLayout>
  );
}
