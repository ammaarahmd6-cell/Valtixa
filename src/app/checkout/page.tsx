import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutPage } from "@/components/checkout-page";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Secure checkout",
  robots: { index: false, follow: false },
};

export default async function Page() {
  const supabase = await createClient();
  if (!supabase) redirect("/login?next=/checkout");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/checkout");

  const [{ data: profile }, { data: address }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name,email,phone")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("addresses")
      .select(
        "recipient_name,phone,province,city,area,address_line,postal_code",
      )
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <CheckoutPage
      initialValues={{
        fullName: address?.recipient_name || profile?.full_name || "",
        email: profile?.email || user.email || "",
        phone: address?.phone || profile?.phone || "",
        province: address?.province || "",
        city: address?.city || "",
        area: address?.area || "",
        address: address?.address_line || "",
        postalCode: address?.postal_code || "",
      }}
    />
  );
}
