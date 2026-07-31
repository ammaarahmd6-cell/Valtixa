import { expect, test, type Page } from "@playwright/test";

const email = process.env.E2E_CUSTOMER_EMAIL;
const password = process.env.E2E_CUSTOMER_PASSWORD;
const addressLabel = process.env.E2E_ADDRESS_LABEL;

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email!);
  await page.locator('input[name="password"]').fill(password!);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(/\/account/);
}

test("customer can create, edit, default, and delete a Supabase address", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium",
    "Address mutation test runs once on desktop",
  );
  test.skip(
    !email || !password || !addressLabel,
    "Customer address verification is not configured",
  );
  test.setTimeout(120_000);
  await signIn(page);
  await page.goto("/account/addresses");
  await expect(
    page.getByRole("heading", { name: "Saved addresses" }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: /Add address|Add an address/ })
    .first()
    .click();
  await page.getByLabel("Address label").fill(addressLabel!);
  await page.getByLabel("Recipient name").fill("Address Verification Customer");
  await page.getByLabel("Phone number").fill("03001234567");
  await page.getByLabel("Province").selectOption("Punjab");
  await page.getByLabel("City").fill("Lahore");
  await page.getByLabel("Area / locality").fill("DHA Phase 5");
  await page.getByLabel("Complete address").fill("House 12, Street 4, Block C");
  await page.getByLabel("Landmark").fill("Near community park");
  await page.getByLabel("Postal code").fill("54000");
  await page.getByRole("button", { name: "Save address" }).click();
  await expect(page.getByText("Address added successfully.")).toBeVisible({
    timeout: 30_000,
  });

  let card = page.locator("section").filter({
    has: page.getByRole("heading", { name: addressLabel!, exact: true }),
  });
  await expect(card).toContainText("DHA Phase 5");
  await page.reload();
  card = page.locator("section").filter({
    has: page.getByRole("heading", { name: addressLabel!, exact: true }),
  });
  await expect(card).toBeVisible();

  await card.getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("Area / locality").fill("Gulberg III");
  await page.getByRole("button", { name: "Update address" }).click();
  await expect(page.getByText("Address updated successfully.")).toBeVisible({
    timeout: 30_000,
  });
  card = page.locator("section").filter({
    has: page.getByRole("heading", { name: addressLabel!, exact: true }),
  });
  await expect(card).toContainText("Gulberg III");

  const makeDefault = card.getByRole("button", { name: "Make default" });
  if (await makeDefault.isVisible()) {
    await makeDefault.click();
    await expect(page.getByText("Default address updated.")).toBeVisible({
      timeout: 30_000,
    });
  }
  await expect(card).toContainText("Default address");

  page.once("dialog", (dialog) => dialog.accept());
  await card.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Address deleted.")).toBeVisible({
    timeout: 30_000,
  });
  await expect(
    page.getByRole("heading", { name: addressLabel!, exact: true }),
  ).toHaveCount(0);
});
