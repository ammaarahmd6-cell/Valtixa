import { describe, expect, it } from "vitest";
import {
  discountPercent,
  formatPrice,
  orderTotal,
  safeRedirect,
} from "./utils";
import { checkoutSchema } from "./validation";
describe("commerce calculations", () => {
  it("formats Pakistani Rupees", () =>
    expect(formatPrice(124999)).toBe("Rs. 124,999"));
  it("calculates discount percentage", () =>
    expect(discountPercent(800, 1000)).toBe(20));
  it("never produces a negative total", () =>
    expect(orderTotal(500, 800, 100)).toBe(0));
  it("adds shipping after discount", () =>
    expect(orderTotal(1000, 100, 250)).toBe(1150));
});
describe("security validation", () => {
  it("rejects open redirects", () =>
    expect(safeRedirect("//evil.example")).toBe("/account"));
  it("accepts internal redirects", () =>
    expect(safeRedirect("/checkout")).toBe("/checkout"));
  it("rejects an invalid checkout phone", () =>
    expect(
      checkoutSchema.safeParse({
        fullName: "Test User",
        email: "test@example.com",
        phone: "123",
        province: "Sindh",
        city: "Karachi",
        area: "Clifton",
        address: "A complete address here",
        payment: "cod",
        items: [{ variantId: "v1", quantity: 1 }],
        idempotencyKey: crypto.randomUUID(),
      }).success,
    ).toBe(false));
});
