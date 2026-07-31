"use client";
import { Plus, Search, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { products } from "@/lib/data";
import { useShop } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import { ProductArt } from "./product-art";
import { StoreLayout } from "./store-layout";

export function ComparePage() {
  const { compare, toggleCompare, addCart } = useShop(),
    [adding, setAdding] = useState(false),
    chosen = compare
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean) as typeof products;
  const specs = [...new Set(chosen.flatMap((p) => Object.keys(p.specs)))];
  return (
    <StoreLayout>
      <div className="container-shell py-8">
        <h1 className="text-3xl font-extrabold">Compare products</h1>
        <p className="mt-2 text-sm text-slate-500">
          Compare up to four compatible products side by side.
        </p>
        <div className="scrollbar-hide mt-7 overflow-x-auto">
          <div
            className="grid min-w-[760px] gap-px overflow-hidden rounded-2xl border bg-slate-200"
            style={{
              gridTemplateColumns: `180px repeat(${Math.max(3, chosen.length)},minmax(190px,1fr))`,
            }}
          >
            <div className="bg-slate-50 p-4" />
            {chosen.map((p) => (
              <div key={p.id} className="relative bg-white p-4">
                <button
                  onClick={() => toggleCompare(p.id)}
                  aria-label={`Remove ${p.name}`}
                  className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-full bg-white shadow"
                >
                  <X size={15} />
                </button>
                <ProductArt kind={p.image} color={p.color} alt={p.name} />
                <strong className="mt-3 block text-sm">{p.name}</strong>
                <span className="mt-2 block font-extrabold">
                  {formatPrice(p.price)}
                </span>
                <button
                  onClick={() => addCart(p)}
                  className="mt-3 flex h-9 w-full items-center justify-center gap-1 rounded-lg bg-blue-600 text-xs font-bold text-white"
                >
                  <ShoppingBag size={14} /> Add to cart
                </button>
              </div>
            ))}
            {Array.from({ length: Math.max(0, 3 - chosen.length) }).map(
              (_, i) => (
                <button
                  key={i}
                  onClick={() => setAdding(true)}
                  className="grid min-h-72 place-items-center bg-white p-4 text-center text-sm font-bold text-blue-600"
                >
                  <span>
                    <Plus className="mx-auto mb-2" /> Add product
                  </span>
                </button>
              ),
            )}
            <div className="bg-slate-50 p-4 font-bold">Price</div>
            {chosen.map((p) => (
              <div key={p.id} className="bg-white p-4 text-sm font-bold">
                {formatPrice(p.price)}
              </div>
            ))}
            {Array.from({ length: Math.max(0, 3 - chosen.length) }).map(
              (_, i) => (
                <div key={i} className="bg-white" />
              ),
            )}
            <div className="bg-slate-50 p-4 font-bold">Availability</div>
            {chosen.map((p) => (
              <div key={p.id} className="bg-white p-4 text-sm text-emerald-600">
                In stock ({p.stock})
              </div>
            ))}
            {Array.from({ length: Math.max(0, 3 - chosen.length) }).map(
              (_, i) => (
                <div key={i} className="bg-white" />
              ),
            )}
            {specs.map((s) => (
              <>
                <div
                  key={`${s}-label`}
                  className="bg-slate-50 p-4 text-sm font-bold"
                >
                  {s}
                </div>
                {chosen.map((p) => (
                  <div key={`${s}-${p.id}`} className="bg-white p-4 text-sm">
                    {p.specs[s] ?? "—"}
                  </div>
                ))}
                {Array.from({ length: Math.max(0, 3 - chosen.length) }).map(
                  (_, i) => (
                    <div key={`${s}-empty-${i}`} className="bg-white" />
                  ),
                )}
              </>
            ))}
          </div>
        </div>
        {chosen.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed bg-white p-12 text-center">
            <h2 className="text-xl font-bold">Start your comparison</h2>
            <p className="mt-2 text-sm text-slate-500">
              Add products from any product card, or choose one below.
            </p>
            <button
              onClick={() => setAdding(true)}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white"
            >
              Choose products
            </button>
          </div>
        )}
      </div>
      {adding && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold">Add to comparison</h2>
              <button
                onClick={() => setAdding(false)}
                className="grid size-9 place-items-center rounded-full bg-slate-100"
              >
                <X size={17} />
              </button>
            </div>
            <div className="mt-4 flex h-11 items-center gap-2 rounded-xl border px-3">
              <Search size={17} />
              <input
                autoFocus
                placeholder="Search products"
                className="flex-1 text-sm outline-none"
              />
            </div>
            <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
              {products
                .filter((p) => !compare.includes(p.id))
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      toggleCompare(p.id);
                      setAdding(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-slate-50"
                  >
                    <ProductArt
                      kind={p.image}
                      color={p.color}
                      alt={p.name}
                      className="size-14 shrink-0"
                    />
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate text-sm">
                        {p.name}
                      </strong>
                      <small>{formatPrice(p.price)}</small>
                    </span>
                    <Plus size={17} />
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </StoreLayout>
  );
}
