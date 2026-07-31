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
  await page.waitForURL(/\/account/);
}

test("public forms and customer support persist into Supabase and admin", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Persistence flow runs once");
  test.skip(
    !customerEmail || !customerPassword || !adminEmail || !adminPassword,
    "Verification accounts are not configured",
  );
  test.setTimeout(180_000);
  const marker = `Connected Flow ${Date.now()}`;

  await page.goto("/contact");
  await page.locator('input[name="name"]').fill("Connected Flow Customer");
  await page
    .getByRole("textbox", { name: "Email", exact: true })
    .fill(customerEmail!);
  await page.locator('input[name="phone"]').fill("03001234567");
  await page.locator('input[name="subject"]').fill(marker);
  await page
    .locator('textarea[name="message"]')
    .fill(
      "This is an automated persistence check for the connected support form.",
    );
  const contactResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/contact") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Send message" }).click();
  const contactResponse = await contactResponsePromise;
  expect(contactResponse.status(), await contactResponse.text()).toBe(201);
  await expect(
    page.getByText("Your message has been sent to support."),
  ).toBeVisible({ timeout: 30_000 });

  const newsletterEmail = `flow-${Date.now()}@example.com`;
  const newsletter = await page.request.post("/api/newsletter", {
    data: { email: newsletterEmail },
  });
  expect(newsletter.status(), await newsletter.text()).toBe(200);

  await signIn(page, customerEmail!, customerPassword!);
  await page.goto("/account/complaints");
  await page.getByLabel("Subject").fill(marker);
  await page
    .getByLabel("Tell us what happened")
    .fill("This is an automated account support ticket persistence check.");
  await page.getByRole("button", { name: "Submit ticket" }).click();
  await expect(
    page.getByText("Support ticket submitted successfully."),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByText(marker, { exact: true })).toBeVisible({
    timeout: 30_000,
  });

  await page.getByRole("button", { name: "Sign out" }).click();
  await signIn(page, adminEmail!, adminPassword!);
  await page.goto("/admin/complaints");
  await expect(page.getByText(marker, { exact: true })).toHaveCount(2);
  console.log(`CONNECTED_FLOW_MARKER=${marker}`);
  console.log(`CONNECTED_FLOW_NEWSLETTER=${newsletterEmail}`);
});
