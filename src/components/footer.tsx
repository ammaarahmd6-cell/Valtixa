"use client";
import Link from "next/link";
import {
  ArrowUp,
  Camera,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { Brand } from "./brand";

const groups = [
  [
    "Customer care",
    [
      ["Help centre", "/help"],
      ["Track order", "/track-order"],
      ["Returns & refunds", "/returns-refunds"],
      ["Warranty centre", "/warranty-center"],
      ["Contact us", "/contact"],
    ],
  ],
  [
    "Shop",
    [
      ["Mobiles", "/category/mobile-phones"],
      ["Laptops", "/category/laptops"],
      ["Smart watches", "/category/smartwatches"],
      ["Deals", "/deals"],
      ["Mobile finder", "/mobile-finder"],
    ],
  ],
  [
    "Voltixa",
    [
      ["About us", "/about"],
      ["Buying guides", "/blog"],
      ["Privacy policy", "/privacy-policy"],
      ["Terms & conditions", "/terms-and-conditions"],
      ["Installments", "/installments"],
    ],
  ],
] as const;
export function Footer() {
  async function subscribe(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.get("email") }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.error || "Subscription failed.");
      toast.success("You’re on the Volt List!");
      form.reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Subscription failed.",
      );
    }
  }
  return (
    <footer className="mt-12 bg-slate-950 pb-[calc(5rem+env(safe-area-inset-bottom))] text-slate-300 sm:mt-16 md:pb-0">
      <div className="border-b border-white/10 bg-gradient-to-r from-blue-700 to-cyan-600">
        <div className="container-shell flex flex-col items-start justify-between gap-5 py-8 text-white md:flex-row md:items-center">
          <div>
            <h3 className="text-2xl font-extrabold">Join the Volt List</h3>
            <p className="mt-1 text-sm text-blue-50">
              Fresh launches, helpful guides and genuinely good deals.
            </p>
          </div>
          <form
            onSubmit={subscribe}
            className="flex w-full max-w-lg overflow-hidden rounded-xl bg-white p-1"
          >
            <Mail className="ml-3 self-center text-slate-400" size={18} />
            <input
              name="email"
              required
              type="email"
              aria-label="Email for newsletter"
              placeholder="Your email address"
              className="min-w-0 flex-1 px-3 text-sm text-slate-900 outline-none"
            />
            <button className="rounded-lg bg-slate-950 px-3 py-3 text-xs font-bold sm:px-5 sm:text-sm">
              <span className="sm:hidden">Join</span>
              <span className="hidden sm:inline">Subscribe</span>
            </button>
          </form>
        </div>
      </div>
      <div className="container-shell grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Brand inverse />
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">
            Powering Your Digital Lifestyle with authentic electronics,
            dependable support and nationwide delivery.
          </p>
          <div className="mt-5 space-y-3 text-sm">
            <p className="flex gap-2">
              <Phone size={17} className="text-cyan-400" /> 021-111-VOLTIXA
            </p>
            <p className="flex gap-2">
              <Mail size={17} className="text-cyan-400" /> help@voltixa.pk
            </p>
            <p className="flex gap-2">
              <MapPin size={17} className="text-cyan-400" /> Karachi, Pakistan
            </p>
          </div>
          <div className="mt-5 flex gap-2">
            {[MessageCircle, Camera, Video].map((Icon, i) => (
              <button
                key={i}
                aria-label={["Community", "Photos", "Videos"][i]}
                title={["Community", "Photos", "Videos"][i]}
                className="grid size-10 place-items-center rounded-full bg-white/10 hover:bg-blue-600"
              >
                <Icon size={18} />
              </button>
            ))}
          </div>
        </div>
        {groups.map(([title, links]) => (
          <div key={title}>
            <h4 className="font-bold text-white">{title}</h4>
            <ul className="mt-4 space-y-3 text-sm">
              {links.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="hover:text-cyan-400">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container-shell flex flex-col justify-between gap-4 py-6 text-xs text-slate-500 sm:flex-row">
          <p>
            © {new Date().getFullYear()} Voltixa. All rights reserved. Made By
            Ammar
          </p>
          <div className="flex gap-3">
            <span className="rounded border border-white/10 px-2 py-1">
              Neelsol.com
            </span>
            <span className="rounded border border-white/10 px-2 py-1">
              TCS
            </span>
            <span className="rounded border border-white/10 px-2 py-1">
              Leopards
            </span>
          </div>
        </div>
      </div>
      <button
        onClick={() => scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
        title="Back to top"
        className="fixed bottom-20 right-4 z-30 grid size-11 place-items-center rounded-full bg-slate-950 text-white shadow-xl hover:bg-blue-600 md:bottom-5"
      >
        <ArrowUp size={19} />
      </button>
    </footer>
  );
}
