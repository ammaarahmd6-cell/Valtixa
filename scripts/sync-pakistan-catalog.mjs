import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadLocalEnvironment() {
  const environmentPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(environmentPath)) return;
  for (const line of fs.readFileSync(environmentPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}

function assert(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

loadLocalEnvironment();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey)
  throw new Error(
    "Supabase URL or service-role key is missing from .env.local",
  );

const catalogPath = path.resolve("catalog", "catalog.json");
if (!fs.existsSync(catalogPath)) {
  throw new Error(
    "catalog/catalog.json is missing. Run npm run catalog:generate first.",
  );
}
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
const supabase = createClient(url, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

const categoryRows = catalog.categories.map((category, index) => ({
  name: category.name,
  slug: category.slug,
  image_path: category.image,
  is_visible: true,
  is_featured: true,
  sort_order: index,
  seo_title: `${category.name} in Pakistan | VOLTIXA`,
  seo_description: `Shop authentic ${category.name.toLowerCase()} with transparent prices and official warranty at VOLTIXA.`,
}));
assert(
  await supabase
    .from("categories")
    .upsert(categoryRows, { onConflict: "slug" }),
  "Upsert categories",
);

const categorySlugs = catalog.categories.map((category) => category.slug);
const { data: allCategories } = await supabase
  .from("categories")
  .select("id,slug");
const hiddenCategoryIds = (allCategories ?? [])
  .filter((row) => !categorySlugs.includes(row.slug))
  .map((row) => row.id);
if (hiddenCategoryIds.length) {
  assert(
    await supabase
      .from("categories")
      .update({ is_visible: false, is_featured: false })
      .in("id", hiddenCategoryIds),
    "Hide old categories",
  );
}
const categoryMap = new Map(
  (allCategories ?? []).map((row) => [row.slug, row.id]),
);

const brandRows = catalog.brands.map((name, index) => ({
  name,
  slug: name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-"),
  description: `Authentic ${name} products available through VOLTIXA Pakistan.`,
  is_visible: true,
  is_featured: index < 16,
  sort_order: index,
}));
assert(
  await supabase.from("brands").upsert(brandRows, { onConflict: "slug" }),
  "Upsert brands",
);

const brandSlugs = brandRows.map((brand) => brand.slug);
const { data: allBrands } = await supabase.from("brands").select("id,slug");
const hiddenBrandIds = (allBrands ?? [])
  .filter((row) => !brandSlugs.includes(row.slug))
  .map((row) => row.id);
if (hiddenBrandIds.length) {
  assert(
    await supabase
      .from("brands")
      .update({ is_visible: false, is_featured: false })
      .in("id", hiddenBrandIds),
    "Hide old brands",
  );
}
const brandMap = new Map((allBrands ?? []).map((row) => [row.slug, row.id]));

const mappingValue = Object.fromEntries(
  Object.entries(catalog.categoryBrands).map(([categorySlug, brands]) => [
    categorySlug,
    brands.map((brand) => brand.slug),
  ]),
);
assert(
  await supabase.from("site_settings").upsert({
    key: "category_brand_map",
    value: mappingValue,
    is_public: false,
  }),
  "Save live category-brand mapping",
);

const categoryBrandRows = [];
for (const [categorySlug, brands] of Object.entries(catalog.categoryBrands)) {
  const categoryId = categoryMap.get(categorySlug);
  brands.forEach((brand, index) => {
    const brandId = brandMap.get(brand.slug);
    if (categoryId && brandId)
      categoryBrandRows.push({
        category_id: categoryId,
        brand_id: brandId,
        sort_order: index,
      });
  });
}
const relationCheck = await supabase
  .from("category_brands")
  .select("category_id")
  .limit(1);
if (!relationCheck.error) {
  assert(
    await supabase
      .from("category_brands")
      .delete()
      .not("category_id", "is", null),
    "Clear category-brand relations",
  );
  if (categoryBrandRows.length) {
    assert(
      await supabase.from("category_brands").insert(categoryBrandRows),
      "Insert category-brand relations",
    );
  }
} else {
  console.log(
    "category_brands migration is not live yet; site_settings fallback is active.",
  );
}

const catalogSlugs = catalog.products.map((product) => product.slug);
const { data: oldProducts } = await supabase.from("products").select("id,slug");
const archivedIds = (oldProducts ?? [])
  .filter((product) => !catalogSlugs.includes(product.slug))
  .map((product) => product.id);
if (archivedIds.length) {
  assert(
    await supabase
      .from("products")
      .update({
        status: "archived",
        is_featured: false,
        archived_at: new Date().toISOString(),
      })
      .in("id", archivedIds),
    "Archive old products",
  );
  assert(
    await supabase
      .from("product_variants")
      .update({ is_active: false })
      .in("product_id", archivedIds),
    "Deactivate old variants",
  );
}

for (const [index, product] of catalog.products.entries()) {
  const categoryId = categoryMap.get(product.category);
  const brandSlug = product.brand
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-");
  const brandId = brandMap.get(brandSlug);
  if (!categoryId || !brandId)
    throw new Error(`Missing category or brand relation for ${product.name}`);

  const productResult = await supabase
    .from("products")
    .upsert(
      {
        category_id: categoryId,
        brand_id: brandId,
        name: product.name,
        slug: product.slug,
        short_description: product.description.slice(0, 180),
        description: product.description,
        status: "published",
        is_featured: Boolean(product.badge) || index < 14,
        search_keywords: [
          product.brand,
          product.name,
          product.category,
          "Pakistan",
        ],
        seo_title: `${product.name} Price in Pakistan | VOLTIXA`,
        seo_description: product.description.slice(0, 155),
        published_at: new Date().toISOString(),
        archived_at: null,
      },
      { onConflict: "slug" },
    )
    .select("id")
    .single();
  const productId = assert(productResult, `Upsert ${product.name}`).id;
  await supabase
    .from("product_variants")
    .update({ is_active: false })
    .eq("product_id", productId);

  const variant = product.variants[0];
  const sku =
    `VLX-${String(index + 1).padStart(3, "0")}-${product.slug.slice(0, 18)}`.toUpperCase();
  const variantResult = await supabase
    .from("product_variants")
    .upsert(
      {
        product_id: productId,
        sku,
        name: variant.label,
        attributes: { catalog: "expanded-2026" },
        price: variant.price,
        retail_price: product.retail,
        cost: Math.round(variant.price * 0.82),
        weight_grams: product.category.includes("accessories")
          ? 400
          : product.category === "laptops"
            ? 1500
            : 500,
        is_active: true,
      },
      { onConflict: "sku" },
    )
    .select("id")
    .single();
  const variantId = assert(
    variantResult,
    `Upsert variant for ${product.name}`,
  ).id;
  assert(
    await supabase.from("inventory").upsert({
      variant_id: variantId,
      quantity: variant.stock,
      reserved_quantity: 0,
      low_stock_threshold: 5,
    }),
    `Stock ${product.name}`,
  );
  assert(
    await supabase.from("product_images").delete().eq("product_id", productId),
    `Replace images ${product.name}`,
  );
  assert(
    await supabase.from("product_images").insert({
      product_id: productId,
      variant_id: variantId,
      storage_path: product.image,
      alt_text: `${product.name} product image`,
      sort_order: 0,
      is_primary: true,
    }),
    `Image ${product.name}`,
  );
}

console.log(
  `Synced ${catalog.products.length} published products, ${catalog.categories.length} categories, ${catalog.brands.length} brands and ${categoryBrandRows.length} category-brand relationships.`,
);
