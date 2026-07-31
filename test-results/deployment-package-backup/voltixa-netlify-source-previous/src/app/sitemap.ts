import type { MetadataRoute } from "next";
import { categories, products } from "@/lib/data";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return [
    { url: base, priority: 1, changeFrequency: "daily" },
    ...categories.map((c) => ({
      url: `${base}/category/${c[0]}`,
      priority: 0.8 as const,
    })),
    ...products.map((p) => ({
      url: `${base}/product/${p.slug}`,
      priority: 0.9 as const,
    })),
    ...[
      "deals",
      "new-arrivals",
      "best-sellers",
      "mobile-finder",
      "about",
      "blog",
      "help",
      "faqs",
    ].map((x) => ({ url: `${base}/${x}`, priority: 0.6 as const })),
  ];
}
