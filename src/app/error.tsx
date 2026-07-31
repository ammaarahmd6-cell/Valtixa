"use client";
import { AlertTriangle } from "lucide-react";
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center">
      <div>
        <AlertTriangle className="mx-auto text-amber-500" size={54} />
        <h1 className="mt-5 text-3xl font-extrabold">
          Something interrupted the flow
        </h1>
        <p className="mt-2 text-slate-500">
          Your data is safe. Please retry the last action.
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
