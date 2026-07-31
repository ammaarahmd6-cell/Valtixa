import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const formatPrice = (value: number) =>
  `Rs. ${new Intl.NumberFormat("en-PK").format(value)}`;
export const discountPercent = (price: number, retail: number) =>
  Math.round(((retail - price) / retail) * 100);
export const orderTotal = (subtotal: number, discount = 0, shipping = 0) =>
  Math.max(0, subtotal - discount + shipping);
export const safeRedirect = (value: string | null, fallback = "/account") =>
  value?.startsWith("/") && !value.startsWith("//") ? value : fallback;
