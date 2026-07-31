import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(180),
  phone: z.string().trim().min(10).max(20),
  orderNumber: z.string().trim().max(40).optional(),
  subject: z.string().trim().min(4).max(180),
  category: z.string().trim().min(2).max(80),
  message: z.string().trim().min(20).max(5000),
});

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json(
      { error: "This contact request was blocked." },
      { status: 403 },
    );
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please complete all required contact details." },
      { status: 400 },
    );
  }
  const db = createAdminClient();
  const { error } = await db.from("contact_submissions").insert({
    category: parsed.data.category,
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    order_number: parsed.data.orderNumber || null,
    subject: parsed.data.subject,
    message: parsed.data.message,
  });
  if (error) {
    return NextResponse.json(
      { error: "Your message could not be sent right now." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
