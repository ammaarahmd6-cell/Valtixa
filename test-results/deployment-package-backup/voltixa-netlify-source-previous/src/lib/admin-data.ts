import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

type QueryResult = { data: unknown; error: { message: string } | null };
type AdminData = Record<string, unknown>;

const emptyData: AdminData = {
  products: [],
  categories: [],
  brands: [],
  inventory: [],
  orders: [],
  customers: [],
  reviews: [],
  complaints: [],
  warranties: [],
  coupons: [],
  collections: [],
  banners: [],
  payments: [],
  shipments: [],
  blogCategories: [],
  blog: [],
  faqs: [],
  notifications: [],
  settings: [],
  auditLogs: [],
  returns: [],
  categoryBrandSetting: [],
};

function value(result: QueryResult, label: string) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data ?? [];
}

export async function getAdminData(section = "overview") {
  const db = createAdminClient();
  const data: AdminData = { ...emptyData };
  const set = async (
    key: string,
    label: string,
    query: PromiseLike<QueryResult>,
  ) => {
    data[key] = value(await query, label);
  };
  const tasks: Promise<void>[] = [];

  if (section === "overview") {
    tasks.push(
      set("products", "Products", db.from("products").select("id,status")),
      set(
        "inventory",
        "Inventory",
        db
          .from("product_variants")
          .select(
            "id,inventory(quantity,reserved_quantity,low_stock_threshold)",
          )
          .eq("is_active", true),
      ),
      set(
        "orders",
        "Orders",
        db
          .from("orders")
          .select(
            "id,order_number,status,payment_status,grand_total,created_at,profiles!orders_customer_id_fkey(full_name,email)",
          )
          .order("created_at", { ascending: false })
          .limit(30),
      ),
      set(
        "customers",
        "Customers",
        db.from("profiles").select("id").limit(1000),
      ),
      set("reviews", "Reviews", db.from("reviews").select("id,status")),
      set(
        "complaints",
        "Complaints",
        db.from("complaints").select("id,status"),
      ),
    );
  } else if (section === "products") {
    tasks.push(
      set(
        "products",
        "Products",
        db
          .from("products")
          .select(
            "id,name,slug,short_description,description,status,is_featured,seo_title,seo_description,published_at,created_at,category_id,brand_id,categories(name),brands(name),product_variants(id,sku,name,price,retail_price,cost,weight_grams,is_active,inventory(quantity,reserved_quantity,low_stock_threshold)),product_images(storage_path,alt_text,is_primary,sort_order)",
          )
          .order("created_at", { ascending: false }),
      ),
      set(
        "categories",
        "Categories",
        db.from("categories").select("*").order("sort_order").order("name"),
      ),
      set(
        "brands",
        "Brands",
        db.from("brands").select("*").order("sort_order").order("name"),
      ),
      set(
        "categoryBrandSetting",
        "Category brand mapping",
        db
          .from("site_settings")
          .select("value")
          .eq("key", "category_brand_map")
          .maybeSingle(),
      ),
    );
  } else if (section === "categories") {
    tasks.push(
      set(
        "categories",
        "Categories",
        db.from("categories").select("*").order("sort_order").order("name"),
      ),
    );
  } else if (section === "brands") {
    tasks.push(
      set(
        "brands",
        "Brands",
        db.from("brands").select("*").order("sort_order").order("name"),
      ),
      set(
        "categories",
        "Categories",
        db.from("categories").select("*").order("sort_order").order("name"),
      ),
      set(
        "categoryBrandSetting",
        "Category brand mapping",
        db
          .from("site_settings")
          .select("value")
          .eq("key", "category_brand_map")
          .maybeSingle(),
      ),
    );
  } else if (section === "inventory") {
    tasks.push(
      set(
        "inventory",
        "Inventory",
        db
          .from("product_variants")
          .select(
            "id,product_id,sku,name,price,retail_price,is_active,products(name,status),inventory(quantity,reserved_quantity,low_stock_threshold,updated_at)",
          )
          .eq("is_active", true)
          .order("created_at", { ascending: false }),
      ),
    );
  } else if (section === "orders") {
    tasks.push(
      set(
        "orders",
        "Orders",
        db
          .from("orders")
          .select(
            "*,profiles!orders_customer_id_fkey(full_name,email,phone),order_items(*),payments(*),shipments(*)",
          )
          .order("created_at", { ascending: false })
          .limit(250),
      ),
    );
  } else if (section === "customers" || section === "staff") {
    tasks.push(
      set(
        "customers",
        "Customers",
        db
          .from("profiles")
          .select("*,user_roles(role)")
          .order("created_at", { ascending: false })
          .limit(500),
      ),
    );
  } else if (section === "reviews") {
    tasks.push(
      set(
        "reviews",
        "Reviews",
        db
          .from("reviews")
          .select(
            "*,products(name),profiles!reviews_user_id_fkey(full_name,email)",
          )
          .order("created_at", { ascending: false }),
      ),
    );
  } else if (section === "complaints") {
    tasks.push(
      set(
        "complaints",
        "Complaints",
        db
          .from("complaints")
          .select(
            "*,profiles!complaints_user_id_fkey(full_name,email),orders(order_number),complaint_messages(*)",
          )
          .order("created_at", { ascending: false }),
      ),
    );
  } else if (section === "warranties") {
    tasks.push(
      set(
        "warranties",
        "Warranties",
        db
          .from("warranties")
          .select(
            "*,profiles(full_name,email),order_items(product_name,variant_name,sku),warranty_claims(*)",
          )
          .order("activated_at", { ascending: false }),
      ),
    );
  } else if (section === "coupons") {
    tasks.push(
      set(
        "coupons",
        "Coupons",
        db.from("coupons").select("*").order("starts_at", { ascending: false }),
      ),
    );
  } else if (section === "promotions") {
    tasks.push(
      set(
        "collections",
        "Collections",
        db
          .from("collections")
          .select("*,collection_products(product_id,sort_order)")
          .order("sort_order"),
      ),
    );
  } else if (section === "homepage" || section === "banners") {
    tasks.push(
      set(
        "banners",
        "Banners",
        db.from("banners").select("*").order("sort_order"),
      ),
    );
  } else if (section === "payments") {
    tasks.push(
      set(
        "payments",
        "Payments",
        db
          .from("payments")
          .select("*,orders(order_number,customer_id)")
          .order("created_at", { ascending: false }),
      ),
    );
  } else if (section === "shipments") {
    tasks.push(
      set(
        "shipments",
        "Shipments",
        db
          .from("shipments")
          .select("*,orders(order_number,status)")
          .order("updated_at", { ascending: false }),
      ),
    );
  } else if (section === "blog") {
    tasks.push(
      set(
        "blogCategories",
        "Blog categories",
        db.from("blog_categories").select("*").order("name"),
      ),
      set(
        "blog",
        "Blog",
        db
          .from("blog_posts")
          .select("*,blog_categories(name)")
          .order("created_at", { ascending: false }),
      ),
    );
  } else if (section === "faqs") {
    tasks.push(
      set("faqs", "FAQs", db.from("faqs").select("*").order("sort_order")),
    );
  } else if (section === "notifications") {
    tasks.push(
      set(
        "notifications",
        "Notifications",
        db
          .from("notifications")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(250),
      ),
    );
  } else if (section === "reports") {
    tasks.push(
      set(
        "orders",
        "Orders",
        db
          .from("orders")
          .select("id,status,payment_status,grand_total,created_at")
          .order("created_at", { ascending: false })
          .limit(5000),
      ),
    );
  } else if (section === "settings") {
    tasks.push(
      set(
        "settings",
        "Settings",
        db.from("site_settings").select("*").order("key"),
      ),
    );
  } else if (section === "audit-logs") {
    tasks.push(
      set(
        "auditLogs",
        "Audit logs",
        db
          .from("audit_logs")
          .select("*,profiles(full_name,email)")
          .order("created_at", { ascending: false })
          .limit(300),
      ),
    );
  }

  if (section !== "notifications") {
    tasks.push(
      set(
        "notifications",
        "Notifications",
        db
          .from("notifications")
          .select("id,read_at")
          .order("created_at", { ascending: false })
          .limit(25),
      ),
    );
  }

  await Promise.all(tasks);
  return data;
}
