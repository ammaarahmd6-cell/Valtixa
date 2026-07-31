"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Brand } from "@/components/brand";
import { createClient } from "@/lib/supabase/client";
export default function Page() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
function VerifyForm() {
  const [code, setCode] = useState(""),
    [loading, setLoading] = useState(false),
    router = useRouter(),
    p = useSearchParams(),
    phone = p.get("phone") ?? "";
  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const s = createClient();
    if (!s) {
      toast.info("Supabase is not configured.");
      setLoading(false);
      return;
    }
    const { error } = await s.auth.verifyOtp({
      phone,
      token: code,
      type: "sms",
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else router.push("/account");
  }
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <form
        onSubmit={verify}
        className="w-full max-w-md rounded-3xl border bg-white p-8 shadow-xl"
      >
        <Brand />
        <h1 className="mt-8 text-3xl font-extrabold">Enter your code</h1>
        <p className="mt-2 text-sm text-slate-500">
          We sent a one-time code to {phone || "your phone"}.
        </p>
        <input
          value={code}
          onChange={(e) =>
            setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          inputMode="numeric"
          autoComplete="one-time-code"
          className="mt-6 h-14 w-full rounded-xl border px-4 text-center text-2xl font-bold tracking-[.4em]"
          aria-label="One-time code"
        />
        <button
          disabled={code.length < 6 || loading}
          className="mt-4 h-12 w-full rounded-xl bg-blue-600 font-bold text-white disabled:bg-slate-300"
        >
          {loading ? "Verifying…" : "Verify and continue"}
        </button>
        <button
          type="button"
          className="mt-4 w-full text-sm font-bold text-blue-600"
        >
          Resend code
        </button>
      </form>
    </main>
  );
}
