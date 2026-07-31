import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { can, requireStaff } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const buckets: Record<
  string,
  { permission: string; maxBytes: number; types: string[] }
> = {
  "product-images": {
    permission: "catalog",
    maxBytes: 5 * 1024 * 1024,
    types: ["image/jpeg", "image/png", "image/webp", "image/avif"],
  },
  "brand-logos": {
    permission: "catalog",
    maxBytes: 2 * 1024 * 1024,
    types: ["image/png", "image/webp", "image/svg+xml"],
  },
  "category-images": {
    permission: "catalog",
    maxBytes: 5 * 1024 * 1024,
    types: ["image/jpeg", "image/png", "image/webp"],
  },
  "homepage-banners": {
    permission: "content",
    maxBytes: 8 * 1024 * 1024,
    types: ["image/jpeg", "image/png", "image/webp", "image/avif"],
  },
  "blog-images": {
    permission: "content",
    maxBytes: 5 * 1024 * 1024,
    types: ["image/jpeg", "image/png", "image/webp"],
  },
};

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return error("This upload was blocked.", 403);

  const auth = await requireStaff();
  if ("error" in auth)
    return error(
      auth.error ?? "Access could not be verified.",
      auth.status ?? 500,
    );

  const form = await request.formData();
  const file = form.get("file");
  const bucket = String(form.get("bucket") ?? "");
  const rules = buckets[bucket];
  if (!rules || !can(auth.role, rules.permission))
    return error("Your role cannot upload to this area.", 403);
  if (!(file instanceof File) || file.size === 0)
    return error("Choose an image to upload.", 400);
  if (file.size > rules.maxBytes)
    return error("This image is larger than the allowed limit.", 400);
  if (!rules.types.includes(file.type))
    return error("This image format is not supported.", 400);

  const extension =
    file.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "bin";
  const safeName = file.name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
  const path = `admin/${new Date().toISOString().slice(0, 10)}/${safeName || "image"}-${randomUUID()}.${extension}`;
  const db = createAdminClient();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: uploadError } = await db.storage
    .from(bucket)
    .upload(path, bytes, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });
  if (uploadError) return error(uploadError.message, 500);

  const { data } = db.storage.from(bucket).getPublicUrl(path);
  await db.from("audit_logs").insert({
    actor_id: auth.user.id,
    action: "media.upload",
    entity_type: bucket,
    new_values: { path, size: file.size, mime_type: file.type },
  });
  return NextResponse.json({ path, url: data.publicUrl });
}
