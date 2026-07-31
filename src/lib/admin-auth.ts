import "server-only";
import { createClient } from "@/lib/supabase/server";

export const staffRoles = [
  "super_admin",
  "admin",
  "catalog_manager",
  "order_manager",
  "support_agent",
  "content_manager",
  "finance_manager",
  "analyst",
] as const;

export type StaffRole = (typeof staffRoles)[number];

const permissions: Record<StaffRole, string[]> = {
  super_admin: ["*"],
  admin: ["*"],
  catalog_manager: ["catalog", "inventory", "reports"],
  order_manager: ["orders", "inventory", "shipments", "customers", "reports"],
  support_agent: ["customers", "reviews", "support", "warranties"],
  content_manager: ["content", "promotions", "catalog"],
  finance_manager: ["orders", "payments", "reports", "coupons"],
  analyst: ["reports"],
};

export function isStaffRole(value: string): value is StaffRole {
  return staffRoles.includes(value as StaffRole);
}

export function can(role: StaffRole, permission: string) {
  return (
    permissions[role].includes("*") || permissions[role].includes(permission)
  );
}

export async function requireStaff() {
  const supabase = await createClient();
  if (!supabase)
    return { error: "Supabase is not configured.", status: 503 } as const;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again.", status: 401 } as const;

  const { data: roles, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);
  if (error)
    return {
      error: "Your staff access could not be verified.",
      status: 500,
    } as const;

  const role = roles?.map((item) => item.role).find(isStaffRole);
  if (!role)
    return { error: "Admin access is required.", status: 403 } as const;

  return { user, role, supabase } as const;
}
