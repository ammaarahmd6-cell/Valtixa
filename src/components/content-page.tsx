"use client";
import Link from "next/link";
import {
  ChevronDown,
  Clock3,
  Mail,
  MapPin,
  PackageSearch,
  Phone,
  Search,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { faqs } from "@/lib/data";
import { StoreLayout } from "./store-layout";

const content: Record<string, { title: string; kicker: string; body: string }> =
  {
    about: {
      title: "Technology, made easier",
      kicker: "About Voltixa",
      body: "Voltixa is an original electronics retail experience built for Pakistan. We bring transparent product information, dependable warranty guidance and thoughtful support together—so choosing technology feels clear, not complicated.",
    },
    "returns-refunds": {
      title: "Returns & refunds",
      kicker: "Shop with confidence",
      body: "Request an eligible return from your account. Items must meet the return window and condition requirements shown on the product and order pages. Refund timing depends on inspection and the original payment method.",
    },
    "shipping-policy": {
      title: "Shipping policy",
      kicker: "Nationwide delivery",
      body: "Orders are verified before dispatch and delivered through serviceable courier networks across Pakistan. Estimated timing depends on your city, inventory location and public holidays.",
    },
    installments: {
      title: "Flexible ways to pay",
      kicker: "Installment plans",
      body: "Eligible cards and partner plans can spread the cost of selected products. Final eligibility, markup and schedule are confirmed by the payment provider before the order is marked paid.",
    },
    "warranty-center": {
      title: "Warranty that stays clear",
      kicker: "Warranty centre",
      body: "Register eligible products, keep digital certificates and start a claim from your account. Manufacturer and distributor warranty terms vary by product and are shown before purchase.",
    },
    "privacy-policy": {
      title: "Your privacy matters",
      kicker: "Privacy policy",
      body: "Voltixa collects only the information needed to provide purchases, delivery, support and account services. Private records are protected through server-side authorization and database row-level security.",
    },
    "terms-and-conditions": {
      title: "Terms & conditions",
      kicker: "Using Voltixa",
      body: "These terms govern purchases, accounts, promotions and platform use. Product availability and pricing are confirmed server-side when an order is placed.",
    },
    help: {
      title: "How can we help?",
      kicker: "Voltixa support",
      body: "Find answers, track an order, start a complaint or reach our support team. We keep every support request attached to a clear status timeline.",
    },
  };
export function ContentPage({ slug }: { slug: string }) {
  if (slug === "track-order") return <TrackOrder />;
  if (slug === "contact") return <Contact />;
  if (slug === "faqs") return <Faq />;
  if (slug === "blog") return <Blog />;
  const c = content[slug] ?? {
    title: slug.replace(/-/g, " ").replace(/\b\w/g, (x) => x.toUpperCase()),
    kicker: "Voltixa",
    body: "This page is managed from the Voltixa content system. Connect Supabase to publish and schedule production content.",
  };
  return (
    <StoreLayout>
      <section className="bg-slate-950 py-16 text-white">
        <div className="container-shell">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-400">
            {c.kicker}
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            {c.title}
          </h1>
        </div>
      </section>
      <div className="container-shell py-10">
        <div className="max-w-3xl rounded-2xl border bg-white p-7 sm:p-10">
          <p className="text-lg leading-8 text-slate-600">{c.body}</p>
          <h2 className="mt-8 text-2xl font-extrabold">What you can expect</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <li>Clear policies written in straightforward language.</li>
            <li>
              Secure account tools for requests involving personal information.
            </li>
            <li>Status updates and a complete history for service requests.</li>
          </ul>
        </div>
      </div>
    </StoreLayout>
  );
}
function TrackOrder() {
  const [result, setResult] = useState<{
    orderNumber: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    createdAt: string;
    shipments: {
      courier: string | null;
      trackingNumber?: string | null;
      tracking_number?: string | null;
      trackingUrl?: string | null;
      tracking_url?: string | null;
      status: string;
    }[];
  }>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function track(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(undefined);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/track-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: form.get("orderNumber"),
          verification: form.get("verification"),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Tracking failed.");
      setResult(payload);
    } catch (trackError) {
      setError(
        trackError instanceof Error ? trackError.message : "Tracking failed.",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <StoreLayout>
      <div className="container-shell py-12">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-50 text-blue-600">
            <PackageSearch size={26} />
          </span>
          <h1 className="mt-5 text-4xl font-extrabold">Track your order</h1>
          <p className="mt-2 text-sm text-slate-500">
            Enter the order number and the phone or email used at checkout.
          </p>
        </div>
        <form
          onSubmit={track}
          className="mx-auto mt-8 max-w-2xl rounded-2xl border bg-white p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-bold">
              Order number
              <input
                name="orderNumber"
                required
                defaultValue={
                  typeof window !== "undefined"
                    ? (new URLSearchParams(location.search).get("order") ?? "")
                    : ""
                }
                placeholder="VLX-2026-XXXXXXXX"
                className="mt-2 h-12 w-full rounded-xl border px-4 text-sm"
              />
            </label>
            <label className="text-xs font-bold">
              Phone or email
              <input
                name="verification"
                required
                placeholder="Verification detail"
                className="mt-2 h-12 w-full rounded-xl border px-4 text-sm"
              />
            </label>
          </div>
          <button
            disabled={loading}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 font-bold text-white disabled:bg-slate-400"
          >
            <Search size={17} /> {loading ? "Checking…" : "Track securely"}
          </button>
        </form>
        {error && (
          <div className="mx-auto mt-5 max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            <strong>{error}</strong>
          </div>
        )}
        {result && (
          <div className="mx-auto mt-5 max-w-2xl rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-950">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase text-emerald-700">
                  Order
                </span>
                <strong className="block text-lg">{result.orderNumber}</strong>
              </div>
              <span className="rounded-full bg-white px-3 py-1 font-bold capitalize">
                {result.status.replaceAll("_", " ")}
              </span>
            </div>
            <div className="mt-4 grid gap-3 rounded-xl bg-white p-4 sm:grid-cols-2">
              <p>
                <span className="block text-xs text-slate-500">Payment</span>
                <strong className="capitalize">
                  {result.paymentMethod.replaceAll("_", " ")} ·{" "}
                  {result.paymentStatus.replaceAll("_", " ")}
                </strong>
              </p>
              <p>
                <span className="block text-xs text-slate-500">Placed</span>
                <strong>
                  {new Date(result.createdAt).toLocaleDateString("en-PK")}
                </strong>
              </p>
            </div>
            {result.shipments.map((shipment, index) => (
              <div key={index} className="mt-3 rounded-xl bg-white p-4">
                <strong className="capitalize">
                  {shipment.status.replaceAll("_", " ")}
                </strong>
                <p className="mt-1 text-slate-600">
                  {shipment.courier || "Courier pending"}
                  {(shipment.trackingNumber || shipment.tracking_number) &&
                    ` · ${shipment.trackingNumber || shipment.tracking_number}`}
                </p>
                {(shipment.trackingUrl || shipment.tracking_url) && (
                  <a
                    href={shipment.trackingUrl || shipment.tracking_url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block font-bold text-blue-600"
                  >
                    Open courier tracking
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
function Contact() {
  const [sending, setSending] = useState(false);
  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          orderNumber: form.get("orderNumber"),
          subject: form.get("subject"),
          category: form.get("category"),
          message: form.get("message"),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Message failed.");
      toast.success("Your message has been sent to support.");
      formElement.reset();
    } catch (sendError) {
      toast.error(
        sendError instanceof Error ? sendError.message : "Message failed.",
      );
    } finally {
      setSending(false);
    }
  }
  return (
    <StoreLayout>
      <div className="container-shell grid gap-8 py-12 lg:grid-cols-[.7fr_1.3fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-600">
            Talk to a human
          </p>
          <h1 className="mt-3 text-4xl font-extrabold">We’re here to help</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Send us the details and our support team will respond during
            business hours.
          </p>
          <div className="mt-8 space-y-4 text-sm">
            <p className="flex gap-3">
              <Phone className="text-blue-600" size={19} /> 021-111-VOLTIXA
            </p>
            <p className="flex gap-3">
              <Mail className="text-blue-600" size={19} /> help@voltixa.pk
            </p>
            <p className="flex gap-3">
              <MapPin className="text-blue-600" size={19} /> Karachi, Pakistan
            </p>
            <p className="flex gap-3">
              <Clock3 className="text-blue-600" size={19} /> Mon–Sat, 9am–7pm
              PKT
            </p>
          </div>
        </div>
        <form
          onSubmit={send}
          className="rounded-2xl border bg-white p-6 sm:p-8"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              "Name",
              "Email",
              "Phone",
              "Order number (optional)",
              "Subject",
            ].map((x, i) => (
              <label
                key={x}
                className={`text-xs font-bold ${x === "Subject" ? "sm:col-span-2" : ""}`}
              >
                {x}
                <input
                  name={["name", "email", "phone", "orderNumber", "subject"][i]}
                  required={i < 3 || x === "Subject"}
                  type={x === "Email" ? "email" : "text"}
                  className="mt-2 h-11 w-full rounded-xl border px-3 text-sm"
                />
              </label>
            ))}
            <label className="text-xs font-bold sm:col-span-2">
              Inquiry category
              <select
                name="category"
                className="mt-2 h-11 w-full rounded-xl border px-3 text-sm"
              >
                <option>Order support</option>
                <option>Product information</option>
                <option>Return or warranty</option>
                <option>Partnership</option>
              </select>
            </label>
            <label className="text-xs font-bold sm:col-span-2">
              Message
              <textarea
                name="message"
                required
                minLength={20}
                rows={5}
                className="mt-2 w-full rounded-xl border p-3 text-sm"
              />
            </label>
          </div>
          <button
            disabled={sending}
            className="mt-5 flex h-12 items-center gap-2 rounded-xl bg-blue-600 px-6 font-bold text-white disabled:bg-slate-400"
          >
            <Send size={17} /> {sending ? "Sending…" : "Send message"}
          </button>
        </form>
      </div>
    </StoreLayout>
  );
}
function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <StoreLayout>
      <div className="container-shell py-12">
        <div className="mx-auto max-w-3xl">
          <p className="text-center text-xs font-bold uppercase tracking-[.2em] text-blue-600">
            Quick answers
          </p>
          <h1 className="mt-3 text-center text-4xl font-extrabold">
            Frequently asked questions
          </h1>
          <div className="mt-8 space-y-3">
            {faqs.map(([q, a], i) => (
              <div
                key={q}
                className="overflow-hidden rounded-2xl border bg-white"
              >
                <button
                  onClick={() => setOpen(open === i ? -1 : i)}
                  className="flex w-full items-center justify-between p-5 text-left font-bold"
                >
                  {q}
                  <ChevronDown
                    className={`transition ${open === i ? "rotate-180" : ""}`}
                    size={18}
                  />
                </button>
                {open === i && (
                  <p className="border-t px-5 py-4 text-sm leading-6 text-slate-600">
                    {a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
function Blog() {
  const posts = [
    [
      "How to choose the right phone in 2026",
      "A practical framework for balancing budget, camera, battery and long-term updates.",
      "phone-buying-guide",
    ],
    [
      "GaN charging, explained simply",
      "Why a smaller charger can safely power your phone, tablet and laptop.",
      "gan-charging-guide",
    ],
    [
      "What an official warranty really covers",
      "The questions worth asking before your next electronics purchase.",
      "warranty-explained",
    ],
  ];
  return (
    <StoreLayout>
      <div className="container-shell py-12">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-600">
          Voltixa guides
        </p>
        <h1 className="mt-3 text-4xl font-extrabold">
          Buy smarter. Use tech better.
        </h1>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {posts.map(([title, desc, slug], i) => (
            <Link
              key={slug}
              href={`/blog/${slug}`}
              className="group overflow-hidden rounded-2xl border bg-white"
            >
              <div
                className={`h-44 bg-gradient-to-br ${i === 0 ? "from-blue-600 to-cyan-400" : i === 1 ? "from-slate-950 to-blue-700" : "from-cyan-600 to-emerald-400"} p-6 text-white`}
              >
                <ShieldCheck size={34} />
              </div>
              <div className="p-5">
                <span className="text-xs font-bold uppercase text-blue-600">
                  Buying guide
                </span>
                <h2 className="mt-2 text-xl font-extrabold group-hover:text-blue-600">
                  {title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </StoreLayout>
  );
}
