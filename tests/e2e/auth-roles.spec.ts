import { expect, test } from "@playwright/test";

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;
const customerEmail = process.env.E2E_CUSTOMER_EMAIL;
const customerPassword = process.env.E2E_CUSTOMER_PASSWORD;

async function signIn(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(/\/account/);
}

test("customer reaches account but cannot enter admin", async ({ page }) => {
  test.skip(
    !customerEmail || !customerPassword,
    "Customer credentials are not configured",
  );
  await signIn(page, customerEmail!, customerPassword!);
  await expect(page).toHaveURL(/\/account/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/account\?notice=admin-required/);
});

test("super admin reaches the protected admin dashboard", async ({ page }) => {
  test.skip(
    !adminEmail || !adminPassword,
    "Admin credentials are not configured",
  );
  await signIn(page, adminEmail!, adminPassword!);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin/);
  await expect(
    page.getByRole("heading", { name: "Store pulse" }),
  ).toBeVisible();
  await expect(page.getByText("super admin")).toBeVisible();
});
