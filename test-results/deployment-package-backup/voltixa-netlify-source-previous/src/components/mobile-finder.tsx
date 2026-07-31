"use client";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { products } from "@/lib/data";
import { ProductCard } from "./product-card";
import { StoreLayout } from "./store-layout";
const steps = [
  {
    key: "budget",
    title: "What’s your budget?",
    subtitle: "We’ll keep every recommendation inside your comfort zone.",
    options: ["Under Rs. 50,000", "Rs. 50,000–90,000", "Above Rs. 90,000"],
  },
  {
    key: "brand",
    title: "Any brand preference?",
    subtitle: "Choose one, or keep your options open.",
    options: ["No preference", "Samsung", "Xiaomi", "Infinix"],
  },
  {
    key: "focus",
    title: "What matters most?",
    subtitle: "We’ll give this feature extra weight.",
    options: [
      "Camera quality",
      "Long battery life",
      "Gaming performance",
      "Display quality",
    ],
  },
  {
    key: "memory",
    title: "How much storage do you need?",
    subtitle: "Think about photos, apps and offline media.",
    options: ["128GB is enough", "256GB sweet spot", "512GB or more"],
  },
  {
    key: "camera",
    title: "Your camera style?",
    subtitle: "Tell us what you usually capture.",
    options: ["Everyday moments", "Portraits & social", "Video & low light"],
  },
  {
    key: "battery",
    title: "How hard do you use your phone?",
    subtitle: "This helps balance battery and display.",
    options: ["Light daily use", "All-day regular use", "Heavy power use"],
  },
  {
    key: "network",
    title: "Which network do you need?",
    subtitle: "Final step—we’re nearly there.",
    options: ["4G is fine", "5G required"],
  },
] as const;
export function MobileFinder() {
  const [step, setStep] = useState(0),
    [answers, setAnswers] = useState<Record<string, string>>({}),
    done = step === steps.length;
  const matches = useMemo(
    () =>
      products
        .filter((p) => p.category === "mobile-phones")
        .map((p) => {
          let score = 60;
          const b = answers.budget;
          if (b?.startsWith("Under") && p.price < 50000) score += 20;
          if (b?.includes("50,000") && p.price >= 50000 && p.price <= 90000)
            score += 20;
          if (b?.startsWith("Above") && p.price > 90000) score += 20;
          if (answers.brand === p.brand || answers.brand === "No preference")
            score += 10;
          if (
            answers.network === "5G required" &&
            p.specs.Network?.includes("5G")
          )
            score += 10;
          if (
            answers.focus === "Long battery life" &&
            parseInt(p.specs.Battery) >= 5200
          )
            score += 10;
          return { ...p, match: Math.min(99, score) };
        })
        .sort((a, b) => b.match - a.match),
    [answers],
  );
  if (done)
    return (
      <StoreLayout>
        <div className="container-shell py-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="text-xs font-bold uppercase tracking-[.2em] text-blue-600">
                Your Volt Finder results
              </span>
              <h1 className="mt-2 text-3xl font-extrabold">
                These phones fit you best
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Ranked with transparent, rules-based matching from your answers.
              </p>
            </div>
            <button
              onClick={() => {
                setStep(0);
                setAnswers({});
              }}
              className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold"
            >
              <RotateCcw size={16} /> Start over
            </button>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {matches.map((p) => (
              <div key={p.id} className="relative">
                <div className="absolute left-4 top-4 z-20 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-black text-white shadow">
                  {p.match}% match
                </div>
                <ProductCard product={p} />
                <div className="mt-2 rounded-xl border bg-white p-3 text-xs text-slate-600">
                  <strong className="block text-slate-900">
                    Why it matches
                  </strong>
                  {p.price < 50000
                    ? "Excellent value in your budget."
                    : "Strong performance for your price range."}{" "}
                  {p.specs.Network?.includes("5G")
                    ? "Future-ready 5G included."
                    : "Dependable 4G connectivity."}
                </div>
              </div>
            ))}
          </div>
        </div>
      </StoreLayout>
    );
  const current = steps[step];
  return (
    <StoreLayout>
      <div className="container-shell py-10">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white">
              <Sparkles size={21} />
            </span>
            <div>
              <h1 className="text-xl font-extrabold">Volt Finder</h1>
              <p className="text-xs text-slate-500">Your guided phone match</p>
            </div>
          </div>
          <div className="mt-8 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all"
              style={{ width: `${(step / steps.length) * 100}%` }}
            />
          </div>
          <p className="mt-3 text-xs font-bold text-slate-500">
            Question {step + 1} of {steps.length}
          </p>
          <div className="mt-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-10">
            <h2 className="text-2xl font-extrabold sm:text-3xl">
              {current.title}
            </h2>
            <p className="mt-2 text-sm text-slate-500">{current.subtitle}</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {current.options.map((option) => {
                const selected = answers[current.key] === option;
                return (
                  <button
                    key={option}
                    onClick={() =>
                      setAnswers({ ...answers, [current.key]: option })
                    }
                    className={`relative min-h-16 rounded-xl border-2 p-4 text-left text-sm font-bold transition ${selected ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 hover:border-blue-300"}`}
                  >
                    {option}
                    {selected && (
                      <span className="absolute right-3 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full bg-blue-600 text-white">
                        <Check size={14} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-8 flex justify-between">
              <button
                disabled={step === 0}
                onClick={() => setStep(step - 1)}
                className="flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold text-slate-600 disabled:opacity-30"
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                disabled={!answers[current.key]}
                onClick={() => setStep(step + 1)}
                className="flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white disabled:bg-slate-300"
              >
                {step === steps.length - 1 ? "Show matches" : "Continue"}
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
