import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminPage } from "@/components/admin-page";
import { getAdminData } from "@/lib/admin-data";
import { isStaffRole } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Admin | VOLTIXA",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path = [] } = await params;
  const supabase = await createClient();
  if (!supabase) redirect("/login?next=/admin");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);
  const role = roles?.map((item) => item.role).find(isStaffRole);
  if (!role) redirect("/account?notice=admin-required");

  const [{ data: profile }, adminData] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name,email")
      .eq("id", user.id)
      .maybeSingle(),
    getAdminData(path[0] ?? "overview"),
  ]);

  return (
    <AdminPage
      path={path}
      data={adminData}
      operator={{
        name: profile?.full_name || "VOLTIXA Admin",
        email: profile?.email || user.email || "",
        role,
      }}
    />
  );
}
