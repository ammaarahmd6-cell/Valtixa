"use client";
import Link from "next/link";
import {
  ArrowRight,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { useShop } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import { ProductArt } from "./product-art";
import { StoreLayout } from "./store-layout";

export function CartPage() {
  const { cart, updateQty, removeCart } = useShop(),
    subtotal = cart.reduce((s, x) => s + x.product.price * x.quantity, 0),
    shipping = subtotal >= 5000 ? 0 : 250;
  return (
    <StoreLayout>
      <div className="container-shell py-6 sm:py-8">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Shopping cart</h1>
        {cart.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed bg-white p-8 text-center sm:p-14">
            <ShoppingBag className="mx-auto text-blue-600" size={42} />
            <h2 className="mt-4 text-xl font-bold">Your cart is empty</h2>
            <p className="mt-2 text-sm text-slate-500">
              Your next favourite device is only a few clicks away.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-blue-600 px-6 font-bold text-white"
            >
              Explore products <ArrowRight size={17} />
            </Link>
          </div>
        ) : (
          <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="space-y-4">
              {cart.map((x) => (
                <article
                  key={x.variantId}
                  className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:gap-4 sm:p-5"
                >
                  <ProductArt
                    kind={x.product.image}
                    color={x.product.color}
                    alt={x.product.name}
                    className="size-20 shrink-0 sm:size-32"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/product/${x.product.slug}`}
                      className="font-bold hover:text-blue-600"
                    >
                      {x.product.name}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">
                      {
                        x.product.variants.find((v) => v.id === x.variantId)
                          ?.label
                      }
                    </p>
                    <p className="mt-3 font-extrabold">
                      {formatPrice(x.product.price)}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center rounded-lg border">
                        <button
                          aria-label="Decrease quantity"
                          onClick={() => updateQty(x.variantId, x.quantity - 1)}
                          className="grid size-9 place-items-center"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-sm font-bold">
                          {x.quantity}
                        </span>
                        <button
                          aria-label="Increase quantity"
                          onClick={() => updateQty(x.variantId, x.quantity + 1)}
                          className="grid size-9 place-items-center"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeCart(x.variantId)}
                        className="flex items-center gap-1 text-xs font-bold text-red-500"
                      >
                        <Trash2 size={15} /> Remove
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 lg:sticky lg:top-28">
              <h2 className="text-lg font-extrabold">Order summary</h2>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal</span>
                  <strong>{formatPrice(subtotal)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Delivery</span>
                  <strong className={shipping ? "" : "text-emerald-600"}>
                    {shipping ? formatPrice(shipping) : "Free"}
                  </strong>
                </div>
              </div>
              <div className="my-5 border-t" />
              <div className="flex justify-between">
                <strong>Total</strong>
                <strong className="text-xl">
                  {formatPrice(subtotal + shipping)}
                </strong>
              </div>
              <label className="mt-5 block text-xs font-bold">
                Have a coupon?
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  placeholder="Enter code"
                  className="h-11 min-w-0 flex-1 rounded-xl border px-3 text-sm"
                />
                <button className="shrink-0 rounded-xl border px-3 text-sm font-bold sm:px-4">
                  Apply
                </button>
              </div>
              <Link
                href="/checkout"
                className="mt-5 flex h-12 items-center justify-center rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700"
              >
                Proceed to checkout
              </Link>
              <p className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                <ShieldCheck size={15} className="text-emerald-500" /> Secure,
                server-validated checkout
              </p>
            </aside>
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
