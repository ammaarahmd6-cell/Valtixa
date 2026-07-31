"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  BadgeDollarSign,
  BarChart3,
  Bell,
  BookOpen,
  Boxes,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Download,
  FileQuestion,
  FileText,
  Headphones,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageCheck,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Settings,
  Shield,
  ShoppingCart,
  Star,
  Tags,
  TicketPercent,
  Truck,
  Users,
  Warehouse,
  X,
} from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Brand } from "./brand";

type Row = Record<string, unknown>;
type AdminData = Record<string, unknown>;

const nav = [
  ["Overview", "/admin", LayoutDashboard, "overview"],
  ["Products", "/admin/products", Boxes, "products"],
  ["Categories", "/admin/categories", Tags, "categories"],
  ["Brands", "/admin/brands", BadgeDollarSign, "brands"],
  ["Inventory", "/admin/inventory", Warehouse, "inventory"],
  ["Orders", "/admin/orders", ShoppingCart, "orders"],
  ["Customers", "/admin/customers", Users, "customers"],
  ["Reviews", "/admin/reviews", Star, "reviews"],
  ["Complaints", "/admin/complaints", Headphones, "complaints"],
  ["Warranties", "/admin/warranties", Shield, "warranties"],
  ["Coupons", "/admin/coupons", TicketPercent, "coupons"],
  ["Promotions", "/admin/promotions", Tags, "promotions"],
  ["Homepage", "/admin/homepage", LayoutDashboard, "homepage"],
  ["Banners", "/admin/banners", ImageIcon, "banners"],
  ["Payments", "/admin/payments", CircleDollarSign, "payments"],
  ["Shipments", "/admin/shipments", Truck, "shipments"],
  ["Blog", "/admin/blog", BookOpen, "blog"],
  ["FAQs", "/admin/faqs", FileQuestion, "faqs"],
  ["Notifications", "/admin/notifications", Bell, "notifications"],
  ["Reports", "/admin/reports", BarChart3, "reports"],
  ["Staff & roles", "/admin/staff", Shield, "staff"],
  ["Settings", "/admin/settings", Settings, "settings"],
  ["Audit logs", "/admin/audit-logs", ClipboardList, "audit-logs"],
] as const;

const orderStatuses = [
  "pending",
  "confirmed",
  "payment_pending",
  "paid",
  "processing",
  "packed",
  "ready_to_ship",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "return_requested",
  "returned",
  "refund_pending",
  "refunded",
  "failed",
];

function rows(data: AdminData, key: string): Row[] {
  return Array.isArray(data[key]) ? (data[key] as Row[]) : [];
}

function object(value: unknown): Row {
  if (value && typeof value === "object" && !Array.isArray(value))
    return value as Row;
  if (Array.isArray(value) && value[0] && typeof value[0] === "object")
    return value[0] as Row;
  return {};
}

function list(value: unknown): Row[] {
  return Array.isArray(value) ? (value as Row[]) : [];
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function string(value: unknown, fallback = "—") {
  if (typeof value === "string" && value) return value;
  if (typeof value === "number") return String(value);
  return fallback;
}

function number(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: unknown) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(number(value));
}

function date(value: unknown, withTime = false) {
  if (!value) return "—";
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.valueOf())) return "—";
  return parsed.toLocaleString(
    "en-PK",
    withTime
      ? { dateStyle: "medium", timeStyle: "short" }
      : { dateStyle: "medium" },
  );
}

function formValues(form: HTMLFormElement) {
  const payload: Record<string, unknown> = {};
  new FormData(form).forEach((value, key) => {
    payload[key] = value;
  });
  form
    .querySelectorAll<HTMLInputElement>('input[type="checkbox"][name]')
    .forEach((input) => {
      payload[input.name] = input.checked;
    });
  return payload;
}

function statusTone(status: string) {
  if (
    [
      "published",
      "paid",
      "approved",
      "active",
      "delivered",
      "resolved",
      "visible",
    ].includes(status)
  ) {
    return "bg-emerald-50 text-emerald-700";
  }
  if (
    [
      "archived",
      "cancelled",
      "failed",
      "rejected",
      "suspended",
      "closed",
      "hidden",
    ].includes(status)
  ) {
    return "bg-rose-50 text-rose-700";
  }
  return "bg-amber-50 text-amber-700";
}

function Status({ value }: { value: unknown }) {
  const label = string(value, "unknown");
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold capitalize ${statusTone(label)}`}
    >
      {label.replaceAll("_", " ")}
    </span>
  );
}

function PageTitle({
  eyebrow = "Administration",
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-sm text-slate-500">{eyebrow}</p>
        <h1 className="mt-1 text-3xl font-extrabold text-slate-950">{title}</h1>
      </div>
      {action}
    </div>
  );
}

function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white ${className}`}
    >
      {children}
    </section>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="grid min-h-48 place-items-center p-8 text-center">
      <div>
        <PackageCheck className="mx-auto text-slate-300" size={34} />
        <p className="mt-3 font-bold text-slate-700">No {label} found</p>
        <p className="mt-1 text-sm text-slate-500">
          New live records will appear here automatically.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: unknown;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={
          defaultValue === null || defaultValue === undefined
            ? ""
            : String(defaultValue)
        }
        placeholder={placeholder}
        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-blue-500"
      />
    </label>
  );
}

function MediaField({
  label,
  name,
  bucket,
  defaultValue,
}: {
  label: string;
  name: string;
  bucket: string;
  defaultValue?: unknown;
}) {
  const [value, setValue] = useState(defaultValue ? String(defaultValue) : "");
  const [uploading, setUploading] = useState(false);
  async function upload(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("bucket", bucket);
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body,
      });
      const result = (await response.json()) as {
        error?: string;
        url?: string;
      };
      if (!response.ok || !result.url)
        throw new Error(result.error || "Upload failed.");
      setValue(result.url);
      toast.success("Image uploaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}
      <input
        name={name}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-blue-500"
        placeholder="Paste an image URL or upload below"
      />
      <span className="mt-2 flex items-center gap-3">
        <input
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
          className="block min-w-0 flex-1 text-xs font-normal text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-bold file:text-blue-700"
        />
        {uploading && <span className="text-xs text-blue-600">Uploading…</span>}
      </span>
    </label>
  );
}

function Textarea({
  label,
  name,
  defaultValue,
  required = false,
}: {
  label: string;
  name: string;
  defaultValue?: unknown;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}
      <textarea
        name={name}
        required={required}
        defaultValue={
          defaultValue === null || defaultValue === undefined
            ? ""
            : String(defaultValue)
        }
        rows={4}
        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3 font-normal outline-none focus:border-blue-500"
      />
    </label>
  );
}

function Check({
  label,
  name,
  defaultChecked = false,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="size-4 accent-blue-600"
      />
      {label}
    </label>
  );
}

function Button({
  children,
  onClick,
  type = "button",
  tone = "primary",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  tone?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}) {
  const classes =
    tone === "primary"
      ? "bg-blue-600 text-white hover:bg-blue-700"
      : tone === "danger"
        ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50";
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-extrabold transition disabled:cursor-not-allowed disabled:opacity-50 ${classes}`}
    >
      {children}
    </button>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/55 p-4"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-5">
          <h2 className="text-xl font-extrabold">{title}</h2>
          <button
            aria-label="Close dialog"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-xl bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function AdminPage({
  path,
  data,
  operator,
}: {
  path: string[];
  data: AdminData;
  operator: { name: string; email: string; role: string };
}) {
  const router = useRouter();
  const section = path[0] ?? "overview";
  const detail = path[1];
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(
    action: string,
    id?: string,
    payload: Record<string, unknown> = {},
    confirmation?: string,
  ) {
    if (confirmation && !window.confirm(confirmation)) return false;
    setBusy(true);
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id, payload }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Action failed.");
      toast.success("Saved successfully.");
      router.refresh();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  const ctx = { data, detail, query, setQuery, busy, run };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {menuOpen && (
        <button
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-950 text-white transition lg:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="border-b border-white/10 px-5 py-4">
          <Brand inverse />
          <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
            Commerce control
          </p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {nav.map(([label, href, Icon, key]) => (
            <Link
              onClick={() => setMenuOpen(false)}
              key={key}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                section === key ||
                (section === "overview" && key === "overview")
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </nav>
        <Link
          href="/"
          className="m-4 flex items-center gap-3 rounded-xl border border-white/10 p-3 text-sm font-bold text-slate-300 hover:bg-white/10"
        >
          <LogOut size={17} /> Exit dashboard
        </Link>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex min-h-18 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-7">
          <button
            onClick={() => setMenuOpen(true)}
            className="grid size-10 place-items-center rounded-xl border lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl bg-slate-100 px-3 sm:max-w-md">
            <Search size={17} className="shrink-0 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search this page"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </div>
          <Link
            href={`/api/admin?export=${section}`}
            aria-label="Download page data in Excel"
            title="Download this page's data for Excel"
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-extrabold text-emerald-700 transition hover:bg-emerald-100"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Excel</span>
          </Link>
          <Link
            href="/admin/notifications"
            aria-label="Notifications"
            className="relative grid size-10 place-items-center rounded-xl bg-slate-100"
          >
            <Bell size={18} />
            {rows(data, "notifications").some((item) => !item.read_at) && (
              <span className="absolute right-2 top-2 size-2 rounded-full bg-red-500" />
            )}
          </Link>
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-sm font-bold text-white">
            {operator.name
              .split(/\s+/)
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </span>
          <div className="max-w-20 sm:max-w-40">
            <strong className="block truncate text-xs">{operator.name}</strong>
            <span className="text-[10px] capitalize text-slate-500">
              {operator.role.replaceAll("_", " ")}
            </span>
          </div>
        </header>

        <main className="p-4 sm:p-7">
          {section === "overview" && <Dashboard {...ctx} />}
          {section === "products" && <Products {...ctx} />}
          {section === "categories" && <Directory {...ctx} kind="category" />}
          {section === "brands" && <Directory {...ctx} kind="brand" />}
          {section === "inventory" && <Inventory {...ctx} />}
          {section === "orders" && <Orders {...ctx} />}
          {section === "customers" && <Customers {...ctx} />}
          {section === "reviews" && <Reviews {...ctx} />}
          {section === "complaints" && <Complaints {...ctx} />}
          {section === "warranties" && <Warranties {...ctx} />}
          {section === "coupons" && <Coupons {...ctx} />}
          {section === "promotions" && <Promotions {...ctx} />}
          {(section === "homepage" || section === "banners") && (
            <Banners
              {...ctx}
              title={section === "homepage" ? "Homepage content" : "Banners"}
            />
          )}
          {section === "payments" && <Payments {...ctx} />}
          {section === "shipments" && <Shipments {...ctx} />}
          {section === "blog" && <Blog {...ctx} />}
          {section === "faqs" && <Faqs {...ctx} />}
          {section === "notifications" && <Notifications {...ctx} />}
          {section === "reports" && <Reports {...ctx} />}
          {section === "staff" && <Staff {...ctx} role={operator.role} />}
          {section === "settings" && <SiteSettings {...ctx} />}
          {section === "audit-logs" && <AuditLogs {...ctx} />}
        </main>
      </div>
    </div>
  );
}

type Context = {
  data: AdminData;
  detail?: string;
  query: string;
  setQuery: (value: string) => void;
  busy: boolean;
  run: (
    action: string,
    id?: string,
    payload?: Record<string, unknown>,
    confirmation?: string,
  ) => Promise<boolean>;
};

function filtered(items: Row[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return items;
  return items.filter((item) =>
    JSON.stringify(item).toLowerCase().includes(normalized),
  );
}

function Dashboard({ data }: Context) {
  const orders = rows(data, "orders");
  const products = rows(data, "products");
  const customers = rows(data, "customers");
  const inventory = rows(data, "inventory");
  const complaints = rows(data, "complaints");
  const reviews = rows(data, "reviews");
  const revenue = orders
    .filter(
      (order) =>
        !["cancelled", "failed", "refunded"].includes(string(order.status)),
    )
    .reduce((sum, order) => sum + number(order.grand_total), 0);
  const lowStock = inventory.filter((item) => {
    const stock = object(item.inventory);
    return (
      number(stock.quantity) - number(stock.reserved_quantity) <=
      number(stock.low_stock_threshold)
    );
  }).length;
  const chart = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (6 - index));
    const total = orders
      .filter((order) => {
        const created = new Date(String(order.created_at));
        return created >= day && created < new Date(day.valueOf() + 86_400_000);
      })
      .reduce((sum, order) => sum + number(order.grand_total), 0);
    return {
      day: day.toLocaleDateString("en-PK", { weekday: "short" }),
      revenue: total,
    };
  });

  return (
    <>
      <PageTitle
        eyebrow={new Date().toLocaleDateString("en-PK", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
        title="Store pulse"
      />
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            Icon: CircleDollarSign,
            label: "Revenue",
            value: money(revenue),
            badge: "Live",
          },
          {
            Icon: ShoppingCart,
            label: "Orders",
            value: String(orders.length),
            badge: "Live",
          },
          {
            Icon: Boxes,
            label: "Products",
            value: String(products.length),
            badge: `${products.filter((item) => item.status === "published").length} live`,
          },
          {
            Icon: Users,
            label: "Customers",
            value: String(customers.length),
            badge: "Live",
          },
        ].map(({ Icon, label, value, badge }) => (
          <Card key={label} className="p-5">
            <div className="flex items-start justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <Icon size={20} />
              </span>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                {badge}
              </span>
            </div>
            <p className="mt-5 text-sm text-slate-500">{label}</p>
            <strong className="mt-1 block text-2xl">{value}</strong>
          </Card>
        ))}
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Card className="p-5">
          <div className="flex justify-between">
            <div>
              <h2 className="font-extrabold">Revenue trend</h2>
              <p className="text-xs text-slate-500">
                Live order totals for the last 7 days
              </p>
            </div>
            <Activity className="text-blue-600" />
          </div>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart}>
                <defs>
                  <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="1" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} width={70} />
                <Tooltip formatter={(value) => money(value)} />
                <Area
                  dataKey="revenue"
                  type="monotone"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fill="url(#revenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-extrabold">Needs attention</h2>
          <div className="mt-4 space-y-3">
            {[
              [
                orders.filter((item) =>
                  ["pending", "payment_pending"].includes(string(item.status)),
                ).length,
                "Pending orders",
                "/admin/orders",
              ],
              [lowStock, "Low-stock variants", "/admin/inventory"],
              [
                complaints.filter(
                  (item) =>
                    !["resolved", "closed"].includes(string(item.status)),
                ).length,
                "Open complaints",
                "/admin/complaints",
              ],
              [
                reviews.filter((item) => item.status === "pending").length,
                "Reviews to moderate",
                "/admin/reviews",
              ],
            ].map(([count, label, href]) => (
              <Link
                key={String(label)}
                href={String(href)}
                className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 hover:bg-blue-50"
              >
                <strong className="grid size-9 place-items-center rounded-lg bg-white text-blue-600">
                  {String(count)}
                </strong>
                <span className="flex-1 text-sm font-semibold">
                  {String(label)}
                </span>
                <ChevronRight size={16} />
              </Link>
            ))}
          </div>
        </Card>
      </div>
      <Card className="mt-5 overflow-hidden">
        <div className="border-b p-5">
          <h2 className="font-extrabold">Recent orders</h2>
        </div>
        <SimpleOrderRows orders={orders.slice(0, 5)} />
      </Card>
    </>
  );
}

function Products(ctx: Context) {
  const { data, detail, query, setQuery, busy, run } = ctx;
  const products = rows(data, "products");
  const [nameFilter, setNameFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const categories = rows(data, "categories");
  const brands = rows(data, "brands");
  const categoryBrandMap = object(object(data.categoryBrandSetting).value);
  const selectedCategory = categories.find(
    (category) => string(category.id) === categoryFilter,
  );
  const allowedBrandSlugs = selectedCategory
    ? strings(categoryBrandMap[string(selectedCategory.slug)])
    : [];
  const brandOptions = selectedCategory
    ? brands.filter((brand) => allowedBrandSlugs.includes(string(brand.slug)))
    : brands;

  if (detail === "new")
    return <ProductEditor data={data} busy={busy} run={run} />;
  if (detail) {
    const product = products.find((item) => item.id === detail);
    if (product)
      return (
        <ProductEditor data={data} product={product} busy={busy} run={run} />
      );
  }
  function productVariants(product: Row) {
    return list(product.product_variants);
  }

  function productPrice(product: Row) {
    const prices = productVariants(product)
      .filter((variant) => variant.is_active !== false)
      .map((variant) => number(variant.price))
      .filter((price) => price > 0);
    return prices.length ? Math.min(...prices) : 0;
  }

  function productStock(product: Row) {
    return productVariants(product).reduce((total, variant) => {
      const inventory = object(variant.inventory);
      return (
        total +
        Math.max(
          0,
          number(inventory.quantity) - number(inventory.reserved_quantity),
        )
      );
    }, 0);
  }

  function productLowStockThreshold(product: Row) {
    return productVariants(product).reduce(
      (total, variant) =>
        total + number(object(variant.inventory).low_stock_threshold),
      0,
    );
  }

  const normalizedName = nameFilter.trim().toLowerCase();
  const minimum = minPrice === "" ? null : Number(minPrice);
  const maximum = maxPrice === "" ? null : Number(maxPrice);
  const visible = filtered(products, query)
    .filter((product) => {
      const price = productPrice(product);
      const stock = productStock(product);
      const lowStockThreshold = productLowStockThreshold(product);
      const searchable = [
        string(product.name),
        string(product.slug),
        string(object(product.brands).name),
        ...productVariants(product).map((variant) => string(variant.sku)),
      ]
        .join(" ")
        .toLowerCase();

      if (normalizedName && !searchable.includes(normalizedName)) return false;
      if (categoryFilter && string(product.category_id) !== categoryFilter)
        return false;
      if (brandFilter && string(product.brand_id) !== brandFilter) return false;
      if (statusFilter && string(product.status) !== statusFilter) return false;
      if (featuredFilter === "featured" && product.is_featured !== true)
        return false;
      if (featuredFilter === "regular" && product.is_featured === true)
        return false;
      if (stockFilter === "in_stock" && stock <= 0) return false;
      if (
        stockFilter === "low_stock" &&
        !(stock > 0 && stock <= lowStockThreshold)
      )
        return false;
      if (stockFilter === "out_of_stock" && stock > 0) return false;
      if (minimum !== null && Number.isFinite(minimum) && price < minimum)
        return false;
      if (maximum !== null && Number.isFinite(maximum) && price > maximum)
        return false;
      return true;
    })
    .sort((left, right) => {
      if (sortBy === "name_asc")
        return string(left.name).localeCompare(string(right.name));
      if (sortBy === "name_desc")
        return string(right.name).localeCompare(string(left.name));
      if (sortBy === "price_asc")
        return productPrice(left) - productPrice(right);
      if (sortBy === "price_desc")
        return productPrice(right) - productPrice(left);
      if (sortBy === "stock_asc")
        return productStock(left) - productStock(right);
      if (sortBy === "stock_desc")
        return productStock(right) - productStock(left);
      return (
        new Date(string(right.created_at)).getTime() -
        new Date(string(left.created_at)).getTime()
      );
    });

  const hasFilters = Boolean(
    query ||
    nameFilter ||
    categoryFilter ||
    brandFilter ||
    statusFilter ||
    stockFilter ||
    featuredFilter ||
    minPrice ||
    maxPrice ||
    sortBy !== "newest",
  );
  const controlClass =
    "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  function resetFilters() {
    setQuery("");
    setNameFilter("");
    setCategoryFilter("");
    setBrandFilter("");
    setStatusFilter("");
    setStockFilter("");
    setFeaturedFilter("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
  }
  return (
    <>
      <PageTitle
        eyebrow="Catalog"
        title="Products"
        action={
          <Link
            href="/admin/products/new"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-extrabold text-white"
          >
            <Plus size={17} /> Add product
          </Link>
        }
      />
      <Card className="mt-6 p-4 sm:p-5">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-extrabold text-slate-900">Filter products</h2>
            <p className="mt-1 text-xs text-slate-500">
              Showing{" "}
              <strong className="text-slate-700">{visible.length}</strong> of{" "}
              {products.length} products
            </p>
          </div>
          <button
            type="button"
            onClick={resetFilters}
            disabled={!hasFilters}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-extrabold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RefreshCw size={15} /> Reset filters
          </button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1.5">
            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
              Name or SKU
            </span>
            <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
              <Search size={16} className="shrink-0 text-slate-400" />
              <input
                aria-label="Filter by product name or SKU"
                value={nameFilter}
                onChange={(event) => setNameFilter(event.target.value)}
                placeholder="e.g. iPhone or APL-001"
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
              />
            </div>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
              Category
            </span>
            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value);
                setBrandFilter("");
              }}
              className={controlClass}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={string(category.id)} value={string(category.id)}>
                  {string(category.name)}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
              Brand
            </span>
            <select
              aria-label="Filter by brand"
              value={brandFilter}
              onChange={(event) => setBrandFilter(event.target.value)}
              className={controlClass}
            >
              <option value="">
                {categoryFilter ? "All brands in category" : "All brands"}
              </option>
              {brandOptions.map((brand) => (
                <option key={string(brand.id)} value={string(brand.id)}>
                  {string(brand.name)}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
              Status
            </span>
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={controlClass}
            >
              <option value="">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
              Stock
            </span>
            <select
              aria-label="Filter by stock"
              value={stockFilter}
              onChange={(event) => setStockFilter(event.target.value)}
              className={controlClass}
            >
              <option value="">Any stock level</option>
              <option value="in_stock">In stock</option>
              <option value="low_stock">Low stock</option>
              <option value="out_of_stock">Out of stock</option>
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
              Minimum price
            </span>
            <input
              aria-label="Minimum price"
              type="number"
              min="0"
              step="1"
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              placeholder="Rs. 0"
              className={controlClass}
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
              Maximum price
            </span>
            <input
              aria-label="Maximum price"
              type="number"
              min="0"
              step="1"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              placeholder="No limit"
              className={controlClass}
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
              Featured
            </span>
            <select
              aria-label="Filter featured products"
              value={featuredFilter}
              onChange={(event) => setFeaturedFilter(event.target.value)}
              className={controlClass}
            >
              <option value="">Featured and regular</option>
              <option value="featured">Featured only</option>
              <option value="regular">Regular only</option>
            </select>
          </label>

          <label className="space-y-1.5 sm:col-span-2 xl:col-span-4">
            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
              Sort products
            </span>
            <select
              aria-label="Sort products"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className={controlClass}
            >
              <option value="newest">Newest first</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
              <option value="price_asc">Price: Low to high</option>
              <option value="price_desc">Price: High to low</option>
              <option value="stock_asc">Stock: Low to high</option>
              <option value="stock_desc">Stock: High to low</option>
            </select>
          </label>
        </div>
      </Card>
      <Card className="mt-6 overflow-hidden">
        {visible.length === 0 ? (
          <div className="grid min-h-52 place-items-center p-8 text-center">
            <div>
              <Search className="mx-auto text-slate-300" size={32} />
              <h3 className="mt-3 font-extrabold text-slate-800">
                No matching products
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Try changing the filters or reset them to see the full catalog.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-extrabold text-white"
              >
                Reset filters
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="p-4">Product</th>
                  <th>Brand / category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th className="pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((product) => {
                  const variant = list(product.product_variants)[0] ?? {};
                  return (
                    <tr key={string(product.id)} className="border-t">
                      <td className="p-4">
                        <strong className="block">
                          {string(product.name)}
                        </strong>
                        <small className="text-slate-500">
                          {string(variant.sku)}
                        </small>
                      </td>
                      <td>
                        {string(object(product.brands).name)} ·{" "}
                        {string(object(product.categories).name)}
                      </td>
                      <td className="font-semibold">
                        {money(productPrice(product))}
                      </td>
                      <td>{productStock(product)}</td>
                      <td>
                        <Status value={product.status} />
                      </td>
                      <td className="space-x-3 pr-4 text-right">
                        <Link
                          href={`/admin/products/${string(product.id)}`}
                          className="font-bold text-blue-600"
                        >
                          Edit
                        </Link>
                        <button
                          disabled={busy}
                          onClick={() =>
                            run("product.duplicate", string(product.id))
                          }
                          className="font-bold text-slate-600"
                        >
                          Duplicate
                        </button>
                        {product.status !== "archived" && (
                          <button
                            disabled={busy}
                            onClick={() =>
                              run(
                                "product.status",
                                string(product.id),
                                { status: "archived" },
                                `Archive ${string(product.name)}?`,
                              )
                            }
                            className="font-bold text-rose-600"
                          >
                            Archive
                          </button>
                        )}
                        <button
                          disabled={busy}
                          onClick={() =>
                            run(
                              "product.delete",
                              string(product.id),
                              {},
                              `Permanently delete ${string(product.name)}? This cannot be undone.`,
                            )
                          }
                          className="font-bold text-rose-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

function ProductEditor({
  data,
  product,
  busy,
  run,
}: Pick<Context, "data" | "busy" | "run"> & { product?: Row }) {
  const router = useRouter();
  const variants = list(product?.product_variants);
  const variant = variants[0] ?? {};
  const stock = object(variant.inventory);
  const [categoryId, setCategoryId] = useState(
    string(product?.category_id, ""),
  );
  const mapping = object(object(data.categoryBrandSetting).value);
  const selectedCategory = rows(data, "categories").find(
    (item) => item.id === categoryId,
  );
  const allowedBrandSlugs = selectedCategory
    ? strings(mapping[string(selectedCategory.slug, "")])
    : [];
  const availableBrands = rows(data, "brands").filter((brand) =>
    allowedBrandSlugs.includes(string(brand.slug, "")),
  );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = await run(
      "product.save",
      product ? string(product.id) : undefined,
      formValues(event.currentTarget),
    );
    if (ok) router.push("/admin/products");
  }
  return (
    <>
      <PageTitle
        eyebrow="Catalog"
        title={product ? `Edit ${string(product.name)}` : "Add product"}
        action={
          <Link
            href="/admin/products"
            className="text-sm font-bold text-blue-600"
          >
            Back to products
          </Link>
        }
      />
      <form
        onSubmit={submit}
        className="mt-6 grid gap-5 xl:grid-cols-[1.4fr_0.8fr]"
      >
        <Card className="space-y-5 p-5">
          <h2 className="text-lg font-extrabold">Product information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Product name"
              name="name"
              required
              defaultValue={product?.name}
            />
            <Field label="URL slug" name="slug" defaultValue={product?.slug} />
            <label className="block text-sm font-bold text-slate-700">
              Category
              <select
                name="categoryId"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                required
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal"
              >
                <option value="">Choose category</option>
                {rows(data, "categories")
                  .filter((item) => item.is_visible)
                  .map((item) => (
                    <option key={string(item.id)} value={string(item.id)}>
                      {string(item.name)}
                    </option>
                  ))}
              </select>
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Brand
              <select
                name="brandId"
                key={categoryId}
                defaultValue={
                  availableBrands.some(
                    (brand) => brand.id === product?.brand_id,
                  )
                    ? string(product?.brand_id, "")
                    : ""
                }
                required
                disabled={!categoryId}
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal disabled:bg-slate-100"
              >
                <option value="">
                  {categoryId
                    ? "Choose brand for this category"
                    : "Select category first"}
                </option>
                {availableBrands.map((item) => (
                  <option key={string(item.id)} value={string(item.id)}>
                    {string(item.name)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <Field
            label="Short description"
            name="shortDescription"
            defaultValue={product?.short_description}
          />
          <Textarea
            label="Full description"
            name="description"
            defaultValue={product?.description}
          />
          <MediaField
            label="Primary product image"
            name="imagePath"
            bucket="product-images"
            defaultValue={
              list(product?.product_images).find((image) => image.is_primary)
                ?.storage_path
            }
          />
          <Field
            label="Image alt text"
            name="imageAlt"
            defaultValue={
              list(product?.product_images).find((image) => image.is_primary)
                ?.alt_text ?? product?.name
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="SEO title"
              name="seoTitle"
              defaultValue={product?.seo_title}
            />
            <Field
              label="SEO description"
              name="seoDescription"
              defaultValue={product?.seo_description}
            />
          </div>
        </Card>
        <div className="space-y-5">
          <Card className="space-y-4 p-5">
            <h2 className="text-lg font-extrabold">Price & stock</h2>
            {variant.id ? (
              <input
                type="hidden"
                name="variantId"
                value={string(variant.id)}
              />
            ) : null}
            <Field label="SKU" name="sku" required defaultValue={variant.sku} />
            <Field
              label="Variant name"
              name="variantName"
              defaultValue={variant.name === "—" ? "Standard" : variant.name}
            />
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Selling price"
                name="price"
                type="number"
                required
                defaultValue={variant.price}
              />
              <Field
                label="Retail price"
                name="retailPrice"
                type="number"
                required
                defaultValue={variant.retail_price}
              />
              <Field
                label="Cost"
                name="cost"
                type="number"
                defaultValue={variant.cost}
              />
              <Field
                label="Weight (g)"
                name="weightGrams"
                type="number"
                defaultValue={variant.weight_grams}
              />
              <Field
                label="Stock"
                name="stock"
                type="number"
                required
                defaultValue={stock.quantity}
              />
              <Field
                label="Low stock alert"
                name="lowStockThreshold"
                type="number"
                defaultValue={stock.low_stock_threshold ?? 5}
              />
            </div>
          </Card>
          <Card className="space-y-4 p-5">
            <label className="block text-sm font-bold text-slate-700">
              Status
              <select
                name="status"
                defaultValue={string(product?.status, "draft")}
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <Check
              label="Featured product"
              name="isFeatured"
              defaultChecked={Boolean(product?.is_featured)}
            />
            <Check
              label="Variant active"
              name="variantActive"
              defaultChecked={variant.is_active !== false}
            />
            <Button type="submit" disabled={busy}>
              <RefreshCw size={16} />{" "}
              {product ? "Save changes" : "Create product"}
            </Button>
          </Card>
        </div>
      </form>
    </>
  );
}

function Directory({
  data,
  query,
  setQuery,
  busy,
  run,
  kind,
}: Context & { kind: "category" | "brand" }) {
  const key = kind === "category" ? "categories" : "brands";
  const [editing, setEditing] = useState<Row | null | undefined>();
  const [nameFilter, setNameFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("");
  const [sortBy, setSortBy] = useState("sort_order");
  const allItems = rows(data, key);
  const categories = rows(data, "categories");
  const mapping = object(object(data.categoryBrandSetting).value);
  const selectedCategory = categories.find(
    (category) => string(category.id) === categoryFilter,
  );
  const selectedBrandSlugs = selectedCategory
    ? strings(mapping[string(selectedCategory.slug)])
    : [];
  const normalizedName = nameFilter.trim().toLowerCase();
  const items = filtered(allItems, query)
    .filter((item) => {
      if (
        normalizedName &&
        !`${string(item.name)} ${string(item.slug)}`
          .toLowerCase()
          .includes(normalizedName)
      )
        return false;
      if (
        kind === "brand" &&
        categoryFilter &&
        !selectedBrandSlugs.includes(string(item.slug))
      )
        return false;
      if (visibilityFilter === "visible" && item.is_visible !== true)
        return false;
      if (visibilityFilter === "hidden" && item.is_visible === true)
        return false;
      if (featuredFilter === "featured" && item.is_featured !== true)
        return false;
      if (featuredFilter === "regular" && item.is_featured === true)
        return false;
      return true;
    })
    .sort((left, right) => {
      if (sortBy === "name_asc")
        return string(left.name).localeCompare(string(right.name));
      if (sortBy === "name_desc")
        return string(right.name).localeCompare(string(left.name));
      if (sortBy === "sort_desc")
        return number(right.sort_order) - number(left.sort_order);
      return (
        number(left.sort_order) - number(right.sort_order) ||
        string(left.name).localeCompare(string(right.name))
      );
    });
  const mappedCategory =
    kind === "brand" && editing
      ? categories.find((category) =>
          strings(mapping[string(category.slug, "")]).includes(
            string(editing.slug, ""),
          ),
        )
      : undefined;
  const controlClass =
    "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
  const hasFilters = Boolean(
    query ||
    nameFilter ||
    categoryFilter ||
    visibilityFilter ||
    featuredFilter ||
    sortBy !== "sort_order",
  );

  function brandCategoryNames(item: Row) {
    return categories
      .filter((category) =>
        strings(mapping[string(category.slug)]).includes(string(item.slug)),
      )
      .map((category) => string(category.name));
  }

  function resetFilters() {
    setQuery("");
    setNameFilter("");
    setCategoryFilter("");
    setVisibilityFilter("");
    setFeaturedFilter("");
    setSortBy("sort_order");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      await run(
        `${kind}.save`,
        editing ? string(editing.id) : undefined,
        formValues(event.currentTarget),
      )
    )
      setEditing(undefined);
  }
  return (
    <>
      <PageTitle
        title={kind === "category" ? "Categories" : "Brands"}
        action={
          <Button onClick={() => setEditing(null)}>
            <Plus size={16} /> Add {kind}
          </Button>
        }
      />
      <Card className="mt-6 p-4 sm:p-5">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-extrabold text-slate-900">Filter {key}</h2>
            <p className="mt-1 text-xs text-slate-500">
              Showing <strong className="text-slate-700">{items.length}</strong>{" "}
              of {allItems.length} {key}
            </p>
          </div>
          <button
            type="button"
            onClick={resetFilters}
            disabled={!hasFilters}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-extrabold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RefreshCw size={15} /> Reset filters
          </button>
        </div>

        <div
          className={`mt-4 grid gap-4 sm:grid-cols-2 ${kind === "brand" ? "xl:grid-cols-5" : "xl:grid-cols-4"}`}
        >
          <label className="space-y-1.5">
            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
              Name or slug
            </span>
            <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
              <Search size={16} className="shrink-0 text-slate-400" />
              <input
                aria-label={`Filter ${key} by name or slug`}
                value={nameFilter}
                onChange={(event) => setNameFilter(event.target.value)}
                placeholder={`Search ${key}`}
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
              />
            </div>
          </label>

          {kind === "brand" && (
            <label className="space-y-1.5">
              <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                Category
              </span>
              <select
                aria-label="Filter brands by category"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className={controlClass}
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={string(category.id)} value={string(category.id)}>
                    {string(category.name)}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="space-y-1.5">
            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
              Visibility
            </span>
            <select
              aria-label={`Filter ${key} by visibility`}
              value={visibilityFilter}
              onChange={(event) => setVisibilityFilter(event.target.value)}
              className={controlClass}
            >
              <option value="">Visible and hidden</option>
              <option value="visible">Visible only</option>
              <option value="hidden">Hidden only</option>
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
              Featured
            </span>
            <select
              aria-label={`Filter featured ${key}`}
              value={featuredFilter}
              onChange={(event) => setFeaturedFilter(event.target.value)}
              className={controlClass}
            >
              <option value="">Featured and regular</option>
              <option value="featured">Featured only</option>
              <option value="regular">Regular only</option>
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
              Sort
            </span>
            <select
              aria-label={`Sort ${key}`}
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className={controlClass}
            >
              <option value="sort_order">Sort order: Low to high</option>
              <option value="sort_desc">Sort order: High to low</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
            </select>
          </label>
        </div>
      </Card>
      <div
        data-testid={`${kind}-list`}
        className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        {items.map((item) => (
          <Card key={string(item.id)} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-extrabold">{string(item.name)}</h2>
                <p className="mt-1 text-xs text-slate-500">
                  /{string(item.slug)}
                </p>
              </div>
              <Status value={item.is_visible ? "visible" : "hidden"} />
            </div>
            {kind === "brand" && (
              <>
                <p className="mt-3 text-xs font-bold text-blue-600">
                  {brandCategoryNames(item).join(" · ") ||
                    "No category assigned"}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                  {string(item.description, "No description")}
                </p>
              </>
            )}
            <div className="mt-5 flex gap-2">
              <Button tone="secondary" onClick={() => setEditing(item)}>
                Edit
              </Button>
              <Button
                tone={item.is_visible ? "danger" : "secondary"}
                disabled={busy}
                onClick={() =>
                  run(
                    `${kind}.toggle`,
                    string(item.id),
                    { enabled: !item.is_visible },
                    `${item.is_visible ? "Hide" : "Show"} ${string(item.name)}?`,
                  )
                }
              >
                {item.is_visible ? "Hide" : "Show"}
              </Button>
              <Button
                tone="danger"
                disabled={busy}
                onClick={() =>
                  run(
                    `${kind}.delete`,
                    string(item.id),
                    {},
                    `Permanently delete ${string(item.name)}? This only works when no products are linked.`,
                  )
                }
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>
      {items.length === 0 && (
        <Card className="mt-6">
          <div className="grid min-h-48 place-items-center p-8 text-center">
            <div>
              <Search className="mx-auto text-slate-300" size={32} />
              <h3 className="mt-3 font-extrabold text-slate-800">
                No matching {key}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Try changing the filters or reset them to see every {kind}.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-extrabold text-white"
              >
                Reset filters
              </button>
            </div>
          </div>
        </Card>
      )}
      {editing !== undefined && (
        <Modal
          title={`${editing ? "Edit" : "Add"} ${kind}`}
          onClose={() => setEditing(undefined)}
        >
          <form onSubmit={submit} className="space-y-4">
            <Field
              label="Name"
              name="name"
              required
              defaultValue={editing?.name}
            />
            <Field label="Slug" name="slug" defaultValue={editing?.slug} />
            {kind === "brand" ? (
              <>
                <label className="block text-sm font-bold text-slate-700">
                  Category
                  <select
                    name="categoryId"
                    required
                    defaultValue={string(mappedCategory?.id, "")}
                    className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal"
                  >
                    <option value="">Choose category</option>
                    {categories
                      .filter((category) => category.is_visible)
                      .map((category) => (
                        <option
                          key={string(category.id)}
                          value={string(category.id)}
                        >
                          {string(category.name)}
                        </option>
                      ))}
                  </select>
                </label>
                <Textarea
                  label="Description"
                  name="description"
                  defaultValue={editing?.description}
                />
                <MediaField
                  label="Brand logo"
                  name="logoPath"
                  bucket="brand-logos"
                  defaultValue={editing?.logo_path}
                />
              </>
            ) : (
              <MediaField
                label="Category image"
                name="imagePath"
                bucket="category-images"
                defaultValue={editing?.image_path}
              />
            )}
            <Field
              label="Sort order"
              name="sortOrder"
              type="number"
              defaultValue={editing?.sort_order ?? 0}
            />
            <Check
              label="Featured"
              name="isFeatured"
              defaultChecked={Boolean(editing?.is_featured)}
            />
            <Check
              label="Visible in store"
              name="isVisible"
              defaultChecked={editing?.is_visible !== false}
            />
            <Button type="submit" disabled={busy}>
              Save {kind}
            </Button>
          </form>
        </Modal>
      )}
    </>
  );
}

function Inventory({ data, query, busy, run }: Context) {
  const [editing, setEditing] = useState<Row>();
  const items = filtered(rows(data, "inventory"), query);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      await run(
        "inventory.adjust",
        string(editing?.id),
        formValues(event.currentTarget),
        "Apply this stock adjustment?",
      )
    )
      setEditing(undefined);
  }
  return (
    <>
      <PageTitle title="Inventory" />
      <Card className="mt-6 overflow-hidden">
        {items.length === 0 ? (
          <Empty label="inventory" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-4">Product / SKU</th>
                  <th>On hand</th>
                  <th>Reserved</th>
                  <th>Available</th>
                  <th>Alert level</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const stock = object(item.inventory);
                  const available =
                    number(stock.quantity) - number(stock.reserved_quantity);
                  return (
                    <tr key={string(item.id)} className="border-t">
                      <td className="p-4">
                        <strong className="block">
                          {string(object(item.products).name)}
                        </strong>
                        <small className="text-slate-500">
                          {string(item.sku)} · {string(item.name)}
                        </small>
                      </td>
                      <td>{number(stock.quantity)}</td>
                      <td>{number(stock.reserved_quantity)}</td>
                      <td>
                        <span
                          className={
                            available <= number(stock.low_stock_threshold)
                              ? "font-extrabold text-rose-600"
                              : "font-bold text-emerald-700"
                          }
                        >
                          {available}
                        </span>
                      </td>
                      <td>{number(stock.low_stock_threshold)}</td>
                      <td>
                        <button
                          onClick={() => setEditing(item)}
                          className="font-bold text-blue-600"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {editing && (
        <Modal
          title={`Adjust ${string(editing.sku)}`}
          onClose={() => setEditing(undefined)}
        >
          <form onSubmit={submit} className="space-y-4">
            <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              Use a positive number to add stock or a negative number to remove
              it.
            </p>
            <Field
              label="Quantity change"
              name="delta"
              type="number"
              required
            />
            <Field
              label="Reason"
              name="reason"
              required
              placeholder="Stock received, damaged unit, correction…"
            />
            <Button type="submit" disabled={busy}>
              Apply adjustment
            </Button>
          </form>
        </Modal>
      )}
    </>
  );
}

function Orders({ data, detail, query, busy, run }: Context) {
  const orders = rows(data, "orders");
  const order = detail
    ? orders.find((item) => item.id === detail || item.order_number === detail)
    : undefined;
  if (order) return <OrderDetail order={order} busy={busy} run={run} />;
  return (
    <>
      <PageTitle title="Orders" />
      <Card className="mt-6 overflow-hidden">
        <SimpleOrderRows orders={filtered(orders, query)} />
      </Card>
    </>
  );
}

function SimpleOrderRows({ orders }: { orders: Row[] }) {
  if (!orders.length) return <Empty label="orders" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="p-4">Order</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Status</th>
            <th>Placed</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={string(order.id)} className="border-t">
              <td className="p-4 font-extrabold">
                {string(order.order_number)}
              </td>
              <td>
                <strong className="block">
                  {string(object(order.profiles).full_name)}
                </strong>
                <small className="text-slate-500">
                  {string(object(order.profiles).email)}
                </small>
              </td>
              <td className="font-bold">{money(order.grand_total)}</td>
              <td>
                <Status value={order.payment_status} />
              </td>
              <td>
                <Status value={order.status} />
              </td>
              <td>{date(order.created_at)}</td>
              <td>
                <Link
                  href={`/admin/orders/${string(order.id)}`}
                  className="font-bold text-blue-600"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrderDetail({
  order,
  busy,
  run,
}: {
  order: Row;
  busy: boolean;
  run: Context["run"];
}) {
  const items = list(order.order_items);
  const shipment = list(order.shipments)[0] ?? {};
  const customer = object(order.profiles);
  const address = object(order.address_snapshot);
  async function statusSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(
      "order.status",
      string(order.id),
      formValues(event.currentTarget),
      "Update this order status?",
    );
  }
  async function trackingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(
      "order.tracking",
      string(order.id),
      formValues(event.currentTarget),
    );
  }
  return (
    <div data-print-order>
      <div data-no-print>
        <PageTitle
          eyebrow="Order management"
          title={string(order.order_number)}
          action={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-extrabold text-white hover:bg-blue-700"
              >
                <Printer size={16} /> Print order
              </button>
              <Link
                href="/admin/orders"
                className="rounded-xl border bg-white px-4 py-2.5 text-sm font-bold text-blue-600"
              >
                Back
              </Link>
            </div>
          }
        />
      </div>
      <div className="mt-6 grid gap-5 xl:grid-cols-[1.3fr_0.8fr]">
        <div className="space-y-5">
          <Card className="p-5">
            <div className="mb-5 flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <strong className="text-2xl font-black tracking-tight text-blue-700">
                  VOLTIXA
                </strong>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                  Order invoice
                </p>
              </div>
              <div className="text-right">
                <strong className="block text-lg">
                  {string(order.order_number)}
                </strong>
                <span className="text-xs text-slate-500">
                  {date(order.created_at)}
                </span>
              </div>
            </div>
            <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <span className="block text-xs font-bold uppercase text-slate-400">
                  Placed
                </span>
                <strong className="mt-1 block">{date(order.created_at)}</strong>
              </div>
              <div>
                <span className="block text-xs font-bold uppercase text-slate-400">
                  Customer
                </span>
                <strong className="mt-1 block">
                  {string(customer.full_name, "Customer")}
                </strong>
                <small>{string(customer.email)}</small>
              </div>
              <div>
                <span className="block text-xs font-bold uppercase text-slate-400">
                  Payment
                </span>
                <strong className="mt-1 block capitalize">
                  {string(order.payment_status).replaceAll("_", " ")}
                </strong>
                <small className="capitalize">
                  {string(order.payment_method).replaceAll("_", " ")}
                </small>
              </div>
              <div>
                <span className="block text-xs font-bold uppercase text-slate-400">
                  Order status
                </span>
                <strong className="mt-1 block capitalize">
                  {string(order.status).replaceAll("_", " ")}
                </strong>
              </div>
            </div>
          </Card>
          <Card className="overflow-hidden">
            <div className="border-b p-5">
              <h2 className="font-extrabold">Order items</h2>
            </div>
            {items.map((item) => (
              <div
                key={string(item.id)}
                className="flex items-center justify-between border-b p-4 text-sm"
              >
                <div>
                  <strong className="block">{string(item.product_name)}</strong>
                  <small className="text-slate-500">
                    {string(item.variant_name)} · {string(item.sku)}
                  </small>
                </div>
                <span>
                  {number(item.quantity)} × {money(item.unit_price)}
                </span>
                <strong>{money(item.line_total)}</strong>
              </div>
            ))}
            <div className="space-y-2 p-5 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <strong>{money(order.subtotal)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <strong>
                  -
                  {money(
                    number(order.discount) + number(order.coupon_discount),
                  )}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <strong>{money(order.shipping)}</strong>
              </div>
              <div className="flex justify-between border-t pt-3 text-base">
                <span>Total</span>
                <strong>{money(order.grand_total)}</strong>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="font-extrabold">Delivery address</h2>
            <div className="mt-3 grid gap-2 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
              {Object.entries(address).map(([key, value]) => (
                <div key={key}>
                  <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {key.replaceAll("_", " ")}
                  </span>
                  <strong className="font-semibold">{string(value)}</strong>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div data-no-print className="space-y-5">
          <Card className="p-5">
            <h2 className="font-extrabold">Order status</h2>
            <form onSubmit={statusSubmit} className="mt-4 space-y-4">
              <select
                name="status"
                defaultValue={string(order.status)}
                className="h-11 w-full rounded-xl border px-3"
              >
                {orderStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
              <Field
                label="Status note"
                name="note"
                placeholder="Reason or internal reference"
              />
              <Button type="submit" disabled={busy}>
                Update status
              </Button>
            </form>
          </Card>
          <Card className="p-5">
            <h2 className="font-extrabold">Shipment tracking</h2>
            <form onSubmit={trackingSubmit} className="mt-4 space-y-4">
              <Field
                label="Courier"
                name="courier"
                defaultValue={shipment.courier}
              />
              <Field
                label="Tracking number"
                name="trackingNumber"
                defaultValue={shipment.tracking_number}
              />
              <Field
                label="Tracking URL"
                name="trackingUrl"
                type="url"
                defaultValue={shipment.tracking_url}
              />
              <Field
                label="Shipment status"
                name="status"
                defaultValue={shipment.status ?? "pending"}
              />
              <Button type="submit" disabled={busy}>
                Save tracking
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Customers({ data, query, busy, run }: Context) {
  const items = filtered(rows(data, "customers"), query);
  return (
    <>
      <PageTitle title="Customers" />
      <Card className="mt-6 overflow-hidden">
        {items.length === 0 ? (
          <Empty label="customers" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-4">Customer</th>
                  <th>Phone</th>
                  <th>Roles</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={string(item.id)} className="border-t">
                    <td className="p-4">
                      <strong className="block">
                        {string(item.full_name, "Unnamed customer")}
                      </strong>
                      <small>{string(item.email)}</small>
                    </td>
                    <td>{string(item.phone)}</td>
                    <td>
                      {list(item.user_roles)
                        .map((role) => string(role.role).replaceAll("_", " "))
                        .join(", ") || "customer"}
                    </td>
                    <td>
                      <Status value={item.account_status} />
                    </td>
                    <td>{date(item.created_at)}</td>
                    <td>
                      <button
                        disabled={busy}
                        onClick={() =>
                          run(
                            "customer.status",
                            string(item.id),
                            {
                              status:
                                item.account_status === "suspended"
                                  ? "active"
                                  : "suspended",
                            },
                            `${item.account_status === "suspended" ? "Activate" : "Suspend"} this account?`,
                          )
                        }
                        className="font-bold text-blue-600"
                      >
                        {item.account_status === "suspended"
                          ? "Activate"
                          : "Suspend"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

function Reviews({ data, query, busy, run }: Context) {
  const items = filtered(rows(data, "reviews"), query);
  return (
    <>
      <PageTitle title="Review moderation" />
      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <Card key={string(item.id)} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <strong>{string(object(item.products).name)}</strong>
                <p className="text-xs text-slate-500">
                  {string(object(item.profiles).full_name)} ·{" "}
                  {date(item.created_at)}
                </p>
              </div>
              <Status value={item.status} />
            </div>
            <div className="mt-3 text-amber-500">
              {"★".repeat(number(item.rating))}
              {"☆".repeat(Math.max(0, 5 - number(item.rating)))}
            </div>
            <h3 className="mt-2 font-bold">{string(item.title)}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {string(item.body)}
            </p>
            <div className="mt-4 flex gap-2">
              <Button
                disabled={busy}
                onClick={() =>
                  run("review.status", string(item.id), { status: "approved" })
                }
              >
                Approve
              </Button>
              <Button
                tone="danger"
                disabled={busy}
                onClick={() =>
                  run(
                    "review.status",
                    string(item.id),
                    { status: "rejected" },
                    "Reject this review?",
                  )
                }
              >
                Reject
              </Button>
            </div>
          </Card>
        ))}
      </div>
      {!items.length && (
        <Card className="mt-6">
          <Empty label="reviews" />
        </Card>
      )}
    </>
  );
}

function Complaints({ data, query, busy, run }: Context) {
  const [editing, setEditing] = useState<Row>();
  const items = filtered(rows(data, "complaints"), query);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      await run(
        "complaint.status",
        string(editing?.id),
        formValues(event.currentTarget),
      )
    )
      setEditing(undefined);
  }
  return (
    <>
      <PageTitle title="Complaints & support" />
      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <Card key={string(item.id)} className="p-5">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <strong>{string(item.subject)}</strong>
                <p className="text-xs text-slate-500">
                  {string(object(item.profiles).full_name)} ·{" "}
                  {string(object(item.orders).order_number)} ·{" "}
                  {date(item.created_at)}
                </p>
              </div>
              <Status value={item.status} />
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {string(item.description)}
            </p>
            {item.resolution ? (
              <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
                <strong>Resolution:</strong> {string(item.resolution)}
              </p>
            ) : null}
            <Button tone="secondary" onClick={() => setEditing(item)}>
              Update case
            </Button>
          </Card>
        ))}
      </div>
      {!items.length && (
        <Card className="mt-6">
          <Empty label="complaints" />
        </Card>
      )}
      {editing && (
        <Modal title="Update complaint" onClose={() => setEditing(undefined)}>
          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm font-bold">
              Status
              <select
                name="status"
                defaultValue={string(editing.status)}
                className="mt-1.5 h-11 w-full rounded-xl border px-3 font-normal"
              >
                {[
                  "open",
                  "awaiting_customer",
                  "in_review",
                  "approved",
                  "rejected",
                  "resolved",
                  "closed",
                ].map((value) => (
                  <option key={value} value={value}>
                    {value.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <Textarea
              label="Resolution"
              name="resolution"
              defaultValue={editing.resolution}
            />
            <Button type="submit" disabled={busy}>
              Save case
            </Button>
          </form>
        </Modal>
      )}
    </>
  );
}

function Warranties({ data, query, busy, run }: Context) {
  const items = filtered(rows(data, "warranties"), query);
  return (
    <>
      <PageTitle title="Warranties & claims" />
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {items.map((warranty) => (
          <Card key={string(warranty.id)} className="p-5">
            <div className="flex justify-between">
              <div>
                <strong>
                  {string(object(warranty.order_items).product_name)}
                </strong>
                <p className="text-xs text-slate-500">
                  {string(object(warranty.profiles).full_name)} · S/N{" "}
                  {string(warranty.serial_number)}
                </p>
              </div>
              <Status
                value={
                  new Date(String(warranty.expires_at)) > new Date()
                    ? "active"
                    : "expired"
                }
              />
            </div>
            <p className="mt-3 text-sm">
              Provider: <strong>{string(warranty.provider)}</strong> · Expires{" "}
              {date(warranty.expires_at)}
            </p>
            <div className="mt-4 space-y-3">
              {list(warranty.warranty_claims).map((claim) => (
                <div
                  key={string(claim.id)}
                  className="rounded-xl bg-slate-50 p-3"
                >
                  <div className="flex justify-between">
                    <strong className="text-sm">Claim</strong>
                    <Status value={claim.status} />
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {string(claim.description)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["in_review", "approved", "rejected", "resolved"].map(
                      (status) => (
                        <button
                          disabled={busy}
                          key={status}
                          onClick={() =>
                            run("warranty.status", string(claim.id), { status })
                          }
                          className="text-xs font-bold text-blue-600"
                        >
                          {status.replaceAll("_", " ")}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
      {!items.length && (
        <Card className="mt-6">
          <Empty label="warranties" />
        </Card>
      )}
    </>
  );
}

function Coupons({ data, query, busy, run }: Context) {
  const [editor, setEditor] = useState<Row | null>();
  const items = filtered(rows(data, "coupons"), query);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      await run(
        "coupon.save",
        editor ? string(editor.id) : undefined,
        formValues(event.currentTarget),
      )
    )
      setEditor(undefined);
  }
  return (
    <>
      <PageTitle
        title="Coupons"
        action={
          <Button onClick={() => setEditor(null)}>
            <Plus size={16} /> Add coupon
          </Button>
        }
      />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Card key={string(item.id)} className="p-5">
            <div className="flex justify-between">
              <strong className="text-xl">{string(item.code)}</strong>
              <Status value={item.is_active ? "active" : "inactive"} />
            </div>
            <p className="mt-3 text-sm text-slate-600">
              {item.discount_type === "percent"
                ? `${number(item.discount_value)}% off`
                : `${money(item.discount_value)} off`}{" "}
              · Min {money(item.minimum_subtotal)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {date(item.starts_at)} – {date(item.ends_at)}
            </p>
            <div className="mt-4 flex gap-2">
              <Button tone="secondary" onClick={() => setEditor(item)}>
                Edit
              </Button>
              <Button
                tone={item.is_active ? "danger" : "secondary"}
                onClick={() =>
                  run("coupon.toggle", string(item.id), {
                    enabled: !item.is_active,
                  })
                }
              >
                {item.is_active ? "Disable" : "Enable"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
      {!items.length && (
        <Card className="mt-6">
          <Empty label="coupons" />
        </Card>
      )}
      {editor !== undefined && (
        <Modal
          title={`${editor ? "Edit" : "Add"} coupon`}
          onClose={() => setEditor(undefined)}
        >
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Coupon code"
              name="code"
              required
              defaultValue={editor?.code}
            />
            <label className="block text-sm font-bold">
              Discount type
              <select
                name="discountType"
                defaultValue={string(editor?.discount_type, "percent")}
                className="mt-1.5 h-11 w-full rounded-xl border px-3 font-normal"
              >
                <option value="percent">Percent</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </label>
            <Field
              label="Discount value"
              name="discountValue"
              type="number"
              required
              defaultValue={editor?.discount_value}
            />
            <Field
              label="Minimum subtotal"
              name="minimumSubtotal"
              type="number"
              defaultValue={editor?.minimum_subtotal ?? 0}
            />
            <Field
              label="Maximum discount"
              name="maximumDiscount"
              type="number"
              defaultValue={editor?.maximum_discount}
            />
            <Field
              label="Total usage limit"
              name="usageLimit"
              type="number"
              defaultValue={editor?.usage_limit}
            />
            <Field
              label="Per-user limit"
              name="perUserLimit"
              type="number"
              defaultValue={editor?.per_user_limit ?? 1}
            />
            <Field
              label="Starts at"
              name="startsAt"
              type="datetime-local"
              defaultValue={
                editor?.starts_at
                  ? String(editor.starts_at).slice(0, 16)
                  : new Date().toISOString().slice(0, 16)
              }
            />
            <Field
              label="Ends at"
              name="endsAt"
              type="datetime-local"
              required
              defaultValue={
                editor?.ends_at ? String(editor.ends_at).slice(0, 16) : ""
              }
            />
            <div className="flex items-end">
              <Check
                label="Coupon active"
                name="isActive"
                defaultChecked={editor?.is_active !== false}
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={busy}>
                Save coupon
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

function Promotions({ data, query, busy, run }: Context) {
  const [editor, setEditor] = useState<Row | null>();
  const items = filtered(rows(data, "collections"), query);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      await run(
        "collection.save",
        editor ? string(editor.id) : undefined,
        formValues(event.currentTarget),
      )
    )
      setEditor(undefined);
  }
  return (
    <>
      <PageTitle
        title="Promotions & collections"
        action={
          <Button onClick={() => setEditor(null)}>
            <Plus size={16} /> Add collection
          </Button>
        }
      />
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Card key={string(item.id)} className="p-5">
            <div className="flex justify-between">
              <strong>{string(item.name)}</strong>
              <Status value={item.is_visible ? "visible" : "hidden"} />
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {string(item.description, "No description")}
            </p>
            <p className="mt-2 text-xs">
              {list(item.collection_products).length} products
            </p>
            <div className="mt-4 flex gap-2">
              <Button tone="secondary" onClick={() => setEditor(item)}>
                Edit
              </Button>
              <Button
                tone={item.is_visible ? "danger" : "secondary"}
                onClick={() =>
                  run("collection.toggle", string(item.id), {
                    enabled: !item.is_visible,
                  })
                }
              >
                {item.is_visible ? "Hide" : "Show"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
      {!items.length && (
        <Card className="mt-6">
          <Empty label="collections" />
        </Card>
      )}
      {editor !== undefined && (
        <Modal
          title={`${editor ? "Edit" : "Add"} collection`}
          onClose={() => setEditor(undefined)}
        >
          <form onSubmit={submit} className="space-y-4">
            <Field
              label="Name"
              name="name"
              required
              defaultValue={editor?.name}
            />
            <Field label="Slug" name="slug" defaultValue={editor?.slug} />
            <Textarea
              label="Description"
              name="description"
              defaultValue={editor?.description}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Starts at"
                name="startsAt"
                type="datetime-local"
                defaultValue={
                  editor?.starts_at ? String(editor.starts_at).slice(0, 16) : ""
                }
              />
              <Field
                label="Ends at"
                name="endsAt"
                type="datetime-local"
                defaultValue={
                  editor?.ends_at ? String(editor.ends_at).slice(0, 16) : ""
                }
              />
            </div>
            <Field
              label="Sort order"
              name="sortOrder"
              type="number"
              defaultValue={editor?.sort_order ?? 0}
            />
            <Check
              label="Visible"
              name="isVisible"
              defaultChecked={editor?.is_visible !== false}
            />
            <Button type="submit" disabled={busy}>
              Save collection
            </Button>
          </form>
        </Modal>
      )}
    </>
  );
}

function Banners({
  data,
  query,
  busy,
  run,
  title,
}: Context & { title: string }) {
  const [editor, setEditor] = useState<Row | null>();
  const items = filtered(rows(data, "banners"), query);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      await run(
        "banner.save",
        editor ? string(editor.id) : undefined,
        formValues(event.currentTarget),
      )
    )
      setEditor(undefined);
  }
  return (
    <>
      <PageTitle
        title={title}
        action={
          <Button onClick={() => setEditor(null)}>
            <Plus size={16} /> Add banner
          </Button>
        }
      />
      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <Card key={string(item.id)} className="overflow-hidden">
            <div
              className="h-28 p-5 text-white"
              style={{
                backgroundColor: string(item.background_color, "#1d4ed8"),
              }}
            >
              <div className="flex justify-between">
                <div>
                  <h2 className="text-xl font-extrabold">
                    {string(item.title)}
                  </h2>
                  <p className="mt-1 text-sm text-white/80">
                    {string(item.subtitle, "")}
                  </p>
                </div>
                <Status value={item.is_visible ? "visible" : "hidden"} />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <span>
                {string(item.href, "No link")} · Sort {number(item.sort_order)}
              </span>
              <div className="flex gap-2">
                <Button tone="secondary" onClick={() => setEditor(item)}>
                  Edit
                </Button>
                <Button
                  tone={item.is_visible ? "danger" : "secondary"}
                  onClick={() =>
                    run("banner.toggle", string(item.id), {
                      enabled: !item.is_visible,
                    })
                  }
                >
                  {item.is_visible ? "Hide" : "Show"}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {!items.length && (
        <Card className="mt-6">
          <Empty label="banners" />
        </Card>
      )}
      {editor !== undefined && (
        <Modal
          title={`${editor ? "Edit" : "Add"} banner`}
          onClose={() => setEditor(undefined)}
        >
          <form onSubmit={submit} className="space-y-4">
            <Field
              label="Title"
              name="title"
              required
              defaultValue={editor?.title}
            />
            <Field
              label="Subtitle"
              name="subtitle"
              defaultValue={editor?.subtitle}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <MediaField
                label="Desktop image"
                name="desktopPath"
                bucket="homepage-banners"
                defaultValue={editor?.desktop_path}
              />
              <MediaField
                label="Mobile image"
                name="mobilePath"
                bucket="homepage-banners"
                defaultValue={editor?.mobile_path}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Click destination"
                name="href"
                defaultValue={editor?.href}
              />
              <Field
                label="Background colour"
                name="backgroundColor"
                type="color"
                defaultValue={editor?.background_color ?? "#1d4ed8"}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Starts at"
                name="startsAt"
                type="datetime-local"
                defaultValue={
                  editor?.starts_at ? String(editor.starts_at).slice(0, 16) : ""
                }
              />
              <Field
                label="Ends at"
                name="endsAt"
                type="datetime-local"
                defaultValue={
                  editor?.ends_at ? String(editor.ends_at).slice(0, 16) : ""
                }
              />
            </div>
            <Field
              label="Sort order"
              name="sortOrder"
              type="number"
              defaultValue={editor?.sort_order ?? 0}
            />
            <Check
              label="Visible"
              name="isVisible"
              defaultChecked={editor?.is_visible !== false}
            />
            <Button type="submit" disabled={busy}>
              Save banner
            </Button>
          </form>
        </Modal>
      )}
    </>
  );
}

function Payments({ data, query, busy, run }: Context) {
  const items = filtered(rows(data, "payments"), query);
  return (
    <>
      <PageTitle title="Payments" />
      <Card className="mt-6 overflow-hidden">
        {items.length === 0 ? (
          <Empty label="payments" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-4">Order</th>
                  <th>Provider</th>
                  <th>Reference</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Update</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={string(item.id)} className="border-t">
                    <td className="p-4 font-bold">
                      {string(object(item.orders).order_number)}
                    </td>
                    <td>{string(item.provider)}</td>
                    <td>{string(item.provider_reference)}</td>
                    <td>{money(item.amount)}</td>
                    <td>
                      <Status value={item.status} />
                    </td>
                    <td>
                      <select
                        disabled={busy}
                        value={string(item.status)}
                        onChange={(event) =>
                          run(
                            "payment.status",
                            string(item.id),
                            { status: event.target.value },
                            "Update payment status?",
                          )
                        }
                        className="h-9 rounded-lg border px-2"
                      >
                        {[
                          "pending",
                          "authorized",
                          "paid",
                          "failed",
                          "refunded",
                          "partially_refunded",
                        ].map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

function Shipments({ data, query, busy, run }: Context) {
  const [editing, setEditing] = useState<Row>();
  const items = filtered(rows(data, "shipments"), query);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      await run("shipment.save", string(editing?.id), {
        ...formValues(event.currentTarget),
        orderId: editing?.order_id,
      })
    )
      setEditing(undefined);
  }
  return (
    <>
      <PageTitle title="Shipments" />
      <Card className="mt-6 overflow-hidden">
        {items.length === 0 ? (
          <Empty label="shipments" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-4">Order</th>
                  <th>Courier</th>
                  <th>Tracking</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={string(item.id)} className="border-t">
                    <td className="p-4 font-bold">
                      {string(object(item.orders).order_number)}
                    </td>
                    <td>{string(item.courier)}</td>
                    <td>{string(item.tracking_number)}</td>
                    <td>
                      <Status value={item.status} />
                    </td>
                    <td>{date(item.updated_at)}</td>
                    <td>
                      <button
                        onClick={() => setEditing(item)}
                        className="font-bold text-blue-600"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {editing && (
        <Modal title="Update shipment" onClose={() => setEditing(undefined)}>
          <form onSubmit={submit} className="space-y-4">
            <Field
              label="Courier"
              name="courier"
              defaultValue={editing.courier}
            />
            <Field
              label="Tracking number"
              name="trackingNumber"
              defaultValue={editing.tracking_number}
            />
            <Field
              label="Tracking URL"
              name="trackingUrl"
              type="url"
              defaultValue={editing.tracking_url}
            />
            <Field label="Status" name="status" defaultValue={editing.status} />
            <Button type="submit" disabled={busy}>
              Save shipment
            </Button>
          </form>
        </Modal>
      )}
    </>
  );
}

function Blog({ data, query, busy, run }: Context) {
  const [editor, setEditor] = useState<Row | null>();
  const items = filtered(rows(data, "blog"), query);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      await run(
        "blog.save",
        editor ? string(editor.id) : undefined,
        formValues(event.currentTarget),
      )
    )
      setEditor(undefined);
  }
  return (
    <>
      <PageTitle
        title="Blog"
        action={
          <Button onClick={() => setEditor(null)}>
            <Plus size={16} /> New post
          </Button>
        }
      />
      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <Card key={string(item.id)} className="p-5">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <h2 className="font-extrabold">{string(item.title)}</h2>
                <p className="text-xs text-slate-500">
                  /{string(item.slug)} · {date(item.created_at)}
                </p>
              </div>
              <Status value={item.status} />
            </div>
            <p className="mt-3 text-sm text-slate-600">
              {string(item.excerpt, "No excerpt")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button tone="secondary" onClick={() => setEditor(item)}>
                Edit
              </Button>
              {["draft", "published", "archived"]
                .filter((status) => status !== item.status)
                .map((status) => (
                  <Button
                    key={status}
                    tone={status === "archived" ? "danger" : "secondary"}
                    disabled={busy}
                    onClick={() =>
                      run("blog.status", string(item.id), { status })
                    }
                  >
                    {status}
                  </Button>
                ))}
            </div>
          </Card>
        ))}
      </div>
      {!items.length && (
        <Card className="mt-6">
          <Empty label="blog posts" />
        </Card>
      )}
      {editor !== undefined && (
        <Modal
          title={`${editor ? "Edit" : "New"} post`}
          onClose={() => setEditor(undefined)}
        >
          <form onSubmit={submit} className="space-y-4">
            <Field
              label="Title"
              name="title"
              required
              defaultValue={editor?.title}
            />
            <Field label="Slug" name="slug" defaultValue={editor?.slug} />
            <label className="block text-sm font-bold">
              Category
              <select
                name="categoryId"
                defaultValue={string(editor?.category_id, "")}
                className="mt-1.5 h-11 w-full rounded-xl border px-3 font-normal"
              >
                <option value="">Uncategorised</option>
                {rows(data, "blogCategories").map((item) => (
                  <option key={string(item.id)} value={string(item.id)}>
                    {string(item.name)}
                  </option>
                ))}
              </select>
            </label>
            <Textarea
              label="Excerpt"
              name="excerpt"
              defaultValue={editor?.excerpt}
            />
            <Textarea
              label="Body"
              name="body"
              required
              defaultValue={editor?.body}
            />
            <MediaField
              label="Cover image"
              name="coverPath"
              bucket="blog-images"
              defaultValue={editor?.cover_path}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="SEO title"
                name="seoTitle"
                defaultValue={editor?.seo_title}
              />
              <Field
                label="SEO description"
                name="seoDescription"
                defaultValue={editor?.seo_description}
              />
            </div>
            <label className="block text-sm font-bold">
              Status
              <select
                name="status"
                defaultValue={string(editor?.status, "draft")}
                className="mt-1.5 h-11 w-full rounded-xl border px-3 font-normal"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <Button type="submit" disabled={busy}>
              Save post
            </Button>
          </form>
        </Modal>
      )}
    </>
  );
}

function Faqs({ data, query, busy, run }: Context) {
  const [editor, setEditor] = useState<Row | null>();
  const items = filtered(rows(data, "faqs"), query);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      await run(
        "faq.save",
        editor ? string(editor.id) : undefined,
        formValues(event.currentTarget),
      )
    )
      setEditor(undefined);
  }
  return (
    <>
      <PageTitle
        title="FAQs"
        action={
          <Button onClick={() => setEditor(null)}>
            <Plus size={16} /> Add FAQ
          </Button>
        }
      />
      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <Card key={string(item.id)} className="p-5">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <strong>{string(item.question)}</strong>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {string(item.answer)}
                </p>
                <small className="text-slate-500">
                  {string(item.category, "General")}
                </small>
              </div>
              <Status value={item.is_visible ? "visible" : "hidden"} />
            </div>
            <div className="mt-4 flex gap-2">
              <Button tone="secondary" onClick={() => setEditor(item)}>
                Edit
              </Button>
              <Button
                tone={item.is_visible ? "danger" : "secondary"}
                onClick={() =>
                  run("faq.toggle", string(item.id), {
                    enabled: !item.is_visible,
                  })
                }
              >
                {item.is_visible ? "Hide" : "Show"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
      {!items.length && (
        <Card className="mt-6">
          <Empty label="FAQs" />
        </Card>
      )}
      {editor !== undefined && (
        <Modal
          title={`${editor ? "Edit" : "Add"} FAQ`}
          onClose={() => setEditor(undefined)}
        >
          <form onSubmit={submit} className="space-y-4">
            <Field
              label="Question"
              name="question"
              required
              defaultValue={editor?.question}
            />
            <Textarea
              label="Answer"
              name="answer"
              required
              defaultValue={editor?.answer}
            />
            <Field
              label="Category"
              name="category"
              defaultValue={editor?.category}
            />
            <Field
              label="Sort order"
              name="sortOrder"
              type="number"
              defaultValue={editor?.sort_order ?? 0}
            />
            <Check
              label="Visible"
              name="isVisible"
              defaultChecked={editor?.is_visible !== false}
            />
            <Button type="submit" disabled={busy}>
              Save FAQ
            </Button>
          </form>
        </Modal>
      )}
    </>
  );
}

function Notifications({ data, query, busy, run }: Context) {
  const items = filtered(rows(data, "notifications"), query);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      await run("notification.send", undefined, formValues(event.currentTarget))
    )
      event.currentTarget.reset();
  }
  return (
    <>
      <PageTitle title="Notifications" />
      <div className="mt-6 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="p-5">
          <h2 className="font-extrabold">Send notification</h2>
          <form onSubmit={submit} className="mt-4 space-y-4">
            <Field label="Title" name="title" required />
            <Textarea label="Message" name="body" required />
            <Field label="Customer user ID (optional)" name="userId" />
            <Field
              label="Deep link (optional)"
              name="deepLink"
              placeholder="/deals"
            />
            <Field label="Type" name="type" defaultValue="admin_announcement" />
            <Button type="submit" disabled={busy}>
              Send notification
            </Button>
          </form>
        </Card>
        <Card className="overflow-hidden">
          <div className="border-b p-5">
            <h2 className="font-extrabold">Delivery history</h2>
          </div>
          {items.length === 0 ? (
            <Empty label="notifications" />
          ) : (
            items.map((item) => (
              <div key={string(item.id)} className="border-b p-4">
                <div className="flex justify-between">
                  <strong>{string(item.title)}</strong>
                  <small className="text-slate-500">
                    {date(item.created_at, true)}
                  </small>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {string(item.body)}
                </p>
                <small className="text-slate-400">
                  {item.user_id
                    ? `Customer ${string(item.user_id)}`
                    : "All customers"}
                </small>
              </div>
            ))
          )}
        </Card>
      </div>
    </>
  );
}

function Reports({ data }: Context) {
  const orders = rows(data, "orders");
  const total = orders.reduce(
    (sum, order) => sum + number(order.grand_total),
    0,
  );
  const paid = orders
    .filter((order) => order.payment_status === "paid")
    .reduce((sum, order) => sum + number(order.grand_total), 0);
  return (
    <>
      <PageTitle title="Reports" />
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-slate-500">Gross order value</p>
          <strong className="mt-2 block text-2xl">{money(total)}</strong>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Paid revenue</p>
          <strong className="mt-2 block text-2xl">{money(paid)}</strong>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Average order</p>
          <strong className="mt-2 block text-2xl">
            {money(orders.length ? total / orders.length : 0)}
          </strong>
        </Card>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          ["Orders report", "orders", "Order totals, statuses and addresses"],
          [
            "Product report",
            "products",
            "Catalog lifecycle and product metadata",
          ],
          [
            "Customer report",
            "customers",
            "Customer profiles and account status",
          ],
          ["Inventory report", "inventory", "Variant stock and alert levels"],
          [
            "Payments report",
            "payments",
            "Provider references and payment states",
          ],
        ].map(([label, kind, description]) => (
          <Card key={kind} className="p-5">
            <FileText className="text-blue-600" />
            <h2 className="mt-3 font-extrabold">{label}</h2>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
            <a
              href={`/api/admin?export=${kind}`}
              className="mt-4 inline-flex font-bold text-blue-600"
            >
              Download CSV
            </a>
          </Card>
        ))}
      </div>
    </>
  );
}

function Staff({ data, query, busy, run, role }: Context & { role: string }) {
  const staff = filtered(
    rows(data, "customers").filter((item) =>
      list(item.user_roles).some((entry) => entry.role !== "customer"),
    ),
    query,
  );
  const roles = [
    "super_admin",
    "admin",
    "catalog_manager",
    "order_manager",
    "support_agent",
    "content_manager",
    "finance_manager",
    "analyst",
  ];
  return (
    <>
      <PageTitle title="Staff & roles" />
      {role !== "super_admin" && (
        <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          Only a super admin can change staff access.
        </p>
      )}
      <Card className="mt-6 overflow-hidden">
        {staff.length === 0 ? (
          <Empty label="staff accounts" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-4">Staff member</th>
                  <th>Current access</th>
                  <th>Account</th>
                  <th>Change role</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((item) => {
                  const current = list(item.user_roles).find(
                    (entry) => entry.role !== "customer",
                  );
                  return (
                    <tr key={string(item.id)} className="border-t">
                      <td className="p-4">
                        <strong className="block">
                          {string(item.full_name)}
                        </strong>
                        <small>{string(item.email)}</small>
                      </td>
                      <td>
                        <Status value={current?.role} />
                      </td>
                      <td>
                        <Status value={item.account_status} />
                      </td>
                      <td>
                        <select
                          disabled={busy || role !== "super_admin"}
                          defaultValue={string(current?.role)}
                          onChange={(event) =>
                            run(
                              "staff.role",
                              string(item.id),
                              { role: event.target.value },
                              "Change this staff member's role?",
                            )
                          }
                          className="h-10 rounded-xl border px-3"
                        >
                          {roles.map((value) => (
                            <option key={value} value={value}>
                              {value.replaceAll("_", " ")}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

function SiteSettings({ data, query, busy, run }: Context) {
  const settings = filtered(rows(data, "settings"), query);
  const [editing, setEditing] = useState<Row | null>();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await run("settings.save", undefined, formValues(event.currentTarget)))
      setEditing(undefined);
  }
  return (
    <>
      <PageTitle
        title="Site settings"
        action={
          <Button onClick={() => setEditing(null)}>
            <Plus size={16} /> Add setting
          </Button>
        }
      />
      <p className="mt-3 max-w-3xl text-sm text-slate-500">
        Store configuration is saved as structured JSON in Supabase. Public
        settings can be read by storefront features; private settings remain
        admin-only.
      </p>
      <div className="mt-6 space-y-3">
        {settings.map((item) => (
          <Card
            key={string(item.key)}
            className="flex flex-wrap items-center justify-between gap-4 p-4"
          >
            <div>
              <strong>{string(item.key)}</strong>
              <pre className="mt-1 max-w-2xl overflow-hidden text-xs text-slate-500">
                {JSON.stringify(item.value)}
              </pre>
            </div>
            <div className="flex items-center gap-3">
              <Status value={item.is_public ? "public" : "private"} />
              <Button tone="secondary" onClick={() => setEditing(item)}>
                Edit
              </Button>
            </div>
          </Card>
        ))}
      </div>
      {!settings.length && (
        <Card className="mt-6">
          <Empty label="settings" />
        </Card>
      )}
      {editing !== undefined && (
        <Modal
          title={`${editing ? "Edit" : "Add"} setting`}
          onClose={() => setEditing(undefined)}
        >
          <form onSubmit={submit} className="space-y-4">
            <Field
              label="Key"
              name="key"
              required
              defaultValue={editing?.key}
            />
            <Textarea
              label="JSON value"
              name="value"
              required
              defaultValue={
                editing
                  ? JSON.stringify(editing.value, null, 2)
                  : '{\n  "value": ""\n}'
              }
            />
            <Check
              label="Public storefront setting"
              name="isPublic"
              defaultChecked={Boolean(editing?.is_public)}
            />
            <Button type="submit" disabled={busy}>
              Save setting
            </Button>
          </form>
        </Modal>
      )}
    </>
  );
}

function AuditLogs({ data, query }: Context) {
  const items = filtered(rows(data, "auditLogs"), query);
  return (
    <>
      <PageTitle title="Audit logs" />
      <Card className="mt-6 overflow-hidden">
        {items.length === 0 ? (
          <Empty label="audit events" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-4">Time</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Record</th>
                  <th>Change</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={string(item.id)} className="border-t align-top">
                    <td className="p-4">{date(item.created_at, true)}</td>
                    <td>
                      {string(
                        object(item.profiles).full_name,
                        string(object(item.profiles).email),
                      )}
                    </td>
                    <td className="font-bold">{string(item.action)}</td>
                    <td>{string(item.entity_type)}</td>
                    <td className="max-w-40 truncate">
                      {string(item.entity_id)}
                    </td>
                    <td>
                      <details>
                        <summary className="cursor-pointer font-bold text-blue-600">
                          View
                        </summary>
                        <pre className="mt-2 max-w-md whitespace-pre-wrap rounded-lg bg-slate-50 p-2 text-xs">
                          {JSON.stringify(
                            { before: item.old_values, after: item.new_values },
                            null,
                            2,
                          )}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
