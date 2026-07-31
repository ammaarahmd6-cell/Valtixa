"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "./data";

export type CartLine = {
  product: Product;
  variantId: string;
  quantity: number;
};
type Store = {
  cart: CartLine[];
  wishlist: string[];
  compare: string[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addCart: (product: Product, variantId?: string) => void;
  updateQty: (variantId: string, quantity: number) => void;
  removeCart: (variantId: string) => void;
  toggleWishlist: (id: string) => void;
  toggleCompare: (id: string) => void;
  clearCart: () => void;
};
export const useShop = create<Store>()(
  persist(
    (set) => ({
      cart: [],
      wishlist: [],
      compare: [],
      cartOpen: false,
      setCartOpen: (cartOpen) => set({ cartOpen }),
      addCart: (product, variantId = product.variants[0].id) =>
        set((s) => {
          const found = s.cart.find((x) => x.variantId === variantId);
          return {
            cart: found
              ? s.cart.map((x) =>
                  x.variantId === variantId
                    ? {
                        ...x,
                        quantity: Math.min(x.quantity + 1, product.stock),
                      }
                    : x,
                )
              : [...s.cart, { product, variantId, quantity: 1 }],
            cartOpen: true,
          };
        }),
      updateQty: (variantId, quantity) =>
        set((s) => ({
          cart: s.cart.map((x) =>
            x.variantId === variantId
              ? {
                  ...x,
                  quantity: Math.max(1, Math.min(quantity, x.product.stock)),
                }
              : x,
          ),
        })),
      removeCart: (variantId) =>
        set((s) => ({ cart: s.cart.filter((x) => x.variantId !== variantId) })),
      toggleWishlist: (id) =>
        set((s) => ({
          wishlist: s.wishlist.includes(id)
            ? s.wishlist.filter((x) => x !== id)
            : [...s.wishlist, id],
        })),
      toggleCompare: (id) =>
        set((s) => ({
          compare: s.compare.includes(id)
            ? s.compare.filter((x) => x !== id)
            : s.compare.length < 4
              ? [...s.compare, id]
              : s.compare,
        })),
      clearCart: () => set({ cart: [] }),
    }),
    {
      name: "voltixa-shop-pk-v2",
      partialize: (s) => ({
        cart: s.cart,
        wishlist: s.wishlist,
        compare: s.compare,
      }),
    },
  ),
);
