import { expect, test } from "@playwright/test";

const publicRoutes = [
  "/",
  "/category/laptops",
  "/product/apple-macbook-air-13-m5",
  "/cart",
  "/compare",
  "/login",
  "/mobile-finder",
  "/about",
];

const responsiveViewports = [
  { name: "small-phone", width: 320, height: 800 },
  { name: "phone", width: 393, height: 852 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 900 },
];

for (const viewport of responsiveViewports) {
  test(`public storefront has no horizontal overflow at ${viewport.name}`, async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium",
      "Responsive matrix runs once in desktop Chrome",
    );
    test.setTimeout(180_000);
    await page.setViewportSize(viewport);
    for (const route of publicRoutes) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      const dimensions = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      expect(
        dimensions.scroll,
        `${route} overflowed at ${viewport.width}px`,
      ).toBeLessThanOrEqual(dimensions.client + 1);
    }
    if (viewport.name === "small-phone") {
      await page.goto("/", { waitUntil: "networkidle" });
      await page.screenshot({
        path: testInfo.outputPath("homepage-320.png"),
        fullPage: true,
      });
    }
  });
}

test("homepage has no horizontal overflow and captures visual baseline", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const dimensions = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client + 1);
  await page.screenshot({
    path: testInfo.outputPath("homepage.png"),
    fullPage: true,
  });
});
