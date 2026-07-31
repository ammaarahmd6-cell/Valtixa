"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Brand } from "./brand";
import { createClient } from "@/lib/supabase/client";
import { safeRedirect } from "@/lib/utils";

export function AuthPage({
  mode = "login",
}: {
  mode?: "login" | "register" | "forgot" | "verify";
}) {
  const [method, setMethod] = useState<"email" | "phone">("email"),
    [password, setPassword] = useState(""),
    [show, setShow] = useState(false),
    [loading, setLoading] = useState(false);
  const router = useRouter();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget),
      email = String(form.get("email") ?? ""),
      phone = String(form.get("phone") ?? ""),
      supabase = createClient();
    if (!supabase) {
      toast.info(
        "Supabase is not configured. Add the environment values to enable authentication.",
      );
      setLoading(false);
      return;
    }
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${location.origin}/account`,
        });
        if (error) throw error;
        toast.success("Password recovery email sent");
      } else if (method === "phone") {
        const { error } = await supabase.auth.signInWithOtp({ phone });
        if (error) throw error;
        router.push(`/verify-otp?phone=${encodeURIComponent(phone)}`);
      } else if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${location.origin}/account` },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push(
          safeRedirect(new URLSearchParams(location.search).get("next")),
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="grid min-h-screen bg-slate-950 lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-[radial-gradient(circle_at_20%_20%,#2563eb_0,transparent_35%),radial-gradient(circle_at_80%_70%,#06b6d4_0,transparent_30%)] p-12 text-white lg:flex">
        <Brand inverse />
        <div>
          <span className="text-sm font-bold uppercase tracking-[.25em] text-cyan-300">
            Voltixa membership
          </span>
          <h1 className="mt-4 max-w-xl text-5xl font-extrabold leading-tight">
            Your orders, warranties and favourites. All in one place.
          </h1>
          <div className="mt-8 grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <strong className="block text-2xl">Fast</strong>checkout
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <strong className="block text-2xl">Live</strong>tracking
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <strong className="block text-2xl">Easy</strong>support
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-400">
          Secure authentication powered by Supabase
        </p>
      </section>
      <section className="grid place-items-center bg-white p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden">
            <Brand />
          </div>
          <div className="mt-10 lg:mt-0">
            <span className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
              <LockKeyhole />
            </span>
            <h1 className="mt-5 text-3xl font-extrabold">
              {mode === "register"
                ? "Create your account"
                : mode === "forgot"
                  ? "Reset your password"
                  : "Welcome back"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {mode === "register"
                ? "Join Voltixa for faster checkout and better support."
                : mode === "forgot"
                  ? "We’ll email you a secure recovery link."
                  : "Sign in to continue your Voltixa journey."}
            </p>
          </div>
          {mode !== "forgot" && (
            <div className="mt-7 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
              <button
                onClick={() => setMethod("email")}
                className={`flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-bold ${method === "email" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}
              >
                <Mail size={16} /> Email
              </button>
              <button
                onClick={() => setMethod("phone")}
                className={`flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-bold ${method === "phone" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}
              >
                <Smartphone size={16} /> Phone OTP
              </button>
            </div>
          )}
          <form onSubmit={submit} className="mt-6 space-y-4">
            {method === "phone" && mode !== "forgot" ? (
              <label className="block text-xs font-bold">
                Mobile number
                <input
                  required
                  name="phone"
                  placeholder="+923001234567"
                  className="mt-2 h-12 w-full rounded-xl border px-4 text-sm"
                />
              </label>
            ) : (
              <>
                <label className="block text-xs font-bold">
                  Email address
                  <input
                    required
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    className="mt-2 h-12 w-full rounded-xl border px-4 text-sm"
                  />
                </label>
                {mode !== "forgot" && (
                  <label className="block text-xs font-bold">
                    Password
                    <div className="relative mt-2">
                      <input
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type={show ? "text" : "password"}
                        name="password"
                        className="h-12 w-full rounded-xl border px-4 pr-12 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShow(!show)}
                        aria-label={show ? "Hide password" : "Show password"}
                        className="absolute right-0 top-0 grid size-12 place-items-center text-slate-400"
                      >
                        {show ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </label>
                )}
              </>
            )}{" "}
            {mode === "login" && method === "email" && (
              <div className="text-right">
                <Link
                  href="/forgot-password"
                  className="text-xs font-bold text-blue-600"
                >
                  Forgot password?
                </Link>
              </div>
            )}
            <button
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700 disabled:bg-slate-300"
            >
              {loading
                ? "Please wait…"
                : mode === "register"
                  ? "Create account"
                  : mode === "forgot"
                    ? "Send recovery link"
                    : method === "phone"
                      ? "Send secure code"
                      : "Sign in"}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="mt-7 text-center text-sm text-slate-500">
            {mode === "register" ? "Already a member?" : "New to Voltixa?"}{" "}
            <Link
              href={mode === "register" ? "/login" : "/register"}
              className="font-bold text-blue-600"
            >
              {mode === "register" ? "Sign in" : "Create account"}
            </Link>
          </p>
          <Link
            href="/"
            className="mt-8 block text-center text-xs font-bold text-slate-500"
          >
            ← Back to store
          </Link>
        </div>
      </section>
    </main>
  );
}
