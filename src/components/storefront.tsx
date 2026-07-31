"use client";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  HeartHandshake,
  PackageCheck,
  ShieldCheck,
  Star,
  Truck,
  Zap,
} from "lucide-react";
import { useRef } from "react";
import { brands, categories, products } from "@/lib/data";
import { ProductCard } from "./product-card";
import { StoreLayout } from "./store-layout";

function Section({
  title,
  eyebrow,
  children,
  href = "/deals",
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  href?: string;
}) {
  return (
    <section className="container-shell py-8 sm:py-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          {eyebrow && (
            <p className="mb-1 text-xs font-bold uppercase tracking-[.15em] text-blue-600">
              {eyebrow}
            </p>
          )}
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {title}
          </h2>
        </div>
        <Link
          href={href}
          className="flex shrink-0 items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-800"
        >
          View all <ArrowRight size={16} />
        </Link>
      </div>
      {children}
    </section>
  );
}
function Row({ items = products }: { items?: typeof products }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div className="relative">
      <div
        ref={ref}
        className="scrollbar-hide grid auto-cols-[47%] grid-flow-col gap-3 overflow-x-auto scroll-smooth pb-3 sm:auto-cols-[38%] sm:gap-4 md:auto-cols-[31%] lg:auto-cols-[23.5%] xl:auto-cols-[19%]"
      >
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      <button
        aria-label="Previous products"
        onClick={() =>
          ref.current?.scrollBy({ left: -500, behavior: "smooth" })
        }
        className="absolute -left-4 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full border bg-white shadow-lg hover:text-blue-600 lg:grid"
      >
        <ChevronLeft />
      </button>
      <button
        aria-label="Next products"
        onClick={() => ref.current?.scrollBy({ left: 500, behavior: "smooth" })}
        className="absolute -right-4 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full border bg-white shadow-lg hover:text-blue-600 lg:grid"
      >
        <ChevronRight />
      </button>
    </div>
  );
}

export function Storefront() {
  return (
    <StoreLayout>
      <section className="relative isolate overflow-hidden bg-slate-950">
        <div className="container-shell relative min-h-[480px] py-14 sm:min-h-[520px] sm:py-20">
          <Image
            src="/images/voltixa-hero.png"
            alt="Premium unbranded electronics arranged on a neon-lit platform"
            fill
            priority
            sizes="100vw"
            className="absolute inset-0 -z-10 object-cover object-center"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950 via-slate-950/82 to-transparent" />
          <div className="max-w-xl pt-5 text-white sm:pt-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold text-cyan-300">
              <Zap size={14} fill="currentColor" /> VOLT WEEK 2026
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-[-.04em] sm:text-6xl">
              Fresh tech.
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                Fully charged.
              </span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-slate-300 sm:text-lg">
              Discover authentic electronics with official warranty, helpful
              advice and delivery across Pakistan.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/deals"
                className="flex h-12 items-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold shadow-lg shadow-blue-900/40 hover:bg-blue-500"
              >
                Shop Volt Week <ArrowRight size={17} />
              </Link>
              <Link
                href="/mobile-finder"
                className="flex h-12 items-center rounded-xl border border-white/25 bg-white/10 px-6 text-sm font-bold backdrop-blur hover:bg-white/20"
              >
                Find my phone
              </Link>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <BadgeCheck size={15} className="text-cyan-400" /> Authentic
                products
              </span>
              <span className="flex items-center gap-1.5">
                <Truck size={15} className="text-cyan-400" /> Nationwide
                delivery
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-cyan-400" /> Official
                warranty
              </span>
            </div>
          </div>
        </div>
      </section>
      <section className="border-b border-slate-200 bg-white">
        <div className="scrollbar-hide container-shell grid auto-cols-[78%] grid-flow-col gap-3 overflow-x-auto py-4 sm:auto-cols-[44%] md:grid-flow-row md:grid-cols-5 md:gap-4 md:overflow-visible md:py-5">
          {[
            [BadgeCheck, "100% authentic", "Verified supply"],
            [ShieldCheck, "Official warranty", "Shop with confidence"],
            [CircleDollarSign, "Secure payments", "Protected checkout"],
            [Truck, "Fast delivery", "Across Pakistan"],
            [HeartHandshake, "Human support", "We’re here to help"],
          ].map(([Icon, title, sub]) => (
            <div
              key={title as string}
              className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 md:border-0 md:bg-transparent md:p-0"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <Icon size={20} />
              </span>
              <span>
                <strong className="block text-xs sm:text-sm">
                  {title as string}
                </strong>
                <small className="text-[10px] text-slate-500 sm:text-xs">
                  {sub as string}
                </small>
              </span>
            </div>
          ))}
        </div>
      </section>
      <Section title="Browse categories" eyebrow="Find your next upgrade">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12">
          {categories.map(([slug, label, image]) => (
            <Link
              key={slug}
              href={`/category/${slug}`}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2.5 pb-3 text-center shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
            >
              <span className="relative aspect-square w-full overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-blue-50">
                <Image
                  src={image}
                  alt={label}
                  fill
                  sizes="(max-width: 640px) 30vw, 110px"
                  className="object-contain p-1.5 transition duration-500 group-hover:scale-110"
                />
              </span>
              <strong className="text-[11px] leading-tight sm:text-xs">
                {label}
              </strong>
            </Link>
          ))}
        </div>
      </Section>
      <div className="bg-[#eef6ff]">
        <Section title="Flash deals" eyebrow="Ends tonight">
          <div className="mb-5 flex items-center gap-2 text-sm">
            <span className="font-semibold text-slate-600">
              Hurry, prices reset in
            </span>
            {["08", "24", "51"].map((x, i) => (
              <span
                key={i}
                className="rounded-lg bg-slate-950 px-2.5 py-1.5 font-mono font-bold text-white"
              >
                {x}
              </span>
            ))}
          </div>
          <Row items={products.slice(3, 9)} />
        </Section>
      </div>
      <Section title="Customer favourites" eyebrow="Best sellers">
        <Row items={products.filter((p) => p.rating >= 4.7)} />
      </Section>
      <section className="container-shell py-5">
        <div className="grid overflow-hidden rounded-3xl bg-slate-950 text-white md:grid-cols-[1.1fr_.9fr]">
          <div className="p-8 sm:p-12">
            <span className="text-xs font-bold uppercase tracking-[.2em] text-cyan-400">
              Smart recommendations
            </span>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              A phone that fits your life, not just your budget.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300">
              Answer seven simple questions. Volt Finder ranks matches and
              explains exactly why they work for you.
            </p>
            <Link
              href="/mobile-finder"
              className="mt-7 inline-flex h-12 items-center gap-2 rounded-xl bg-cyan-500 px-6 text-sm font-bold text-slate-950 hover:bg-cyan-400"
            >
              Start Volt Finder <ArrowRight size={17} />
            </Link>
          </div>
          <div className="relative min-h-72 overflow-hidden bg-gradient-to-br from-blue-600 to-cyan-400">
            <div className="absolute inset-7 overflow-hidden rounded-[2rem] bg-white/95 shadow-2xl">
              <Image
                src="/images/products/nova-x1-pro-5g.webp"
                alt="Samsung Galaxy A56 5G"
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-contain p-3"
              />
            </div>
            <div className="absolute left-6 top-8 rounded-xl bg-white p-3 text-xs font-bold text-slate-950 shadow-xl">
              Great camera ✓
            </div>
            <div className="absolute bottom-10 right-6 rounded-xl bg-slate-950 p-3 text-xs font-bold text-white shadow-xl">
              All-day battery ✓
            </div>
          </div>
        </div>
      </section>
      <Section
        title="Latest mobiles"
        eyebrow="Just landed"
        href="/category/mobile-phones"
      >
        <Row items={products.filter((p) => p.category === "mobile-phones")} />
      </Section>
      <div className="bg-white">
        <Section
          title="Sound, simplified"
          eyebrow="Audio essentials"
          href="/category/audio"
        >
          <Row items={products.filter((p) => p.category === "audio")} />
        </Section>
      </div>
      <Section title="Shop by brand" eyebrow="Names you can trust">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {brands.map((brand) => (
            <Link
              key={brand}
              href={`/brand/${brand
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "")}`}
              className="flex h-24 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-black tracking-tight text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600 hover:shadow-lg"
            >
              <span className="mr-2 grid size-8 place-items-center rounded-lg bg-slate-950 text-xs text-white">
                {brand[0]}
              </span>
              <span className="min-w-0 truncate text-sm sm:text-base">
                {brand}
              </span>
            </Link>
          ))}
        </div>
      </Section>
      <section className="container-shell py-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="flex gap-1 text-amber-500">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={18} fill="currentColor" />
                ))}
              </div>
              <blockquote className="mt-4 max-w-2xl text-xl font-bold leading-relaxed sm:text-2xl">
                “The product details were clear, delivery updates were timely,
                and the earbuds arrived properly sealed.”
              </blockquote>
              <p className="mt-4 text-sm text-slate-500">
                <strong className="text-slate-900">Areeba K.</strong> · Verified
                demo review
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-6 text-center">
              <PackageCheck className="mx-auto text-emerald-600" size={32} />
              <strong className="mt-2 block">Verified purchases</strong>
              <span className="text-xs text-emerald-700">
                Only delivered orders qualify
              </span>
            </div>
          </div>
        </div>
      </section>
    </StoreLayout>
  );
}
