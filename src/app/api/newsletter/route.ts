import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ email: z.email().max(180) });

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json(
      { error: "This subscription request was blocked." },
      { status: 403 },
    );
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  }
  const db = createAdminClient();
  const { error } = await db
    .from("newsletter_subscribers")
    .upsert(
      { email: parsed.data.email, status: "subscribed" },
      { onConflict: "email" },
    );
  if (error) {
    return NextResponse.json(
      { error: "Subscription could not be saved." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
