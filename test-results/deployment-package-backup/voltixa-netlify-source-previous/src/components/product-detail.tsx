"use client";
import Link from "next/link";
import { useState } from "react";
import {
  BadgeCheck,
  BarChart3,
  Check,
  ChevronRight,
  Gift,
  Heart,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/lib/data";
import { products } from "@/lib/data";
import { discountPercent, formatPrice } from "@/lib/utils";
import { useShop } from "@/lib/store";
import { ProductArt } from "./product-art";
import { ProductCard } from "./product-card";
import { StoreLayout } from "./store-layout";

export function ProductDetail({ product }: { product: Product }) {
  const [variant, setVariant] = useState(product.variants[0]),
    [quantity, setQuantity] = useState(1),
    [tab, setTab] = useState("Overview");
  const { addCart, toggleWishlist, wishlist, toggleCompare, compare } =
      useShop(),
    wished = wishlist.includes(product.id),
    compared = compare.includes(product.id);
  function add() {
    for (let i = 0; i < quantity; i++) addCart(product, variant.id);
    toast.success("Added to cart");
  }
  return (
    <StoreLayout>
      <div className="container-shell py-5 sm:py-8">
        <nav className="flex items-center gap-1 text-xs text-slate-500">
          <Link href="/">Home</Link>
          <ChevronRight size={13} />
          <Link href={`/category/${product.category}`}>
            {product.category.replace(/-/g, " ")}
          </Link>
          <ChevronRight size={13} />
          <span className="truncate">{product.name}</span>
        </nav>
        <div className="mt-6 grid gap-8 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <div className="grid gap-3 sm:grid-cols-[78px_1fr]">
              <div className="order-2 flex gap-2 sm:order-1 sm:flex-col">
                <button
                  aria-label={`View ${product.name} product photo`}
                  className="w-16 rounded-xl border-2 border-blue-600 p-1"
                >
                  <ProductArt
                    kind={product.image}
                    color={product.color}
                    alt={product.name}
                    className="rounded-lg"
                  />
                </button>
              </div>
              <ProductArt
                kind={product.image}
                color={product.color}
                alt={product.name}
                priority
                className="order-1 min-w-0 sm:order-2"
              />
            </div>
            <p className="mt-3 text-center text-xs text-slate-500">
              Original studio visualization. Final colour may vary slightly by
              display.
            </p>
          </div>
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-xs font-bold uppercase tracking-[.15em] text-blue-600">
              {product.brand}
            </p>
            <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
              {product.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="flex items-center gap-1 font-bold">
                <Star size={17} fill="#f59e0b" className="text-amber-500" />
                {product.rating}
              </span>
              <a href="#reviews" className="text-blue-600">
                {product.reviews} verified reviews
              </a>
              <span className="text-slate-400">
                SKU: {variant.id.toUpperCase()}
              </span>
            </div>
            <div className="mt-6 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 p-5">
              <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                <span className="text-3xl font-black tracking-tight">
                  {formatPrice(variant.price)}
                </span>
                <span className="pb-1 text-sm text-slate-400 line-through">
                  {formatPrice(product.retail)}
                </span>
                <span className="mb-1 rounded-md bg-red-500 px-2 py-1 text-xs font-bold text-white">
                  Save {discountPercent(variant.price, product.retail)}%
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-600">
                or {formatPrice(Math.ceil(variant.price / 12))}/month for 12
                months
              </p>
            </div>
            <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <span className="size-2 rounded-full bg-emerald-500" />
              {variant.stock} units in stock{" "}
              <span className="ml-2 rounded-md bg-blue-50 px-2 py-1 text-xs text-blue-700">
                Express available
              </span>
            </div>
            <div className="mt-6">
              <div className="flex justify-between">
                <h2 className="text-sm font-bold">Choose configuration</h2>
                <span className="text-xs text-slate-500">{variant.label}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    disabled={!v.stock}
                    onClick={() => setVariant(v)}
                    className={`relative min-w-32 rounded-xl border-2 p-3 text-left text-sm font-bold ${variant.id === v.id ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-300"} disabled:opacity-40`}
                  >
                    {v.label}
                    <span className="mt-1 block text-xs font-normal text-slate-500">
                      {formatPrice(v.price)}
                    </span>
                    {variant.id === v.id && (
                      <Check
                        className="absolute right-2 top-2 text-blue-600"
                        size={15}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <div className="flex h-13 items-center rounded-xl border border-slate-200">
                <button
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="grid size-12 place-items-center"
                >
                  <Minus size={17} />
                </button>
                <span className="w-8 text-center font-bold">{quantity}</span>
                <button
                  aria-label="Increase quantity"
                  onClick={() =>
                    setQuantity(Math.min(variant.stock, quantity + 1))
                  }
                  className="grid size-12 place-items-center"
                >
                  <Plus size={17} />
                </button>
              </div>
              <button
                onClick={add}
                className="flex h-13 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700"
              >
                <ShoppingBag size={19} /> Add to cart
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  toggleWishlist(product.id);
                  toast.success(
                    wished ? "Removed from wishlist" : "Saved to wishlist",
                  );
                }}
                className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-bold ${wished ? "border-red-200 bg-red-50 text-red-600" : "border-slate-200"}`}
              >
                <Heart size={17} fill={wished ? "currentColor" : "none"} />{" "}
                Wishlist
              </button>
              <button
                onClick={() => {
                  toggleCompare(product.id);
                  toast.success(
                    compared
                      ? "Removed from compare"
                      : compare.length >= 4
                        ? "Comparison holds four products"
                        : "Added to compare",
                  );
                }}
                className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-bold ${compared ? "border-blue-200 bg-blue-50 text-blue-600" : "border-slate-200"}`}
              >
                <BarChart3 size={17} /> Compare
              </button>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                [Truck, "Delivery", "2–5 working days"],
                [ShieldCheck, "Warranty", "Official coverage"],
                [BadgeCheck, "Authenticity", "Verified product"],
                [PackageCheck, "Returns", "Eligibility applies"],
              ].map(([Icon, a, b]) => (
                <div
                  key={a as string}
                  className="flex gap-3 rounded-xl border border-slate-200 p-3"
                >
                  <Icon size={19} className="text-blue-600" />
                  <span>
                    <strong className="block text-xs">{a as string}</strong>
                    <small className="text-[11px] text-slate-500">
                      {b as string}
                    </small>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <section className="mt-14 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="scrollbar-hide flex overflow-x-auto border-b px-4">
            {[
              "Overview",
              "Specifications",
              "Warranty",
              "Reviews",
              "Questions",
            ].map((x) => (
              <button
                onClick={() => setTab(x)}
                key={x}
                className={`h-14 shrink-0 border-b-2 px-4 text-sm font-bold ${tab === x ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500"}`}
              >
                {x}
              </button>
            ))}
          </div>
          <div className="p-6 sm:p-8">
            {tab === "Overview" && (
              <div className="grid gap-8 md:grid-cols-2">
                <div>
                  <h2 className="text-2xl font-extrabold">Built to keep up</h2>
                  <p className="mt-3 leading-7 text-slate-600">
                    {product.description}
                  </p>
                  <ul className="mt-5 space-y-3">
                    {Object.entries(product.specs)
                      .slice(0, 4)
                      .map(([k, v]) => (
                        <li key={k} className="flex items-center gap-2 text-sm">
                          <Check size={16} className="text-emerald-500" />
                          <strong>{k}:</strong> {v}
                        </li>
                      ))}
                  </ul>
                </div>
                <div className="rounded-2xl bg-slate-950 p-7 text-white">
                  <Gift className="text-cyan-400" />
                  <h3 className="mt-3 text-xl font-bold">Make it gift-ready</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Add premium wrapping and a personal note during checkout.
                  </p>
                </div>
              </div>
            )}
            {tab === "Specifications" && (
              <div className="grid gap-x-10 md:grid-cols-2">
                {Object.entries(product.specs).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between border-b py-4 text-sm"
                  >
                    <span className="text-slate-500">{k}</span>
                    <strong>{v}</strong>
                  </div>
                ))}
              </div>
            )}
            {tab === "Warranty" && (
              <p className="max-w-3xl leading-7 text-slate-600">
                Warranty service is provided by the manufacturer or its
                authorized distributor. Keep your Voltixa invoice and original
                packaging. Physical damage, liquid ingress and unauthorized
                repair are not covered unless explicitly stated.
              </p>
            )}
            {tab === "Reviews" && (
              <div id="reviews">
                <h2 className="text-2xl font-extrabold">
                  {product.rating} out of 5
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Based on {product.reviews} approved demo reviews. Verified
                  status requires a delivered order item.
                </p>
              </div>
            )}
            {tab === "Questions" && (
              <p className="text-slate-600">
                Have a product question? Sign in to ask the Voltixa community
                and our product team.
              </p>
            )}
          </div>
        </section>
        <section className="mt-14">
          <h2 className="mb-5 text-2xl font-extrabold">You may also like</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products
              .filter((p) => p.id !== product.id)
              .slice(0, 4)
              .map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
          </div>
        </section>
      </div>
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t bg-white p-3 shadow-xl md:hidden">
        <div className="container-shell flex items-center gap-3">
          <div className="flex-1">
            <small className="block text-slate-500">From</small>
            <strong>{formatPrice(variant.price)}</strong>
          </div>
          <button
            onClick={add}
            className="flex h-12 flex-[1.6] items-center justify-center gap-2 rounded-xl bg-blue-600 font-bold text-white"
          >
            <Zap size={17} /> Add to cart
          </button>
        </div>
      </div>
    </StoreLayout>
  );
}
