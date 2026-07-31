"use client";
import Link from "next/link";
import { BarChart3, Heart, Plus, Star } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/lib/data";
import { discountPercent, formatPrice } from "@/lib/utils";
import { useShop } from "@/lib/store";
import { ProductArt } from "./product-art";

export function ProductCard({ product }: { product: Product }) {
  const { addCart, wishlist, compare, toggleWishlist, toggleCompare } =
    useShop();
  const wished = wishlist.includes(product.id),
    compared = compare.includes(product.id);
  return (
    <article className="group relative flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-2 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-200/60 sm:rounded-2xl sm:p-3">
      <div className="relative">
        <Link
          href={`/product/${product.slug}`}
          aria-label={`View ${product.name}`}
        >
          <ProductArt
            kind={product.image}
            color={product.color}
            alt={product.name}
          />
        </Link>
        <div className="absolute left-1.5 top-1.5 flex flex-col gap-1 sm:left-2 sm:top-2 sm:gap-1.5">
          {product.badge && (
            <span className="w-fit rounded-md bg-slate-950 px-1.5 py-1 text-[9px] font-bold uppercase tracking-wide text-white sm:px-2 sm:text-[10px]">
              {product.badge}
            </span>
          )}
          <span className="w-fit rounded-md bg-red-500 px-1.5 py-1 text-[9px] font-bold text-white sm:px-2 sm:text-[10px]">
            -{discountPercent(product.price, product.retail)}%
          </span>
        </div>
        <div className="absolute right-1.5 top-1.5 flex flex-col gap-1 sm:right-2 sm:top-2 sm:gap-1.5">
          <button
            aria-label={`${wished ? "Remove from" : "Add to"} wishlist`}
            title="Wishlist"
            onClick={() => {
              toggleWishlist(product.id);
              toast.success(
                wished ? "Removed from wishlist" : "Saved to wishlist",
              );
            }}
            className={`grid size-8 place-items-center rounded-full border bg-white shadow-sm transition sm:size-9 ${wished ? "border-red-200 text-red-500" : "border-slate-200 text-slate-500 hover:text-red-500"}`}
          >
            <Heart size={17} fill={wished ? "currentColor" : "none"} />
          </button>
          <button
            aria-label={`${compared ? "Remove from" : "Add to"} comparison`}
            title="Compare"
            onClick={() => {
              toggleCompare(product.id);
              toast.success(
                compared
                  ? "Removed from compare"
                  : compare.length >= 4
                    ? "Comparison is full"
                    : "Added to compare",
              );
            }}
            className={`grid size-8 place-items-center rounded-full border bg-white shadow-sm transition sm:size-9 ${compared ? "border-blue-200 text-blue-600" : "border-slate-200 text-slate-500 hover:text-blue-600"}`}
          >
            <BarChart3 size={17} />
          </button>
        </div>
      </div>
      <div className="flex flex-1 flex-col px-0.5 pb-1 pt-2.5 sm:px-1 sm:pt-3">
        <p className="truncate text-[9px] font-bold uppercase tracking-[.1em] text-blue-600 sm:text-[11px] sm:tracking-[.12em]">
          {product.brand}
        </p>
        <Link
          href={`/product/${product.slug}`}
          className="mt-1 line-clamp-2 min-h-10 text-[13px] font-bold leading-snug text-slate-900 hover:text-blue-600 sm:min-h-11 sm:text-[15px]"
        >
          {product.name}
        </Link>
        <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-500 sm:mt-2 sm:text-xs">
          <Star size={14} fill="#f59e0b" className="text-amber-500" />
          <strong className="text-slate-700">{product.rating}</strong>
          <span>({product.reviews})</span>
        </div>
        <div className="mt-3">
          <p className="text-base font-extrabold tracking-tight text-slate-950 sm:text-lg">
            {formatPrice(product.price)}
          </p>
          <div className="flex min-w-0 items-center gap-1 sm:gap-2">
            <span className="truncate text-[10px] text-slate-400 line-through sm:text-xs">
              {formatPrice(product.retail)}
            </span>
            <span className="hidden text-[11px] font-semibold text-emerald-600 sm:inline">
              Save {formatPrice(product.retail - product.price)}
            </span>
          </div>
        </div>
        <p className="mt-1.5 truncate text-[9px] text-slate-500 sm:mt-2 sm:text-[11px]">
          From {formatPrice(Math.ceil(product.price / 12))}/mo
        </p>
        <button
          onClick={() => {
            addCart(product);
            toast.success(`${product.name} added`);
          }}
          className="mt-2.5 flex h-9 items-center justify-center gap-1 rounded-lg bg-slate-950 px-1 text-xs font-bold text-white transition hover:bg-blue-600 active:scale-[.98] sm:mt-3 sm:h-10 sm:gap-2 sm:rounded-xl sm:text-sm"
        >
          <Plus size={16} /> Add to cart
        </button>
      </div>
    </article>
  );
}
