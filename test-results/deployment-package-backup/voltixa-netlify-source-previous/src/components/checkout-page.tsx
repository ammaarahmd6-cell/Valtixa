"use client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  LockKeyhole,
  MapPin,
  PackageCheck,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { checkoutSchema, type CheckoutInput } from "@/lib/validation";
import { useShop } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import { Brand } from "./brand";

type CheckoutInitialValues = Partial<
  Pick<
    CheckoutInput,
    | "fullName"
    | "email"
    | "phone"
    | "province"
    | "city"
    | "area"
    | "address"
    | "postalCode"
  >
>;

export function CheckoutPage({
  initialValues = {},
}: {
  initialValues?: CheckoutInitialValues;
}) {
  const router = useRouter(),
    { cart, clearCart } = useShop(),
    step = 1,
    subtotal = cart.reduce((s, x) => s + x.product.price * x.quantity, 0),
    shipping = subtotal >= 5000 ? 0 : 250;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      ...initialValues,
      payment: "cod",
      items: cart.map((x) => ({
        variantId: x.variantId,
        quantity: x.quantity,
      })),
      idempotencyKey: crypto.randomUUID(),
    },
  });
  async function submit(data: CheckoutInput) {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        items: cart.map((x) => ({
          variantId: x.variantId,
          quantity: x.quantity,
        })),
      }),
    });
    const out = await res.json();
    if (!res.ok) {
      toast.error(out.error);
      if (res.status === 401) {
        router.push("/login?next=/checkout");
      }
      return;
    }
    sessionStorage.setItem("voltixa-last-order", JSON.stringify(out));
    clearCart();
    router.push(
      `/checkout/success?order=${encodeURIComponent(out.orderNumber)}`,
    );
  }
  const input =
    "mt-1.5 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm focus:border-blue-500";
  if (!cart.length)
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center">
        <div>
          <Brand />
          <PackageCheck className="mx-auto mt-10 text-blue-600" size={48} />
          <h1 className="mt-4 text-2xl font-extrabold">Your cart is empty</h1>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-blue-600 px-6 py-3 font-bold text-white"
          >
            Return to store
          </Link>
        </div>
      </div>
    );
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="container-shell flex h-16 items-center justify-between sm:h-20">
          <div className="sm:hidden">
            <Brand compact />
          </div>
          <div className="hidden sm:block">
            <Brand />
          </div>
          <span className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
            <LockKeyhole size={16} /> Secure checkout
          </span>
        </div>
      </header>
      <main className="container-shell py-5 sm:py-8">
        <Link
          href="/cart"
          className="flex items-center gap-1 text-sm font-bold text-slate-600"
        >
          <ChevronLeft size={17} /> Back to cart
        </Link>
        <div className="mt-6 flex max-w-2xl items-center gap-2">
          {["Information", "Delivery", "Payment", "Review"].map((x, i) => (
            <div key={x} className="flex flex-1 items-center gap-2">
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${step > i + 1 ? "bg-emerald-500 text-white" : step === i + 1 ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"}`}
              >
                {step > i + 1 ? <Check size={14} /> : i + 1}
              </span>
              <span className="hidden text-xs font-bold sm:block">{x}</span>
              {i < 3 && <span className="h-px flex-1 bg-slate-200" />}
            </div>
          ))}
        </div>
        <form
          onSubmit={handleSubmit(submit)}
          className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]"
        >
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <MapPin size={20} />
              </span>
              <div>
                <h1 className="text-xl font-extrabold">Delivery details</h1>
                <p className="text-xs text-slate-500">
                  Where should we send your order?
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={errors.fullName?.message}>
                <input {...register("fullName")} className={input} />
              </Field>
              <Field label="Mobile number" error={errors.phone?.message}>
                <input
                  {...register("phone")}
                  placeholder="03XX XXXXXXX"
                  className={input}
                />
              </Field>
              <Field label="Email" error={errors.email?.message}>
                <input {...register("email")} type="email" className={input} />
              </Field>
              <Field label="Province" error={errors.province?.message}>
                <select {...register("province")} className={input}>
                  <option value="">Select province</option>
                  {[
                    "Sindh",
                    "Punjab",
                    "Khyber Pakhtunkhwa",
                    "Balochistan",
                    "Islamabad Capital Territory",
                    "Gilgit-Baltistan",
                    "Azad Kashmir",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
              <Field label="City" error={errors.city?.message}>
                <input {...register("city")} className={input} />
              </Field>
              <Field label="Area" error={errors.area?.message}>
                <input {...register("area")} className={input} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Complete address" error={errors.address?.message}>
                  <textarea
                    {...register("address")}
                    rows={3}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 p-4 text-sm focus:border-blue-500"
                  />
                </Field>
              </div>
              <Field
                label="Postal code (optional)"
                error={errors.postalCode?.message}
              >
                <input {...register("postalCode")} className={input} />
              </Field>
            </div>
            <div className="mt-7">
              <h2 className="font-bold">Payment method</h2>
              <label className="mt-3 flex cursor-pointer gap-3 rounded-xl border-2 border-blue-600 bg-blue-50 p-4">
                <input
                  {...register("payment")}
                  value="cod"
                  type="radio"
                  className="accent-blue-600"
                />
                <span>
                  <strong className="block text-sm">Cash on Delivery</strong>
                  <small className="text-slate-500">
                    Pay when your parcel arrives
                  </small>
                </span>
              </label>
              <label className="mt-2 flex cursor-pointer gap-3 rounded-xl border border-slate-200 p-4">
                <input
                  {...register("payment")}
                  value="bank"
                  type="radio"
                  className="accent-blue-600"
                />
                <span>
                  <strong className="block text-sm">Bank transfer</strong>
                  <small className="text-slate-500">
                    Instructions sent after confirmation
                  </small>
                </span>
              </label>
            </div>
            {Object.keys(errors).length > 0 && (
              <div className="mt-5 flex gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle size={18} />
                <span>Please review the highlighted fields.</span>
              </div>
            )}
          </section>
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 lg:sticky lg:top-6">
            <h2 className="text-lg font-extrabold">Order summary</h2>
            <div className="mt-4 max-h-52 space-y-3 overflow-y-auto">
              {cart.map((x) => (
                <div
                  key={x.variantId}
                  className="flex justify-between gap-3 text-sm"
                >
                  <span className="line-clamp-2">
                    {x.quantity}× {x.product.name}
                  </span>
                  <strong className="shrink-0">
                    {formatPrice(x.product.price * x.quantity)}
                  </strong>
                </div>
              ))}
            </div>
            <div className="my-5 border-t" />
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <strong>{shipping ? formatPrice(shipping) : "Free"}</strong>
              </div>
              <div className="flex justify-between border-t pt-4 text-lg">
                <strong>Total</strong>
                <strong>{formatPrice(subtotal + shipping)}</strong>
              </div>
            </div>
            <button
              disabled={isSubmitting}
              className="mt-5 h-12 w-full rounded-xl bg-blue-600 font-bold text-white disabled:bg-slate-300"
            >
              {isSubmitting ? "Creating order…" : "Place COD order"}
            </button>
            <p className="mt-3 text-center text-[11px] leading-4 text-slate-500">
              By ordering, you agree to Voltixa’s terms and returns policy.
            </p>
          </aside>
        </form>
      </main>
    </div>
  );
}
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs font-bold">
      {label}
      {children}
      {error && (
        <span className="mt-1 block font-medium text-red-600">{error}</span>
      )}
    </label>
  );
}
