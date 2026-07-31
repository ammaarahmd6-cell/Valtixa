import { expect, test } from "@playwright/test";
test("browse category, filter and open product", async ({ page }) => {
  await page.goto("/category/mobile-phones");
  await expect(
    page.getByRole("heading", { name: "Mobile Phones" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: /View Apple iPhone 17 Pro/ })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Apple iPhone 17 Pro" }),
  ).toBeVisible();
});
test("add variant to cart and update quantity", async ({ page }) => {
  await page.goto("/product/apple-iphone-17-pro");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Add to cart" }).first().click();
  await expect(
    page.getByRole("dialog", { name: "Shopping cart" }),
  ).toBeVisible();
  const cart = page.getByRole("dialog", { name: "Shopping cart" });
  await cart.getByRole("button", { name: "Increase quantity" }).click();
  await expect(cart.getByText("2", { exact: true })).toBeVisible();
});
test("wishlist and comparison persist", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page
    .getByRole("button", { name: /Add to wishlist/ })
    .first()
    .click();
  await page
    .getByRole("button", { name: /Add to comparison/ })
    .first()
    .click();
  await page.goto("/compare");
  await expect(
    page.getByRole("strong").filter({ hasText: "Redmi Note 15 Pro+ 5G" }),
  ).toBeVisible();
});
test("admin route requires authentication", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);
});
