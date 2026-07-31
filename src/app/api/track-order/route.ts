import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  orderNumber: z
    .string()
    .trim()
    .regex(/^VLX-\d{4}-\d{8}$/i),
  verification: z.string().trim().min(5).max(160),
});

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "").replace(/^92/, "0");
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json(
      { error: "This tracking request was blocked." },
      { status: 403 },
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid order number and checkout email or phone." },
      { status: 400 },
    );
  }

  const db = createAdminClient();
  const { data: order, error } = await db
    .from("orders")
    .select(
      "order_number,status,payment_status,payment_method,created_at,address_snapshot,shipments(courier,tracking_number,tracking_url,status,updated_at)",
    )
    .eq("order_number", parsed.data.orderNumber.toUpperCase())
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Tracking is temporarily unavailable." },
      { status: 500 },
    );
  }

  const address =
    order?.address_snapshot &&
    typeof order.address_snapshot === "object" &&
    !Array.isArray(order.address_snapshot)
      ? (order.address_snapshot as Record<string, unknown>)
      : {};
  const supplied = parsed.data.verification.toLowerCase();
  const email = String(address.email ?? "").toLowerCase();
  const phone = normalizePhone(String(address.phone ?? ""));
  const verified =
    !!order &&
    (supplied === email || normalizePhone(parsed.data.verification) === phone);

  if (!verified || !order) {
    return NextResponse.json(
      { error: "No matching order was found for those verification details." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    orderNumber: order.order_number,
    status: order.status,
    paymentStatus: order.payment_status,
    paymentMethod: order.payment_method,
    createdAt: order.created_at,
    shipments: order.shipments ?? [],
  });
}
