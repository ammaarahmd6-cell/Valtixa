import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { can, requireStaff, type StaffRole } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const requestSchema = z.object({
  action: z.string().min(1).max(80),
  id: z.string().uuid().optional(),
  payload: z.record(z.string(), z.unknown()).default({}),
});

const orderStatuses = [
  "pending",
  "confirmed",
  "payment_pending",
  "paid",
  "processing",
  "packed",
  "ready_to_ship",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "return_requested",
  "returned",
  "refund_pending",
  "refunded",
  "failed",
] as const;

const paymentStatuses = [
  "pending",
  "authorized",
  "paid",
  "failed",
  "refunded",
  "partially_refunded",
] as const;
const ticketStatuses = [
  "open",
  "awaiting_customer",
  "in_review",
  "approved",
  "rejected",
  "resolved",
  "closed",
] as const;
const reviewStatuses = ["pending", "approved", "rejected"] as const;
const productStatuses = ["draft", "published", "archived"] as const;

const actionPermission: Record<string, string> = {
  "product.save": "catalog",
  "product.duplicate": "catalog",
  "product.status": "catalog",
  "product.delete": "catalog",
  "category.save": "catalog",
  "category.toggle": "catalog",
  "category.delete": "catalog",
  "brand.save": "catalog",
  "brand.toggle": "catalog",
  "brand.delete": "catalog",
  "inventory.adjust": "inventory",
  "order.status": "orders",
  "order.note": "orders",
  "order.tracking": "shipments",
  "customer.status": "customers",
  "review.status": "reviews",
  "complaint.status": "support",
  "warranty.status": "warranties",
  "coupon.save": "coupons",
  "coupon.toggle": "coupons",
  "collection.save": "promotions",
  "collection.toggle": "promotions",
  "banner.save": "content",
  "banner.toggle": "content",
  "payment.status": "payments",
  "shipment.save": "shipments",
  "blog.save": "content",
  "blog.status": "content",
  "faq.save": "content",
  "faq.toggle": "content",
  "notification.send": "content",
  "settings.save": "content",
};

function text(payload: Record<string, unknown>, key: string, fallback = "") {
  const value = payload[key];
  return typeof value === "string" ? value.trim() : fallback;
}

function number(payload: Record<string, unknown>, key: string, fallback = 0) {
  const value = Number(payload[key]);
  return Number.isFinite(value) ? value : fallback;
}

function flag(payload: Record<string, unknown>, key: string, fallback = false) {
  const value = payload[key];
  return typeof value === "boolean" ? value : fallback;
}

function nullableDate(value: unknown) {
  if (typeof value !== "string" || !value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? null : parsed.toISOString();
}

function slug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return origin === new URL(request.url).origin;
}

async function audit(
  db: ReturnType<typeof createAdminClient>,
  actorId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  oldValues: unknown,
  newValues: unknown,
) {
  const { error } = await db.from("audit_logs").insert({
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    old_values: oldValues,
    new_values: newValues,
  });
  if (error) throw new Error(`Audit log: ${error.message}`);
}

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("This admin request was blocked.", 403);

  const auth = await requireStaff();
  if ("error" in auth)
    return fail(
      auth.error ?? "Access could not be verified.",
      auth.status ?? 500,
    );

  let parsed: z.infer<typeof requestSchema>;
  try {
    const result = requestSchema.safeParse(await request.json());
    if (!result.success) return fail("The submitted admin form is incomplete.");
    parsed = result.data;
  } catch {
    return fail("The submitted admin form could not be read.");
  }

  const { action, id, payload } = parsed;
  if (action === "staff.role") {
    if (auth.role !== "super_admin")
      return fail("Only a super admin can change staff roles.", 403);
  } else {
    const permission = actionPermission[action];
    if (!permission || !can(auth.role, permission))
      return fail("Your role cannot perform this action.", 403);
  }

  const db = createAdminClient();
  const actorId = auth.user.id;

  try {
    let entityType = action.split(".")[0];
    let entityId: string | null = id ?? null;
    let before: unknown = null;
    let after: unknown = null;

    if (action === "product.delete" && id) {
      const { data: product, error: productError } = await db
        .from("products")
        .select("*")
        .eq("id", id)
        .single();
      if (productError) throw productError;
      before = product;
      const { data: variants, error: variantLookupError } = await db
        .from("product_variants")
        .select("id")
        .eq("product_id", id);
      if (variantLookupError) throw variantLookupError;
      const variantIds = (variants ?? []).map((variant) => variant.id);
      const { count: reviewCount, error: reviewCountError } = await db
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq("product_id", id);
      if (reviewCountError) throw reviewCountError;
      if ((reviewCount ?? 0) > 0)
        return fail(
          "This product has customer reviews. Archive it to preserve review history.",
        );
      if (variantIds.length) {
        const { count: orderItemCount, error: orderItemError } = await db
          .from("order_items")
          .select("*", { count: "exact", head: true })
          .in("variant_id", variantIds);
        if (orderItemError) throw orderItemError;
        if ((orderItemCount ?? 0) > 0)
          return fail(
            "This product has order history. Archive it instead of deleting it.",
          );
        await db.from("cart_items").delete().in("variant_id", variantIds);
        await db.from("price_history").delete().in("variant_id", variantIds);
        await db
          .from("inventory_movements")
          .delete()
          .in("variant_id", variantIds);
        await db.from("inventory").delete().in("variant_id", variantIds);
      }
      await db.from("collection_products").delete().eq("product_id", id);
      await db.from("wishlist_items").delete().eq("product_id", id);
      await db.from("comparison_items").delete().eq("product_id", id);
      await db.from("recently_viewed").delete().eq("product_id", id);
      await db
        .from("product_specification_values")
        .delete()
        .eq("product_id", id);
      await db.from("product_images").delete().eq("product_id", id);
      await db.from("product_variants").delete().eq("product_id", id);
      const { error } = await db.from("products").delete().eq("id", id);
      if (error) throw error;
      after = { deleted: true, name: product.name };
    } else if (action === "category.delete" && id) {
      const { data: category, error: categoryError } = await db
        .from("categories")
        .select("*")
        .eq("id", id)
        .single();
      if (categoryError) throw categoryError;
      before = category;
      const { count, error: countError } = await db
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("category_id", id);
      if (countError) throw countError;
      if ((count ?? 0) > 0)
        return fail("Delete or move this category's products first.");
      const { error } = await db.from("categories").delete().eq("id", id);
      if (error) throw error;
      const { data: setting } = await db
        .from("site_settings")
        .select("value")
        .eq("key", "category_brand_map")
        .maybeSingle();
      const mapping =
        setting?.value &&
        typeof setting.value === "object" &&
        !Array.isArray(setting.value)
          ? { ...(setting.value as Record<string, unknown>) }
          : {};
      delete mapping[category.slug];
      await db.from("site_settings").upsert({
        key: "category_brand_map",
        value: mapping,
        is_public: false,
      });
      after = { deleted: true, name: category.name };
    } else if (action === "brand.delete" && id) {
      const { data: brand, error: brandError } = await db
        .from("brands")
        .select("*")
        .eq("id", id)
        .single();
      if (brandError) throw brandError;
      before = brand;
      const { count, error: countError } = await db
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("brand_id", id);
      if (countError) throw countError;
      if ((count ?? 0) > 0)
        return fail(
          "This brand still has products. Delete or reassign those products first.",
        );
      const { error } = await db.from("brands").delete().eq("id", id);
      if (error) throw error;
      const { data: setting } = await db
        .from("site_settings")
        .select("value")
        .eq("key", "category_brand_map")
        .maybeSingle();
      const mapping =
        setting?.value &&
        typeof setting.value === "object" &&
        !Array.isArray(setting.value)
          ? Object.fromEntries(
              Object.entries(setting.value as Record<string, unknown>).map(
                ([category, brandSlugs]) => [
                  category,
                  Array.isArray(brandSlugs)
                    ? brandSlugs.filter((brandSlug) => brandSlug !== brand.slug)
                    : [],
                ],
              ),
            )
          : {};
      await db.from("site_settings").upsert({
        key: "category_brand_map",
        value: mapping,
        is_public: false,
      });
      after = { deleted: true, name: brand.name };
    } else if (action === "product.save") {
      const name = text(payload, "name");
      const categoryId = text(payload, "categoryId");
      const brandId = text(payload, "brandId");
      if (!name || !categoryId || !brandId)
        return fail("Name, category and brand are required.");
      const status = productStatuses.includes(
        text(payload, "status") as (typeof productStatuses)[number],
      )
        ? text(payload, "status")
        : "draft";
      const productValues = {
        name,
        slug: slug(text(payload, "slug") || name),
        category_id: categoryId,
        brand_id: brandId,
        short_description: text(payload, "shortDescription") || null,
        description: text(payload, "description") || null,
        status,
        is_featured: flag(payload, "isFeatured"),
        seo_title: text(payload, "seoTitle") || null,
        seo_description: text(payload, "seoDescription") || null,
        published_at: status === "published" ? new Date().toISOString() : null,
        archived_at: status === "archived" ? new Date().toISOString() : null,
      };

      if (id) {
        const { data: oldProduct } = await db
          .from("products")
          .select("*")
          .eq("id", id)
          .single();
        before = oldProduct;
        const { data, error } = await db
          .from("products")
          .update(productValues)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        after = data;
        const variantId = text(payload, "variantId");
        if (variantId) {
          const variantValues = {
            sku: text(payload, "sku"),
            name: text(payload, "variantName") || "Standard",
            price: Math.max(0, number(payload, "price")),
            retail_price: Math.max(
              number(payload, "price"),
              number(payload, "retailPrice"),
            ),
            cost: Math.max(0, number(payload, "cost")),
            weight_grams: Math.max(
              0,
              Math.round(number(payload, "weightGrams")),
            ),
            is_active: flag(payload, "variantActive", true),
          };
          const { error: variantError } = await db
            .from("product_variants")
            .update(variantValues)
            .eq("id", variantId);
          if (variantError) throw variantError;
          const quantity = Math.max(0, Math.round(number(payload, "stock")));
          const threshold = Math.max(
            0,
            Math.round(number(payload, "lowStockThreshold", 5)),
          );
          const { error: inventoryError } = await db
            .from("inventory")
            .update({ quantity, low_stock_threshold: threshold })
            .eq("variant_id", variantId);
          if (inventoryError) throw inventoryError;
        }
        entityId = id;
      } else {
        const sku = text(payload, "sku").toUpperCase();
        if (!sku) return fail("A unique SKU is required.");
        const { data: created, error } = await db
          .from("products")
          .insert(productValues)
          .select()
          .single();
        if (error) throw error;
        entityId = created.id;
        const price = Math.max(0, number(payload, "price"));
        const { data: variant, error: variantError } = await db
          .from("product_variants")
          .insert({
            product_id: created.id,
            sku,
            name: text(payload, "variantName") || "Standard",
            price,
            retail_price: Math.max(
              price,
              number(payload, "retailPrice", price),
            ),
            cost: Math.max(0, number(payload, "cost")),
            weight_grams: Math.max(
              0,
              Math.round(number(payload, "weightGrams")),
            ),
          })
          .select()
          .single();
        if (variantError) {
          await db.from("products").delete().eq("id", created.id);
          throw variantError;
        }
        const { error: inventoryError } = await db.from("inventory").insert({
          variant_id: variant.id,
          quantity: Math.max(0, Math.round(number(payload, "stock"))),
          low_stock_threshold: Math.max(
            0,
            Math.round(number(payload, "lowStockThreshold", 5)),
          ),
        });
        if (inventoryError) throw inventoryError;
        after = created;
      }
      const imagePath = text(payload, "imagePath");
      if (imagePath && entityId) {
        const { data: primaryImage } = await db
          .from("product_images")
          .select("id")
          .eq("product_id", entityId)
          .eq("is_primary", true)
          .maybeSingle();
        const imageValues = {
          storage_path: imagePath,
          alt_text: text(payload, "imageAlt") || name,
          is_primary: true,
          sort_order: 0,
        };
        const imageResult = primaryImage
          ? await db
              .from("product_images")
              .update(imageValues)
              .eq("id", primaryImage.id)
          : await db
              .from("product_images")
              .insert({ product_id: entityId, ...imageValues });
        if (imageResult.error) throw imageResult.error;
      }
    } else if (action === "product.status" && id) {
      const status = text(payload, "status");
      if (!productStatuses.includes(status as (typeof productStatuses)[number]))
        return fail("Invalid product status.");
      const { data: old } = await db
        .from("products")
        .select("*")
        .eq("id", id)
        .single();
      before = old;
      const { data, error } = await db
        .from("products")
        .update({
          status,
          published_at:
            status === "published"
              ? new Date().toISOString()
              : old?.published_at,
          archived_at: status === "archived" ? new Date().toISOString() : null,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      after = data;
    } else if (action === "product.duplicate" && id) {
      const { data: source, error: sourceError } = await db
        .from("products")
        .select("*,product_variants(*)")
        .eq("id", id)
        .single();
      if (sourceError) throw sourceError;
      before = source;
      const suffix = Date.now().toString().slice(-6);
      const { data: copy, error } = await db
        .from("products")
        .insert({
          category_id: source.category_id,
          brand_id: source.brand_id,
          name: `${source.name} Copy`,
          slug: `${source.slug}-copy-${suffix}`,
          short_description: source.short_description,
          description: source.description,
          status: "draft",
          is_featured: false,
          search_keywords: source.search_keywords,
          seo_title: source.seo_title,
          seo_description: source.seo_description,
        })
        .select()
        .single();
      if (error) throw error;
      entityId = copy.id;
      const sourceVariant = source.product_variants?.[0];
      if (sourceVariant) {
        const { data: variant, error: variantError } = await db
          .from("product_variants")
          .insert({
            product_id: copy.id,
            sku: `${sourceVariant.sku}-COPY-${suffix}`,
            name: sourceVariant.name,
            attributes: sourceVariant.attributes,
            price: sourceVariant.price,
            retail_price: sourceVariant.retail_price,
            cost: sourceVariant.cost,
            weight_grams: sourceVariant.weight_grams,
          })
          .select()
          .single();
        if (variantError) throw variantError;
        await db.from("inventory").insert({
          variant_id: variant.id,
          quantity: 0,
          low_stock_threshold: 5,
        });
      }
      after = copy;
    } else if (["category.save", "brand.save"].includes(action)) {
      const table = action.startsWith("category") ? "categories" : "brands";
      entityType = table.slice(0, -1);
      const name = text(payload, "name");
      if (!name) return fail("Name is required.");
      if (table === "categories") {
        const values = {
          name,
          slug: slug(text(payload, "slug") || name),
          image_path: text(payload, "imagePath") || null,
          is_featured: flag(payload, "isFeatured"),
          is_visible: flag(payload, "isVisible", true),
          sort_order: Math.round(number(payload, "sortOrder")),
        };
        if (id) {
          const { data: old } = await db
            .from("categories")
            .select("*")
            .eq("id", id)
            .single();
          before = old;
          const { data, error } = await db
            .from("categories")
            .update(values)
            .eq("id", id)
            .select()
            .single();
          if (error) throw error;
          after = data;
        } else {
          const { data, error } = await db
            .from("categories")
            .insert(values)
            .select()
            .single();
          if (error) throw error;
          entityId = data.id;
          after = data;
        }
      } else {
        const values = {
          name,
          slug: slug(text(payload, "slug") || name),
          logo_path: text(payload, "logoPath") || null,
          description: text(payload, "description") || null,
          is_featured: flag(payload, "isFeatured"),
          is_visible: flag(payload, "isVisible", true),
          sort_order: Math.round(number(payload, "sortOrder")),
        };
        if (id) {
          const { data: old } = await db
            .from("brands")
            .select("*")
            .eq("id", id)
            .single();
          before = old;
          const { data, error } = await db
            .from("brands")
            .update(values)
            .eq("id", id)
            .select()
            .single();
          if (error) throw error;
          after = data;
        } else {
          const { data, error } = await db
            .from("brands")
            .insert(values)
            .select()
            .single();
          if (error) throw error;
          entityId = data.id;
          after = data;
        }
        const categoryId = text(payload, "categoryId");
        const brandId = entityId;
        if (!categoryId || !brandId)
          return fail("Select a category for this brand.");
        const [{ data: category }, { data: brand }, { data: setting }] =
          await Promise.all([
            db.from("categories").select("slug").eq("id", categoryId).single(),
            db.from("brands").select("slug").eq("id", brandId).single(),
            db
              .from("site_settings")
              .select("value")
              .eq("key", "category_brand_map")
              .maybeSingle(),
          ]);
        if (!category || !brand)
          return fail("The selected category or brand is no longer available.");
        const mapping =
          setting?.value &&
          typeof setting.value === "object" &&
          !Array.isArray(setting.value)
            ? { ...(setting.value as Record<string, unknown>) }
            : {};
        const current = Array.isArray(mapping[category.slug])
          ? (mapping[category.slug] as unknown[])
          : [];
        mapping[category.slug] = [
          ...new Set([
            ...current.filter(
              (item): item is string => typeof item === "string",
            ),
            brand.slug,
          ]),
        ];
        const { error: mappingError } = await db.from("site_settings").upsert({
          key: "category_brand_map",
          value: mapping,
          is_public: false,
        });
        if (mappingError) throw mappingError;
        const relationResult = await db
          .from("category_brands")
          .upsert(
            { category_id: categoryId, brand_id: brandId },
            { onConflict: "category_id,brand_id" },
          );
        if (
          relationResult.error &&
          !relationResult.error.message.includes("category_brands")
        ) {
          throw relationResult.error;
        }
      }
    } else if (
      [
        "category.toggle",
        "brand.toggle",
        "coupon.toggle",
        "collection.toggle",
        "banner.toggle",
        "faq.toggle",
      ].includes(action) &&
      id
    ) {
      const tableMap: Record<string, string> = {
        category: "categories",
        brand: "brands",
        coupon: "coupons",
        collection: "collections",
        banner: "banners",
        faq: "faqs",
      };
      const prefix = action.split(".")[0];
      const table = tableMap[prefix];
      const field = prefix === "coupon" ? "is_active" : "is_visible";
      const { data: old } = await db
        .from(table)
        .select("*")
        .eq("id", id)
        .single();
      before = old;
      const { data, error } = await db
        .from(table)
        .update({ [field]: flag(payload, "enabled") })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      after = data;
      entityType = prefix;
    } else if (action === "inventory.adjust" && id) {
      const delta = Math.round(number(payload, "delta"));
      const reason = text(payload, "reason");
      if (!delta || !reason)
        return fail("Enter a non-zero stock change and reason.");
      const { data: stock, error: stockError } = await db
        .from("inventory")
        .select("*")
        .eq("variant_id", id)
        .single();
      if (stockError) throw stockError;
      const next = stock.quantity + delta;
      if (next < stock.reserved_quantity)
        return fail("Stock cannot be lower than reserved quantity.");
      before = stock;
      const { data, error } = await db
        .from("inventory")
        .update({ quantity: next })
        .eq("variant_id", id)
        .select()
        .single();
      if (error) throw error;
      const { error: movementError } = await db
        .from("inventory_movements")
        .insert({
          variant_id: id,
          quantity_delta: delta,
          reason,
          created_by: actorId,
        });
      if (movementError) throw movementError;
      after = data;
      entityType = "inventory";
      entityId = id;
    } else if (action === "order.status" && id) {
      const status = text(payload, "status");
      if (!orderStatuses.includes(status as (typeof orderStatuses)[number]))
        return fail("Invalid order status.");
      const { data: old } = await db
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();
      before = old;
      const { data, error } = await db
        .from("orders")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      await db.from("order_status_history").insert({
        order_id: id,
        from_status: old?.status,
        to_status: status,
        note: text(payload, "note") || "Updated from admin panel",
        changed_by: actorId,
      });
      after = data;
    } else if (action === "order.note" && id) {
      const body = text(payload, "body");
      if (!body) return fail("A note is required.");
      const { data, error } = await db
        .from("staff_notes")
        .insert({
          entity_type: "order",
          entity_id: id,
          author_id: actorId,
          body,
        })
        .select()
        .single();
      if (error) throw error;
      after = data;
    } else if (["order.tracking", "shipment.save"].includes(action) && id) {
      const orderId =
        action === "order.tracking" ? id : text(payload, "orderId");
      if (!orderId) return fail("Order is required.");
      const values = {
        courier: text(payload, "courier") || null,
        tracking_number: text(payload, "trackingNumber") || null,
        tracking_url: text(payload, "trackingUrl") || null,
        status: text(payload, "status") || "pending",
      };
      const { data: existing } = await db
        .from("shipments")
        .select("*")
        .eq("order_id", orderId)
        .maybeSingle();
      before = existing;
      if (existing) {
        const { data, error } = await db
          .from("shipments")
          .update(values)
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        after = data;
        entityId = existing.id;
      } else {
        const { data, error } = await db
          .from("shipments")
          .insert({ order_id: orderId, ...values })
          .select()
          .single();
        if (error) throw error;
        after = data;
        entityId = data.id;
      }
      entityType = "shipment";
    } else if (action === "customer.status" && id) {
      const status = text(payload, "status");
      if (!["active", "suspended"].includes(status))
        return fail("Invalid account status.");
      const { data: old } = await db
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();
      before = old;
      const { data, error } = await db
        .from("profiles")
        .update({ account_status: status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      after = data;
      entityType = "customer";
    } else if (action === "review.status" && id) {
      const status = text(payload, "status");
      if (!reviewStatuses.includes(status as (typeof reviewStatuses)[number]))
        return fail("Invalid review status.");
      const { data: old } = await db
        .from("reviews")
        .select("*")
        .eq("id", id)
        .single();
      before = old;
      const { data, error } = await db
        .from("reviews")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      after = data;
    } else if (action === "complaint.status" && id) {
      const status = text(payload, "status");
      if (!ticketStatuses.includes(status as (typeof ticketStatuses)[number]))
        return fail("Invalid complaint status.");
      const { data: old } = await db
        .from("complaints")
        .select("*")
        .eq("id", id)
        .single();
      before = old;
      const { data, error } = await db
        .from("complaints")
        .update({
          status,
          resolution: text(payload, "resolution") || old?.resolution,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      after = data;
    } else if (action === "warranty.status" && id) {
      const status = text(payload, "status");
      if (!ticketStatuses.includes(status as (typeof ticketStatuses)[number]))
        return fail("Invalid claim status.");
      const { data: old } = await db
        .from("warranty_claims")
        .select("*")
        .eq("id", id)
        .single();
      before = old;
      const { data, error } = await db
        .from("warranty_claims")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      after = data;
      entityType = "warranty_claim";
    } else if (action === "coupon.save") {
      const code = text(payload, "code").toUpperCase();
      const startsAt =
        nullableDate(payload.startsAt) ?? new Date().toISOString();
      const endsAt = nullableDate(payload.endsAt);
      if (!code || !endsAt)
        return fail("Coupon code and end date are required.");
      const values = {
        code,
        discount_type:
          text(payload, "discountType") === "fixed" ? "fixed" : "percent",
        discount_value: Math.max(1, number(payload, "discountValue")),
        minimum_subtotal: Math.max(0, number(payload, "minimumSubtotal")),
        maximum_discount:
          number(payload, "maximumDiscount") > 0
            ? number(payload, "maximumDiscount")
            : null,
        usage_limit:
          number(payload, "usageLimit") > 0
            ? Math.round(number(payload, "usageLimit"))
            : null,
        per_user_limit: Math.max(
          1,
          Math.round(number(payload, "perUserLimit", 1)),
        ),
        starts_at: startsAt,
        ends_at: endsAt,
        is_active: flag(payload, "isActive", true),
      };
      const result = id
        ? await db.from("coupons").update(values).eq("id", id).select().single()
        : await db.from("coupons").insert(values).select().single();
      if (result.error) throw result.error;
      after = result.data;
      entityId = result.data.id;
    } else if (action === "collection.save") {
      const name = text(payload, "name");
      if (!name) return fail("Collection name is required.");
      const values = {
        name,
        slug: slug(text(payload, "slug") || name),
        description: text(payload, "description") || null,
        is_visible: flag(payload, "isVisible", true),
        starts_at: nullableDate(payload.startsAt),
        ends_at: nullableDate(payload.endsAt),
        sort_order: Math.round(number(payload, "sortOrder")),
      };
      const result = id
        ? await db
            .from("collections")
            .update(values)
            .eq("id", id)
            .select()
            .single()
        : await db.from("collections").insert(values).select().single();
      if (result.error) throw result.error;
      after = result.data;
      entityId = result.data.id;
    } else if (action === "banner.save") {
      const title = text(payload, "title");
      if (!title) return fail("Banner title is required.");
      const values = {
        title,
        subtitle: text(payload, "subtitle") || null,
        desktop_path: text(payload, "desktopPath") || null,
        mobile_path: text(payload, "mobilePath") || null,
        href: text(payload, "href") || null,
        background_color: text(payload, "backgroundColor") || null,
        is_visible: flag(payload, "isVisible", true),
        starts_at: nullableDate(payload.startsAt),
        ends_at: nullableDate(payload.endsAt),
        sort_order: Math.round(number(payload, "sortOrder")),
      };
      const result = id
        ? await db.from("banners").update(values).eq("id", id).select().single()
        : await db.from("banners").insert(values).select().single();
      if (result.error) throw result.error;
      after = result.data;
      entityId = result.data.id;
    } else if (action === "payment.status" && id) {
      const status = text(payload, "status");
      if (!paymentStatuses.includes(status as (typeof paymentStatuses)[number]))
        return fail("Invalid payment status.");
      const { data: old } = await db
        .from("payments")
        .select("*")
        .eq("id", id)
        .single();
      before = old;
      const { data, error } = await db
        .from("payments")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      after = data;
      if (old?.order_id)
        await db
          .from("orders")
          .update({ payment_status: status })
          .eq("id", old.order_id);
    } else if (action === "blog.save") {
      const title = text(payload, "title");
      const body = text(payload, "body");
      if (!title || !body) return fail("Blog title and body are required.");
      const status = productStatuses.includes(
        text(payload, "status") as (typeof productStatuses)[number],
      )
        ? text(payload, "status")
        : "draft";
      const values = {
        category_id: text(payload, "categoryId") || null,
        title,
        slug: slug(text(payload, "slug") || title),
        excerpt: text(payload, "excerpt") || null,
        body,
        cover_path: text(payload, "coverPath") || null,
        status,
        seo_title: text(payload, "seoTitle") || null,
        seo_description: text(payload, "seoDescription") || null,
        published_at: status === "published" ? new Date().toISOString() : null,
      };
      const result = id
        ? await db
            .from("blog_posts")
            .update(values)
            .eq("id", id)
            .select()
            .single()
        : await db.from("blog_posts").insert(values).select().single();
      if (result.error) throw result.error;
      after = result.data;
      entityId = result.data.id;
    } else if (action === "blog.status" && id) {
      const status = text(payload, "status");
      if (!productStatuses.includes(status as (typeof productStatuses)[number]))
        return fail("Invalid post status.");
      const { data: old } = await db
        .from("blog_posts")
        .select("*")
        .eq("id", id)
        .single();
      before = old;
      const { data, error } = await db
        .from("blog_posts")
        .update({
          status,
          published_at:
            status === "published"
              ? new Date().toISOString()
              : old?.published_at,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      after = data;
    } else if (action === "faq.save") {
      const question = text(payload, "question");
      const answer = text(payload, "answer");
      if (!question || !answer)
        return fail("Question and answer are required.");
      const values = {
        question,
        answer,
        category: text(payload, "category") || null,
        sort_order: Math.round(number(payload, "sortOrder")),
        is_visible: flag(payload, "isVisible", true),
        published_at: flag(payload, "isVisible", true)
          ? new Date().toISOString()
          : null,
      };
      const result = id
        ? await db.from("faqs").update(values).eq("id", id).select().single()
        : await db.from("faqs").insert(values).select().single();
      if (result.error) throw result.error;
      after = result.data;
      entityId = result.data.id;
    } else if (action === "notification.send") {
      const title = text(payload, "title");
      const body = text(payload, "body");
      if (!title || !body)
        return fail("Notification title and message are required.");
      const requestedUserId = text(payload, "userId");
      const baseNotification = {
        title,
        body,
        type: text(payload, "type") || "admin_announcement",
        deep_link: text(payload, "deepLink") || null,
      };
      let targets = requestedUserId ? [requestedUserId] : [];
      if (!requestedUserId) {
        const { data: customerRoles, error: customerError } = await db
          .from("user_roles")
          .select("user_id")
          .eq("role", "customer");
        if (customerError) throw customerError;
        targets = [
          ...new Set((customerRoles ?? []).map((item) => item.user_id)),
        ];
      }
      if (!targets.length)
        return fail(
          "No customer accounts are available for this notification.",
        );
      const { data, error } = await db
        .from("notifications")
        .insert(
          targets.map((userId) => ({ user_id: userId, ...baseNotification })),
        )
        .select();
      if (error) throw error;
      after = data;
      entityId = data[0]?.id ?? null;
    } else if (action === "settings.save") {
      const key = text(payload, "key");
      if (!key) return fail("Setting key is required.");
      let settingValue: unknown = payload.value ?? "";
      if (typeof settingValue === "string") {
        try {
          settingValue = JSON.parse(settingValue);
        } catch {
          settingValue = { value: settingValue };
        }
      }
      const { data: old } = await db
        .from("site_settings")
        .select("*")
        .eq("key", key)
        .maybeSingle();
      before = old;
      const { data, error } = await db
        .from("site_settings")
        .upsert({
          key,
          value: settingValue,
          is_public: flag(payload, "isPublic"),
        })
        .select()
        .single();
      if (error) throw error;
      after = data;
      entityType = "setting";
      entityId = null;
    } else if (action === "staff.role" && id) {
      const role = text(payload, "role") as StaffRole;
      if (
        ![
          "super_admin",
          "admin",
          "catalog_manager",
          "order_manager",
          "support_agent",
          "content_manager",
          "finance_manager",
          "analyst",
        ].includes(role)
      ) {
        return fail("Invalid staff role.");
      }
      if (id === actorId && role !== "super_admin")
        return fail("You cannot remove your own super-admin access.");
      const { data: old } = await db
        .from("user_roles")
        .select("*")
        .eq("user_id", id);
      before = old;
      await db
        .from("user_roles")
        .delete()
        .eq("user_id", id)
        .neq("role", "customer");
      const { error } = await db
        .from("user_roles")
        .insert({ user_id: id, role });
      if (error) throw error;
      after = { user_id: id, role };
      entityType = "staff_role";
      entityId = id;
    } else {
      return fail("This admin action is not available.");
    }

    await audit(db, actorId, action, entityType, entityId, before, after);
    revalidatePath("/admin", "layout");
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, data: after });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The admin action failed.";
    return fail(
      message.includes("duplicate key")
        ? "That name, slug, code or SKU already exists."
        : message,
      500,
    );
  }
}

function xml(value: unknown) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function excelCell(value: unknown, style = "") {
  const styleAttribute = style ? ` ss:StyleID="${style}"` : "";
  if (typeof value === "number" && Number.isFinite(value)) {
    return `<Cell${styleAttribute}><Data ss:Type="Number">${value}</Data></Cell>`;
  }
  if (typeof value === "boolean") {
    return `<Cell${styleAttribute}><Data ss:Type="Boolean">${value ? 1 : 0}</Data></Cell>`;
  }
  const textValue =
    value === null || value === undefined
      ? ""
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value);
  return `<Cell${styleAttribute}><Data ss:Type="String">${xml(textValue)}</Data></Cell>`;
}

function excelWorkbook(kind: string, rows: Record<string, unknown>[]) {
  const headers = rows.length
    ? Array.from(new Set(rows.flatMap((row) => Object.keys(row))))
    : ["no_records"];
  const sheetName = kind.replaceAll("-", " ").slice(0, 31);
  const tableRows = [
    `<Row>${headers.map((header) => excelCell(header.replaceAll("_", " ").toUpperCase(), "Header")).join("")}</Row>`,
    ...rows.map(
      (row) =>
        `<Row>${headers.map((header) => excelCell(row[header])).join("")}</Row>`,
    ),
  ].join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Bottom"/><Font ss:FontName="Calibri" ss:Size="11"/></Style>
  <Style ss:ID="Header"><Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#2563EB" ss:Pattern="Solid"/><Alignment ss:Vertical="Center"/></Style>
 </Styles>
 <Worksheet ss:Name="${xml(sheetName)}">
  <Table ss:ExpandedColumnCount="${headers.length}" ss:ExpandedRowCount="${rows.length + 1}" x:FullColumns="1" x:FullRows="1">
   ${tableRows}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>1</SplitHorizontal><TopRowBottomPane>1</TopRowBottomPane><ActivePane>2</ActivePane></WorksheetOptions>
 </Worksheet>
</Workbook>`;
}

export async function GET(request: Request) {
  const auth = await requireStaff();
  if ("error" in auth)
    return fail(
      auth.error ?? "Access could not be verified.",
      auth.status ?? 500,
    );

  const kind = new URL(request.url).searchParams.get("export") ?? "overview";
  const exports: Record<
    string,
    { table: string; select: string; permission: string }
  > = {
    overview: {
      table: "orders",
      select: "*,profiles!orders_customer_id_fkey(full_name,email)",
      permission: "reports",
    },
    products: {
      table: "products",
      select:
        "*,categories(name),brands(name),product_variants(sku,name,price,is_active,inventory(quantity,reserved_quantity))",
      permission: "catalog",
    },
    categories: { table: "categories", select: "*", permission: "catalog" },
    brands: { table: "brands", select: "*", permission: "catalog" },
    inventory: {
      table: "product_variants",
      select:
        "*,products(name,status),inventory(quantity,reserved_quantity,low_stock_threshold)",
      permission: "inventory",
    },
    orders: {
      table: "orders",
      select:
        "*,profiles!orders_customer_id_fkey(full_name,email,phone),order_items(*)",
      permission: "orders",
    },
    customers: {
      table: "profiles",
      select: "*,user_roles(role)",
      permission: "customers",
    },
    reviews: {
      table: "reviews",
      select: "*,products(name),profiles!reviews_user_id_fkey(full_name,email)",
      permission: "reviews",
    },
    complaints: {
      table: "complaints",
      select:
        "*,profiles!complaints_user_id_fkey(full_name,email),orders(order_number)",
      permission: "support",
    },
    warranties: {
      table: "warranties",
      select:
        "*,profiles(full_name,email),order_items(product_name,variant_name,sku)",
      permission: "warranties",
    },
    coupons: { table: "coupons", select: "*", permission: "coupons" },
    promotions: {
      table: "collections",
      select: "*,collection_products(product_id,sort_order)",
      permission: "promotions",
    },
    homepage: { table: "banners", select: "*", permission: "content" },
    banners: { table: "banners", select: "*", permission: "content" },
    payments: {
      table: "payments",
      select: "*,orders(order_number,customer_id)",
      permission: "payments",
    },
    shipments: {
      table: "shipments",
      select: "*,orders(order_number,status)",
      permission: "shipments",
    },
    blog: {
      table: "blog_posts",
      select: "*,blog_categories(name)",
      permission: "content",
    },
    faqs: { table: "faqs", select: "*", permission: "content" },
    notifications: {
      table: "notifications",
      select: "*",
      permission: "content",
    },
    reports: {
      table: "orders",
      select: "id,order_number,status,payment_status,grand_total,created_at",
      permission: "reports",
    },
    staff: {
      table: "profiles",
      select: "*,user_roles(role)",
      permission: "staff_admin",
    },
    settings: { table: "site_settings", select: "*", permission: "content" },
    "audit-logs": {
      table: "audit_logs",
      select: "*,profiles(full_name,email)",
      permission: "reports",
    },
  };
  const config = exports[kind];
  if (!config) return fail("This page does not have an export.");
  if (!can(auth.role, config.permission))
    return fail("Your role cannot export this page.", 403);

  const db = createAdminClient();
  const { data, error } = await db
    .from(config.table)
    .select(config.select)
    .limit(5000);
  if (error) return fail(error.message, 500);
  const rows = (data ?? []) as unknown as Record<string, unknown>[];
  const workbook = excelWorkbook(kind, rows);
  await audit(db, auth.user.id, `report.export.${kind}`, "report", null, null, {
    rows: rows.length,
  });
  return new NextResponse(`\uFEFF${workbook}`, {
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": `attachment; filename="voltixa-${kind}-${new Date().toISOString().slice(0, 10)}.xls"`,
      "Cache-Control": "private, no-store",
    },
  });
}
