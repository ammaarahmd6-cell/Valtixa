import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountPage } from "@/components/account-page";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
export const metadata: Metadata = {
  title: "My account",
  robots: { index: false, follow: false },
};
export default async function Page({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path = [] } = await params;
  const supabase = await createClient();
  if (!supabase) redirect("/login?next=/account");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");
  const adminDb = createAdminClient();
  const [
    { data: profile },
    { data: orders },
    { data: roles },
    { data: addresses },
    { data: complaints },
    { data: notifications },
    { data: reviews },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name,email,phone,preferred_language")
      .eq("id", user.id)
      .maybeSingle(),
    adminDb
      .from("orders")
      .select(
        "id,order_number,status,payment_status,payment_method,grand_total,created_at,order_items(id,product_name,variant_name,sku,quantity,line_total),shipments(courier,tracking_number,status)",
      )
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
    adminDb
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false }),
    adminDb
      .from("complaints")
      .select(
        "id,order_id,category,subject,description,priority,status,resolution,created_at,orders(order_number)",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    adminDb
      .from("notifications")
      .select("id,title,body,type,deep_link,read_at,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100),
    adminDb
      .from("reviews")
      .select("id,rating,title,body,status,created_at,products(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);
  return (
    <AccountPage
      path={path}
      user={{
        name:
          profile?.full_name || user.email?.split("@")[0] || "Voltixa member",
        email: profile?.email || user.email || "",
        phone: profile?.phone || "",
        preferredLanguage: profile?.preferred_language || "en",
        roles: roles?.map((r) => r.role) ?? [],
        orderCount: orders?.length ?? 0,
      }}
      addresses={addresses ?? []}
      orders={orders ?? []}
      complaints={complaints ?? []}
      notifications={notifications ?? []}
      reviews={reviews ?? []}
    />
  );
}
