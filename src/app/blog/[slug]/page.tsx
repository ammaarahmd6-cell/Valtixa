import Link from "next/link";
import { StoreLayout } from "@/components/store-layout";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const title = slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <StoreLayout>
      <article className="container-shell py-12">
        <Link href="/blog" className="text-sm font-bold text-blue-600">
          ← All guides
        </Link>
        <div className="mt-6 max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-[.2em] text-blue-600">
            Voltixa buying guide
          </span>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-sm text-slate-500">
            8 minute read · Voltixa Editorial
          </p>
          <div className="mt-8 space-y-5 text-lg leading-8 text-slate-600">
            <p>
              Good technology choices start with your real needs, not a
              specification race. Focus first on how you use a device every day,
              then decide which features deserve more of your budget.
            </p>
            <h2 className="text-2xl font-extrabold text-slate-950">
              Start with the essentials
            </h2>
            <p>
              Compare warranty coverage, service availability, battery
              expectations and the total cost of useful accessories. A balanced
              product often creates a better experience than the model with one
              headline feature.
            </p>
            <h2 className="text-2xl font-extrabold text-slate-950">
              Make an informed shortlist
            </h2>
            <p>
              Use Voltixa comparison tools to place verified specifications side
              by side, and check availability for the exact configuration you
              intend to buy.
            </p>
          </div>
        </div>
      </article>
    </StoreLayout>
  );
}
