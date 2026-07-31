import { expect, test, type Page } from "@playwright/test";

const customerEmail = process.env.E2E_CUSTOMER_EMAIL;
const customerPassword = process.env.E2E_CUSTOMER_PASSWORD;
const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(/\/account|\/checkout/);
}

test("real checkout persists one idempotent Supabase order", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium",
    "Live checkout runs once in desktop Chrome",
  );
  test.skip(
    !customerEmail || !customerPassword || !adminEmail || !adminPassword,
    "Checkout verification accounts are not configured",
  );
  test.setTimeout(180_000);

  await signIn(page, customerEmail!, customerPassword!);
  await page.goto("/product/apple-iphone-17-pro");
  await page.getByRole("button", { name: "Add to cart" }).first().click();
  const cart = page.getByRole("dialog", { name: "Shopping cart" });
  await expect(cart).toBeVisible();
  await cart.getByRole("link", { name: "Secure checkout" }).click();
  await expect(
    page.getByRole("heading", { name: "Delivery details" }),
  ).toBeVisible();

  await page.getByLabel("Full name").fill("Checkout Verification Customer");
  await page.getByLabel("Mobile number").fill("03001234567");
  await page.getByLabel("Email").fill(customerEmail!);
  await page.getByLabel("Province").selectOption("Punjab");
  await page.getByLabel("City").fill("Lahore");
  await page.getByLabel("Area").fill("Gulberg III");
  await page
    .getByLabel("Complete address")
    .fill("House 12, Street 4, Checkout Verification");
  await page.getByLabel("Postal code (optional)").fill("54000");

  const checkoutResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/checkout") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Place COD order" }).click();
  const checkoutResponse = await checkoutResponsePromise;
  expect(checkoutResponse.status(), await checkoutResponse.text()).toBe(201);
  const requestPayload = checkoutResponse.request().postDataJSON();
  const result = (await checkoutResponse.json()) as {
    orderNumber: string;
    total: number;
    mode: string;
    duplicate: boolean;
  };
  expect(result.orderNumber).toMatch(/^VLX-\d{4}-\d{8}$/);
  expect(result.total).toBe(389999);
  expect(result.mode).toBe("live");
  expect(result.duplicate).toBe(false);

  await expect(page).toHaveURL(
    new RegExp(`/checkout/success\\?order=${result.orderNumber}`),
  );
  await expect(
    page.getByText(result.orderNumber, { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Rs 389,999", { exact: true })).toBeVisible();

  await page.goto(`/track-order?order=${result.orderNumber}`);
  await page.getByLabel("Phone or email").fill(customerEmail!);
  await page.getByRole("button", { name: "Track securely" }).click();
  await expect(
    page.getByText(result.orderNumber, { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("cod · pending")).toBeVisible();

  const duplicate = await page.request.post("/api/checkout", {
    data: requestPayload,
  });
  expect(duplicate.status(), await duplicate.text()).toBe(200);
  const duplicateResult = (await duplicate.json()) as {
    orderNumber: string;
    duplicate: boolean;
  };
  expect(duplicateResult.orderNumber).toBe(result.orderNumber);
  expect(duplicateResult.duplicate).toBe(true);

  await page.goto("/account/orders");
  await expect(
    page.getByText(result.orderNumber, { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Apple iPhone 17 Pro", { exact: true }),
  ).toBeVisible();
  await page.goto("/account/notifications");
  await expect(
    page.getByText(`Order ${result.orderNumber} received`, { exact: true }),
  ).toBeVisible();

  await page.goto("/account");
  await page.getByRole("button", { name: "Sign out" }).click();
  await signIn(page, adminEmail!, adminPassword!);
  await page.goto("/admin/orders");
  const adminRow = page
    .locator("tbody tr")
    .filter({ hasText: result.orderNumber });
  await expect(adminRow).toBeVisible();
  await expect(adminRow).toContainText("customer@voltixa.pk");
  await page.goto("/admin/payments");
  const paymentRow = page
    .locator("tbody tr")
    .filter({ hasText: result.orderNumber });
  await expect(paymentRow).toBeVisible();
  await expect(paymentRow).toContainText("cod");
  await expect(paymentRow).toContainText("Rs 389,999");
  page.once("dialog", (dialog) => dialog.accept());
  const paymentUpdatePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/admin") &&
      response.request().method() === "POST",
  );
  await paymentRow.locator("select").selectOption("paid");
  const paymentUpdate = await paymentUpdatePromise;
  expect(paymentUpdate.status(), await paymentUpdate.text()).toBe(200);

  await page.goto("/account");
  await page.getByRole("button", { name: "Sign out" }).click();
  await signIn(page, customerEmail!, customerPassword!);
  await page.goto("/account/orders");
  const customerOrder = page
    .locator("section")
    .filter({ hasText: result.orderNumber });
  await expect(customerOrder).toContainText("Payment paid");
  await page.goto("/account/notifications");
  await expect(
    page.getByText(`Payment update for ${result.orderNumber}`, {
      exact: true,
    }),
  ).toBeVisible();
  console.log(`CHECKOUT_ORDER=${result.orderNumber}`);
});
