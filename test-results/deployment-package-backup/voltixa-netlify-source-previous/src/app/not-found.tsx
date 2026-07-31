import Link from "next/link";
import { SearchX } from "lucide-react";
import { Brand } from "@/components/brand";
export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center">
      <div>
        <Brand />
        <SearchX className="mx-auto mt-10 text-blue-600" size={56} />
        <p className="mt-5 text-sm font-bold uppercase tracking-[.2em] text-blue-600">
          404
        </p>
        <h1 className="mt-2 text-4xl font-extrabold">
          That page lost its charge
        </h1>
        <p className="mt-3 text-slate-500">
          The link may have moved or no longer exists.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-blue-600 px-6 py-3 font-bold text-white"
        >
          Back to Voltixa
        </Link>
      </div>
    </main>
  );
}
