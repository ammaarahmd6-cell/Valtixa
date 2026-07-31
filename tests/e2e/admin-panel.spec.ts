import { expect, test, type Page } from "@playwright/test";

const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;
const printOrderNumber = process.env.E2E_PRINT_ORDER;

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(email!);
  await page.locator('input[name="password"]').fill(password!);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(/\/account/);
}

test.beforeEach(async ({ page }) => {
  test.skip(!email || !password, "Admin credentials are not configured");
  await signIn(page);
});

test("all admin modules load live data without runtime errors", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium",
    "Full module matrix runs once on desktop",
  );
  test.setTimeout(180_000);
  const modules = [
    ["/admin", "Store pulse"],
    ["/admin/products", "Products"],
    ["/admin/categories", "Categories"],
    ["/admin/brands", "Brands"],
    ["/admin/inventory", "Inventory"],
    ["/admin/orders", "Orders"],
    ["/admin/customers", "Customers"],
    ["/admin/reviews", "Review moderation"],
    ["/admin/complaints", "Complaints & support"],
    ["/admin/warranties", "Warranties & claims"],
    ["/admin/coupons", "Coupons"],
    ["/admin/promotions", "Promotions & collections"],
    ["/admin/homepage", "Homepage content"],
    ["/admin/banners", "Banners"],
    ["/admin/payments", "Payments"],
    ["/admin/shipments", "Shipments"],
    ["/admin/blog", "Blog"],
    ["/admin/faqs", "FAQs"],
    ["/admin/notifications", "Notifications"],
    ["/admin/reports", "Reports"],
    ["/admin/staff", "Staff & roles"],
    ["/admin/settings", "Site settings"],
    ["/admin/audit-logs", "Audit logs"],
  ] as const;

  for (const [path, heading] of modules) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Something interrupted the flow" }),
    ).toHaveCount(0);
  }
});

test("inventory adjustment saves to Supabase and can be reversed", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium",
    "Mutation test runs once on desktop",
  );
  test.setTimeout(90_000);
  await page.goto("/admin/inventory");
  const row = page.locator("tbody tr").first();
  await expect(row).toBeVisible();
  const startingAvailable = Number(await row.locator("td").nth(3).innerText());

  await row.getByRole("button", { name: "Adjust" }).click();
  await page.getByLabel("Quantity change").fill("1");
  await page.getByLabel("Reason").fill("Automated admin flow verification");
  page.once("dialog", (dialog) => dialog.accept());
  const addResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/admin") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Apply adjustment" }).click();
  const addResponse = await addResponsePromise;
  expect(addResponse.status(), await addResponse.text()).toBe(200);
  await page.reload();
  await expect
    .poll(
      async () =>
        Number(
          await page
            .locator("tbody tr")
            .first()
            .locator("td")
            .nth(3)
            .innerText(),
        ),
      { timeout: 30_000 },
    )
    .toBe(startingAvailable + 1);

  await page
    .locator("tbody tr")
    .first()
    .getByRole("button", { name: "Adjust" })
    .click();
  await page.getByLabel("Quantity change").fill("-1");
  await page
    .getByLabel("Reason")
    .fill("Reverse automated admin flow verification");
  page.once("dialog", (dialog) => dialog.accept());
  const reverseResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/admin") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Apply adjustment" }).click();
  const reverseResponse = await reverseResponsePromise;
  expect(reverseResponse.status(), await reverseResponse.text()).toBe(200);
  await page.reload();
  await expect
    .poll(
      async () =>
        Number(
          await page
            .locator("tbody tr")
            .first()
            .locator("td")
            .nth(3)
            .innerText(),
        ),
      { timeout: 30_000 },
    )
    .toBe(startingAvailable);
});

test("mobile admin navigation opens and reaches products", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile-only shell check");
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Store pulse" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(
    page.getByRole("link", { name: "Products", exact: true }),
  ).toBeVisible();
  await Promise.all([
    page.waitForURL(/\/admin\/products/, { timeout: 30_000 }),
    page.getByRole("link", { name: "Products", exact: true }).click(),
  ]);
  await expect(
    page.getByRole("heading", { name: "Products", exact: true }),
  ).toBeVisible({ timeout: 15_000 });
});

test("account and admin pages do not overflow on a 320px phone", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium",
    "Narrow authenticated layout runs once",
  );
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 320, height: 800 });
  for (const route of [
    "/account",
    "/account/profile",
    "/account/addresses",
    "/admin",
    "/admin/products",
    "/admin/categories",
    "/admin/orders",
  ]) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    const dimensions = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(
      dimensions.scroll,
      `${route} overflowed at 320px`,
    ).toBeLessThanOrEqual(dimensions.client + 1);
  }
});

test("assigned staff sees Admin Panel in account profile", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium",
    "Profile role check runs once on desktop",
  );
  await page.goto("/account");
  await expect(
    page.getByRole("link", { name: "Admin Panel", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Open Admin Panel/ }),
  ).toBeVisible();
});

test("account profile loads and saves Supabase details", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium",
    "Profile save check runs once on desktop",
  );
  test.setTimeout(90_000);
  await page.goto("/account/profile");
  await expect(
    page.getByRole("heading", { name: "My profile", exact: true }),
  ).toBeVisible();
  const fullName = page.getByLabel("Full name");
  const originalName = await fullName.inputValue();
  expect(originalName.length).toBeGreaterThan(1);
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Profile updated successfully.")).toBeVisible({
    timeout: 30_000,
  });
  await page.reload();
  await expect(page.getByLabel("Full name")).toHaveValue(originalName);
  await expect(
    page.getByRole("link", { name: "Profile", exact: true }),
  ).toBeVisible();
});

test("every admin module exports an Excel workbook", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium",
    "Excel export matrix runs once on desktop",
  );
  test.setTimeout(180_000);
  const sections = [
    "overview",
    "products",
    "categories",
    "brands",
    "inventory",
    "orders",
    "customers",
    "reviews",
    "complaints",
    "warranties",
    "coupons",
    "promotions",
    "homepage",
    "banners",
    "payments",
    "shipments",
    "blog",
    "faqs",
    "notifications",
    "reports",
    "staff",
    "settings",
    "audit-logs",
  ];

  for (const section of sections) {
    const response = await page.request.get(`/api/admin?export=${section}`);
    expect(response.status(), `${section}: ${await response.text()}`).toBe(200);
    expect(response.headers()["content-type"]).toContain(
      "application/vnd.ms-excel",
    );
    expect(response.headers()["content-disposition"]).toContain(
      `voltixa-${section}-`,
    );
    expect(response.headers()["content-disposition"]).toContain(".xls");
    const workbook = await response.text();
    expect(workbook).toContain("<Workbook");
    expect(workbook).toContain("<Worksheet");
  }
});

test("admin order detail has a printable invoice layout", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium",
    "Print check runs once on desktop",
  );
  test.skip(
    !printOrderNumber,
    "A temporary print verification order is not configured",
  );
  await page.goto("/admin/orders");
  const orderRow = page
    .locator("tbody tr")
    .filter({ hasText: printOrderNumber! });
  await expect(orderRow).toBeVisible();
  await orderRow.getByRole("link", { name: "View" }).click();
  await expect(page.locator("[data-print-order]")).toContainText(
    printOrderNumber!,
  );
  await expect(
    page.getByRole("heading", { name: "Order items" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Delivery address" }),
  ).toBeVisible();
  await page.evaluate(() => {
    window.print = () => {
      document.body.dataset.printCalled = "true";
    };
  });
  await page.getByRole("button", { name: "Print order" }).click();
  await expect(page.locator("body")).toHaveAttribute(
    "data-print-called",
    "true",
  );
});

test("product form filters brands after category selection", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium",
    "Dependent dropdown check runs once on desktop",
  );
  test.setTimeout(90_000);
  await page.goto("/admin/products/new");
  const category = page.locator('select[name="categoryId"]');
  const brand = page.locator('select[name="brandId"]');
  await expect(brand).toBeDisabled();
  await category.selectOption({ label: "Mobile Phones" });
  await expect(brand).toBeEnabled();
  await expect(brand.locator("option", { hasText: "Apple" })).toHaveCount(1);
  await expect(brand.locator("option", { hasText: "Samsung" })).toHaveCount(1);
  await expect(brand.locator("option", { hasText: "Dell" })).toHaveCount(0);
  await page.goto("/admin/brands");
  await page.getByRole("button", { name: "Add brand" }).click();
  const brandCategory = page.locator('select[name="categoryId"]');
  await expect(brandCategory).toBeVisible();
  await expect(brandCategory).toHaveAttribute("required", "");
  await expect(
    brandCategory.locator("option", { hasText: "Mobile Phones" }),
  ).toHaveCount(1);
});

test("product list combines catalog filters and price sorting", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium",
    "Product filter matrix runs once on desktop",
  );
  test.setTimeout(90_000);
  await page.goto("/admin/products");

  const rows = page.locator("tbody tr");
  const initialCount = await rows.count();
  expect(initialCount).toBeGreaterThanOrEqual(70);
  await page.getByLabel("Filter by status").selectOption("published");
  await expect(rows).toHaveCount(70);
  await page
    .getByLabel("Filter by category")
    .selectOption({ label: "Mobile Phones" });
  await expect(rows).toHaveCount(10);
  await expect(
    page.getByText(`Showing 10 of ${initialCount} products`),
  ).toBeVisible();

  const brand = page.getByLabel("Filter by brand");
  await expect(brand.locator("option", { hasText: "Apple" })).toHaveCount(1);
  await expect(brand.locator("option", { hasText: "Samsung" })).toHaveCount(1);
  await expect(brand.locator("option", { hasText: "Dell" })).toHaveCount(0);
  await brand.selectOption({ label: "Apple" });
  await expect(rows).toHaveCount(1);
  await expect(rows.first().locator("td").nth(1)).toContainText(
    "Apple · Mobile Phones",
  );

  const productName = (await rows.first().locator("strong").innerText()).trim();
  await page.getByLabel("Filter by product name or SKU").fill(productName);
  await expect(rows).toHaveCount(1);
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(rows).toHaveCount(initialCount);

  await page.getByLabel("Sort products").selectOption("price_desc");
  const prices = await rows.locator("td:nth-child(3)").allInnerTexts();
  const numericPrices = prices.map((price) =>
    Number(price.replace(/[^\d.]/g, "")),
  );
  expect(numericPrices).toEqual(
    [...numericPrices].sort((left, right) => right - left),
  );

  const cutoff = numericPrices[Math.floor(numericPrices.length / 2)];
  await page.getByLabel("Minimum price").fill(String(cutoff));
  const filteredPrices = (
    await rows.locator("td:nth-child(3)").allInnerTexts()
  ).map((price) => Number(price.replace(/[^\d.]/g, "")));
  expect(filteredPrices.length).toBeGreaterThan(0);
  expect(filteredPrices.every((price) => price >= cutoff)).toBe(true);

  await page.getByLabel("Filter by status").selectOption("published");
  await page.getByLabel("Filter by stock").selectOption("in_stock");
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(rows).toHaveCount(initialCount);
  await expect(page.getByLabel("Sort products")).toHaveValue("newest");
});

test("category and brand directories support combined filters", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium",
    "Directory filter matrix runs once on desktop",
  );
  test.setTimeout(90_000);

  await page.goto("/admin/categories");
  const categoryCards = page.getByTestId("category-list").locator("section");
  const categoryCount = await categoryCards.count();
  expect(categoryCount).toBeGreaterThan(0);
  await page
    .getByLabel("Filter categories by name or slug")
    .fill("Mobile Phones");
  await expect(categoryCards).toHaveCount(1);
  await expect(
    categoryCards.getByRole("heading", { name: "Mobile Phones", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Filter categories by visibility")
    .selectOption("visible");
  await expect(categoryCards).toHaveCount(1);
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(categoryCards).toHaveCount(categoryCount);

  await page.getByLabel("Sort categories").selectOption("name_desc");
  const categoryNames = await categoryCards.locator("h2").allInnerTexts();
  expect(categoryNames).toEqual(
    [...categoryNames].sort((left, right) => right.localeCompare(left)),
  );

  await page.goto("/admin/brands");
  const brandCards = page.getByTestId("brand-list").locator("section");
  const brandCount = await brandCards.count();
  expect(brandCount).toBeGreaterThan(0);
  await page
    .getByLabel("Filter brands by category")
    .selectOption({ label: "Mobile Phones" });
  const mobileBrandCount = await brandCards.count();
  expect(mobileBrandCount).toBeGreaterThan(0);
  expect(mobileBrandCount).toBeLessThan(brandCount);
  const categoryLabels = await brandCards
    .locator("p.text-blue-600")
    .allInnerTexts();
  expect(categoryLabels.every((label) => label.includes("Mobile Phones"))).toBe(
    true,
  );

  await page.getByLabel("Filter brands by name or slug").fill("Apple");
  await expect(brandCards).toHaveCount(1);
  await expect(
    brandCards.getByRole("heading", { name: "Apple", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Filter brands by visibility").selectOption("visible");
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(brandCards).toHaveCount(brandCount);
});

test("admin can create and permanently delete an empty category", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium",
    "Delete workflow runs once on desktop",
  );
  test.setTimeout(90_000);
  const name = `Delete Verification ${Date.now()}`;
  await page.goto("/admin/categories");
  await page.getByRole("button", { name: "Add category" }).click();
  await page.getByLabel("Name", { exact: true }).fill(name);
  const createResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/admin") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Save category" }).click();
  expect((await createResponsePromise).status()).toBe(200);
  await page.reload();
  const card = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name, exact: true }) });
  await expect(card).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  const deleteResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/admin") &&
      response.request().method() === "POST",
  );
  await card.getByRole("button", { name: "Delete" }).click();
  expect((await deleteResponsePromise).status()).toBe(200);
  await page.reload();
  await expect(page.getByRole("heading", { name, exact: true })).toHaveCount(0);
});

test("admin can duplicate then permanently delete a product", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium",
    "Product delete workflow runs once on desktop",
  );
  test.setTimeout(120_000);
  await page.goto("/admin/products");
  const firstRow = page.locator("tbody tr").first();
  const originalName = (
    await firstRow.locator("td").first().locator("strong").innerText()
  ).trim();
  const duplicateResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/admin") &&
      response.request().method() === "POST",
  );
  await firstRow.getByRole("button", { name: "Duplicate" }).click();
  expect((await duplicateResponsePromise).status()).toBe(200);
  await page.reload();
  const copyRow = page
    .locator("tbody tr")
    .filter({ hasText: `${originalName} Copy` })
    .first();
  await expect(copyRow).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  const deleteResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/admin") &&
      response.request().method() === "POST",
  );
  await copyRow.getByRole("button", { name: "Delete" }).click();
  expect((await deleteResponsePromise).status()).toBe(200);
  await page.reload();
  await expect(
    page.locator("tbody tr").filter({ hasText: `${originalName} Copy` }),
  ).toHaveCount(0);
});
