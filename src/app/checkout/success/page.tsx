import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, PackageSearch } from "lucide-react";
import { Brand } from "@/components/brand";
import { createClient } from "@/lib/supabase/server";

export default async function Success({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const q = await searchParams;
  const supabase = await createClient();
  if (!supabase) redirect("/login?next=/account/orders");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/orders");
  const { data: order } = q.order
    ? await supabase
        .from("orders")
        .select("order_number,grand_total,status,payment_status,payment_method")
        .eq("customer_id", user.id)
        .eq("order_number", q.order)
        .maybeSingle()
    : { data: null };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <div className="w-full max-w-lg rounded-3xl border bg-white p-8 text-center shadow-xl shadow-slate-200/60 sm:p-12">
        <Brand />
        <CheckCircle2 className="mx-auto mt-9 text-emerald-500" size={64} />
        <h1 className="mt-5 text-3xl font-extrabold">Order received</h1>
        <p className="mt-3 text-slate-600">
          Thanks! We’ll verify the details and send updates as your order moves.
        </p>
        <div className="mt-6 rounded-2xl bg-slate-50 p-5">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Order number
          </span>
          <strong className="mt-1 block text-xl">
            {order?.order_number ?? "Order not found"}
          </strong>
          {order && (
            <>
              <span className="mt-2 block text-sm font-bold text-slate-700">
                Rs {Number(order.grand_total).toLocaleString("en-PK")}
              </span>
              <span className="mt-1 block text-xs capitalize text-emerald-700">
                {order.status.replaceAll("_", " ")} · Payment{" "}
                {order.payment_status.replaceAll("_", " ")}
              </span>
            </>
          )}
        </div>
        {order?.payment_method === "bank" && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left text-sm leading-6 text-amber-900">
            <strong>Bank transfer verification pending</strong>
            <p>
              Keep your order number ready. Our support team will confirm the
              official bank details and verify your transfer before processing.
            </p>
          </div>
        )}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link
            href={
              order
                ? `/track-order?order=${encodeURIComponent(order.order_number)}`
                : "/account/orders"
            }
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white"
          >
            <PackageSearch size={18} /> Track order
          </Link>
          <Link
            href="/account/orders"
            className="flex h-12 items-center justify-center rounded-xl border text-sm font-bold"
          >
            My orders
          </Link>
        </div>
      </div>
    </main>
  );
}
