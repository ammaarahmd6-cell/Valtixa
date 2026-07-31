import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const addressSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().trim().min(2).max(30),
  recipientName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(10).max(24),
  alternatePhone: z.string().trim().max(24).optional().default(""),
  province: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(80),
  area: z.string().trim().min(2).max(120),
  addressLine: z.string().trim().min(10).max(500),
  landmark: z.string().trim().max(160).optional().default(""),
  postalCode: z.string().trim().max(20).optional().default(""),
  isDefault: z.boolean().optional().default(false),
});

function responseError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

async function authenticatedUser() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  return error ? null : data.user;
}

async function addressList(userId: string) {
  const db = createAdminClient();
  const { data, error } = await db
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function GET() {
  const user = await authenticatedUser();
  if (!user) return responseError("Please sign in again.", 401);
  try {
    return NextResponse.json({ addresses: await addressList(user.id) });
  } catch (error) {
    return responseError(
      error instanceof Error ? error.message : "Addresses could not be loaded.",
      500,
    );
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request))
    return responseError("This address request was blocked.", 403);
  const user = await authenticatedUser();
  if (!user) return responseError("Please sign in again.", 401);
  const parsed = addressSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return responseError("Please complete all required address fields.");

  const db = createAdminClient();
  try {
    const { count, error: countError } = await db
      .from("addresses")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    if (countError) throw countError;
    const makeDefault = parsed.data.isDefault || (count ?? 0) === 0;
    if (makeDefault) {
      const { error } = await db
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", user.id);
      if (error) throw error;
    }
    const { error } = await db.from("addresses").insert({
      user_id: user.id,
      recipient_name: parsed.data.recipientName,
      phone: parsed.data.phone,
      alternate_phone: parsed.data.alternatePhone || null,
      province: parsed.data.province,
      city: parsed.data.city,
      area: parsed.data.area,
      address_line: parsed.data.addressLine,
      landmark: parsed.data.landmark || null,
      postal_code: parsed.data.postalCode || null,
      label: parsed.data.label,
      is_default: makeDefault,
    });
    if (error) throw error;
    return NextResponse.json(
      { addresses: await addressList(user.id) },
      { status: 201 },
    );
  } catch (error) {
    return responseError(
      error instanceof Error ? error.message : "Address could not be saved.",
      500,
    );
  }
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request))
    return responseError("This address request was blocked.", 403);
  const user = await authenticatedUser();
  if (!user) return responseError("Please sign in again.", 401);
  const parsed = addressSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success || !parsed.data.id)
    return responseError("The address update is incomplete.");

  const db = createAdminClient();
  try {
    const { data: existing, error: lookupError } = await db
      .from("addresses")
      .select("id")
      .eq("id", parsed.data.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!existing) return responseError("Address not found.", 404);
    if (parsed.data.isDefault) {
      const { error } = await db
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", user.id);
      if (error) throw error;
    }
    const { error } = await db
      .from("addresses")
      .update({
        recipient_name: parsed.data.recipientName,
        phone: parsed.data.phone,
        alternate_phone: parsed.data.alternatePhone || null,
        province: parsed.data.province,
        city: parsed.data.city,
        area: parsed.data.area,
        address_line: parsed.data.addressLine,
        landmark: parsed.data.landmark || null,
        postal_code: parsed.data.postalCode || null,
        label: parsed.data.label,
        is_default: parsed.data.isDefault,
      })
      .eq("id", parsed.data.id)
      .eq("user_id", user.id);
    if (error) throw error;
    return NextResponse.json({ addresses: await addressList(user.id) });
  } catch (error) {
    return responseError(
      error instanceof Error ? error.message : "Address could not be updated.",
      500,
    );
  }
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request))
    return responseError("This address request was blocked.", 403);
  const user = await authenticatedUser();
  if (!user) return responseError("Please sign in again.", 401);
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !z.string().uuid().safeParse(id).success)
    return responseError("Address ID is invalid.");

  const db = createAdminClient();
  try {
    const { data: existing, error: lookupError } = await db
      .from("addresses")
      .select("id,is_default")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!existing) return responseError("Address not found.", 404);
    const { error } = await db
      .from("addresses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;
    if (existing.is_default) {
      const { data: replacement, error: replacementError } = await db
        .from("addresses")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (replacementError) throw replacementError;
      if (replacement) {
        const { error: defaultError } = await db
          .from("addresses")
          .update({ is_default: true })
          .eq("id", replacement.id);
        if (defaultError) throw defaultError;
      }
    }
    return NextResponse.json({ addresses: await addressList(user.id) });
  } catch (error) {
    return responseError(
      error instanceof Error ? error.message : "Address could not be deleted.",
      500,
    );
  }
}
