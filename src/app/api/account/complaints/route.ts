import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  orderId: z.string().uuid().optional(),
  category: z.string().trim().min(2).max(80),
  priority: z.enum(["normal", "urgent"]),
  subject: z.string().trim().min(5).max(180),
  description: z.string().trim().min(20).max(5000),
});

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json(
      { error: "This support request was blocked." },
      { status: 403 },
    );
  }
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Support is not configured." },
      { status: 503 },
    );
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to contact support." },
      { status: 401 },
    );
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please complete the support form." },
      { status: 400 },
    );
  }
  if (parsed.data.orderId) {
    const { data: order } = await supabase
      .from("orders")
      .select("id")
      .eq("id", parsed.data.orderId)
      .eq("customer_id", user.id)
      .maybeSingle();
    if (!order) {
      return NextResponse.json(
        { error: "That order does not belong to this account." },
        { status: 403 },
      );
    }
  }
  const { data, error } = await supabase
    .from("complaints")
    .insert({
      user_id: user.id,
      order_id: parsed.data.orderId || null,
      category: parsed.data.category,
      priority: parsed.data.priority,
      subject: parsed.data.subject,
      description: parsed.data.description,
    })
    .select("id,status")
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, complaint: data }, { status: 201 });
}
