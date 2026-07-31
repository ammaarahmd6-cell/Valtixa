"use client";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useShop } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import { ProductArt } from "./product-art";

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, updateQty, removeCart } = useShop();
  const subtotal = cart.reduce((s, x) => s + x.product.price * x.quantity, 0),
    progress = Math.min(100, (subtotal / 5000) * 100);
  if (!cartOpen) return null;
  return (
    <div className="fixed inset-0 z-[70]">
      <button
        aria-label="Close cart"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
        onClick={() => setCartOpen(false)}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className="absolute right-0 top-0 flex h-[100dvh] w-full max-w-md flex-col bg-white shadow-2xl"
      >
        <div className="flex h-20 items-center justify-between border-b px-5">
          <div>
            <h2 className="text-lg font-extrabold">Your cart</h2>
            <p className="text-xs text-slate-500">{cart.length} unique items</p>
          </div>
          <button
            onClick={() => setCartOpen(false)}
            aria-label="Close cart"
            className="grid size-10 place-items-center rounded-full bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>
        {cart.length === 0 ? (
          <div className="grid flex-1 place-items-center p-8 text-center">
            <div>
              <span className="mx-auto grid size-20 place-items-center rounded-full bg-blue-50 text-blue-600">
                <ShoppingBag size={34} />
              </span>
              <h3 className="mt-5 text-xl font-bold">
                Your cart is ready for something great
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Explore new tech and add your favourites here.
              </p>
              <button
                onClick={() => setCartOpen(false)}
                className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white"
              >
                Continue shopping
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="border-b bg-blue-50 px-5 py-3">
              <div className="flex justify-between text-xs font-semibold">
                <span>
                  {subtotal >= 5000
                    ? "You unlocked free delivery"
                    : "Add more for free delivery"}
                </span>
                <span>
                  {subtotal >= 5000 ? "Unlocked" : formatPrice(5000 - subtotal)}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-blue-100">
                <div
                  style={{ width: `${progress}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500"
                />
              </div>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {cart.map((x) => (
                <div key={x.variantId} className="flex gap-3">
                  <ProductArt
                    kind={x.product.image}
                    color={x.product.color}
                    alt={x.product.name}
                    className="size-20 shrink-0 rounded-xl"
                  />
                  <div className="min-w-0 flex-1">
                    <strong className="line-clamp-2 text-sm">
                      {x.product.name}
                    </strong>
                    <p className="mt-1 text-xs text-slate-500">
                      {
                        x.product.variants.find((v) => v.id === x.variantId)
                          ?.label
                      }
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center rounded-lg border">
                        <button
                          aria-label="Decrease quantity"
                          onClick={() => updateQty(x.variantId, x.quantity - 1)}
                          className="grid size-8 place-items-center"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-7 text-center text-xs font-bold">
                          {x.quantity}
                        </span>
                        <button
                          aria-label="Increase quantity"
                          onClick={() => updateQty(x.variantId, x.quantity + 1)}
                          className="grid size-8 place-items-center"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <strong className="text-sm">
                        {formatPrice(x.product.price * x.quantity)}
                      </strong>
                      <button
                        aria-label={`Remove ${x.product.name}`}
                        onClick={() => removeCart(x.variantId)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <strong className="text-lg">{formatPrice(subtotal)}</strong>
              </div>
              <p className="mb-4 text-xs text-slate-500">
                Delivery and discounts are calculated at checkout.
              </p>
              <Link
                onClick={() => setCartOpen(false)}
                href="/checkout"
                className="flex h-12 items-center justify-center rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700"
              >
                Secure checkout
              </Link>
              <Link
                onClick={() => setCartOpen(false)}
                href="/cart"
                className="mt-2 flex h-11 items-center justify-center text-sm font-bold text-slate-700"
              >
                View full cart
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
