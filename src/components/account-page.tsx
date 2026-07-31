"use client";
import Link from "next/link";
import {
  Bell,
  Box,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Heart,
  Home,
  LifeBuoy,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  Pencil,
  Plus,
  RotateCcw,
  ShieldCheck,
  Star,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { products } from "@/lib/data";
import { useShop } from "@/lib/store";
import { ProductCard } from "./product-card";
import { StoreLayout } from "./store-layout";

const nav = [
  ["Overview", "/account", UserRound],
  ["Profile", "/account/profile", CircleUserRound],
  ["Orders", "/account/orders", Package],
  ["Wishlist", "/account/wishlist", Heart],
  ["Addresses", "/account/addresses", MapPin],
  ["Reviews", "/account/reviews", Star],
  ["Complaints", "/account/complaints", LifeBuoy],
  ["Notifications", "/account/notifications", Bell],
];

type AccountUser = {
  name: string;
  email: string;
  phone: string;
  preferredLanguage: string;
  roles: string[];
  orderCount: number;
};

type AddressRecord = {
  id: string;
  recipient_name: string;
  phone: string;
  alternate_phone: string | null;
  province: string;
  city: string;
  area: string;
  address_line: string;
  landmark: string | null;
  postal_code: string | null;
  label: string;
  is_default: boolean;
};

type OrderRecord = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  grand_total: number | string;
  created_at: string;
  order_items: {
    id: string;
    product_name: string;
    variant_name: string;
    sku: string;
    quantity: number;
    line_total: number | string;
  }[];
  shipments: {
    courier: string | null;
    tracking_number: string | null;
    status: string;
  }[];
};

type ComplaintRecord = {
  id: string;
  order_id: string | null;
  category: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  resolution: string | null;
  created_at: string;
  orders: { order_number: string } | { order_number: string }[] | null;
};

type NotificationRecord = {
  id: string;
  title: string;
  body: string;
  type: string;
  deep_link: string | null;
  read_at: string | null;
  created_at: string;
};

type ReviewRecord = {
  id: string;
  rating: number;
  title: string;
  body: string;
  status: string;
  created_at: string;
  products: { name: string } | { name: string }[] | null;
};

export function AccountPage({
  path,
  user,
  addresses,
  orders,
  complaints,
  notifications,
  reviews,
}: {
  path: string[];
  user: AccountUser;
  addresses: AddressRecord[];
  orders: OrderRecord[];
  complaints: ComplaintRecord[];
  notifications: NotificationRecord[];
  reviews: ReviewRecord[];
}) {
  const router = useRouter();
  const section = path[0] ?? "overview",
    { wishlist } = useShop(),
    wished = products.filter((p) => wishlist.includes(p.id));
  const isStaff = user.roles.some((role) =>
    [
      "super_admin",
      "admin",
      "catalog_manager",
      "order_manager",
      "support_agent",
      "content_manager",
      "finance_manager",
      "analyst",
    ].includes(role),
  );
  async function logout() {
    const supabase = createClient();
    await supabase?.auth.signOut();
    router.replace("/login");
    router.refresh();
  }
  return (
    <StoreLayout>
      <div className="container-shell py-8">
        <div className="grid min-w-0 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="h-fit min-w-0 max-w-full overflow-hidden rounded-2xl border bg-white p-4 lg:sticky lg:top-28">
            <div className="flex items-center gap-3 border-b p-2 pb-5">
              <span className="grid size-12 place-items-center rounded-full bg-blue-50 text-blue-600">
                <CircleUserRound />
              </span>
              <div className="min-w-0">
                <strong className="block truncate text-sm">{user.name}</strong>
                <span className="block truncate text-xs text-slate-500">
                  {user.email}
                </span>
              </div>
            </div>
            <nav className="scrollbar-hide mt-3 flex min-w-0 max-w-full gap-2 overflow-x-auto overscroll-x-contain lg:block">
              {isStaff && (
                <Link
                  href="/admin"
                  className="mb-2 flex shrink-0 items-center gap-3 rounded-xl bg-blue-600 px-3 py-3 text-sm font-extrabold text-white hover:bg-blue-700"
                >
                  <LayoutDashboard size={18} /> Admin Panel
                </Link>
              )}
              {nav.map(([label, href, Icon]) => (
                <Link
                  key={label as string}
                  href={href as string}
                  className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold hover:bg-slate-50 ${section === (label as string).toLowerCase() || (section === "overview" && label === "Overview") ? "bg-blue-50 text-blue-700" : "text-slate-600"}`}
                >
                  <Icon size={18} />
                  {label as string}
                </Link>
              ))}
              <button
                onClick={logout}
                className="flex w-auto shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 lg:w-full"
              >
                <LogOut size={18} /> Sign out
              </button>
            </nav>
          </aside>
          <div className="min-w-0">
            {section === "overview" && (
              <Overview user={user} isStaff={isStaff} />
            )}
            {section === "profile" && <Profile user={user} />}
            {section === "orders" && <Orders orders={orders} />}
            {section === "wishlist" && (
              <>
                <Title
                  title="My wishlist"
                  sub={`${wished.length} saved products`}
                />
                {wished.length ? (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                    {wished.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                ) : (
                  <Empty
                    icon={Heart}
                    title="Nothing saved yet"
                    text="Tap the heart on a product to keep it here."
                  />
                )}
              </>
            )}
            {section === "addresses" && (
              <Addresses initialAddresses={addresses} user={user} />
            )}
            {section === "reviews" && <Reviews reviews={reviews} />}
            {section === "complaints" && (
              <Complaints initialComplaints={complaints} orders={orders} />
            )}
            {section === "notifications" && (
              <>
                <Title
                  title="Notifications"
                  sub="Order, support and promotional updates"
                />
                {notifications.length ? (
                  <div className="space-y-3">
                    {notifications.map((notification) => {
                      const body = (
                        <div className="flex gap-3 rounded-2xl border bg-white p-5">
                          <span
                            className={`mt-1 size-2 shrink-0 rounded-full ${
                              notification.read_at
                                ? "bg-slate-300"
                                : "bg-blue-600"
                            }`}
                          />
                          <div>
                            <strong className="text-sm">
                              {notification.title}
                            </strong>
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              {notification.body}
                            </p>
                            <span className="mt-2 block text-[11px] text-slate-400">
                              {new Date(notification.created_at).toLocaleString(
                                "en-PK",
                              )}
                            </span>
                          </div>
                        </div>
                      );
                      return notification.deep_link ? (
                        <Link
                          key={notification.id}
                          href={notification.deep_link}
                        >
                          {body}
                        </Link>
                      ) : (
                        <div key={notification.id}>{body}</div>
                      );
                    })}
                  </div>
                ) : (
                  <Empty
                    icon={Bell}
                    title="No notifications"
                    text="Order and support updates will appear here."
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
function Title({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-extrabold">{title}</h1>
      <p className="mt-1 text-sm text-slate-500">{sub}</p>
    </div>
  );
}
function Overview({ user, isStaff }: { user: AccountUser; isStaff: boolean }) {
  return (
    <>
      <Title
        title={`Welcome, ${user.name}`}
        sub="Your secure Supabase customer dashboard."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          [Box, String(user.orderCount), "Orders"],
          [Heart, "0", "Wishlist items"],
          [ShieldCheck, isStaff ? "Admin" : "Customer", "Access level"],
        ].map(([Icon, n, label]) => (
          <div
            key={label as string}
            className="rounded-2xl border bg-white p-5"
          >
            <Icon className="text-blue-600" />
            <strong className="mt-4 block text-3xl">{n as string}</strong>
            <span className="text-sm text-slate-500">{label as string}</span>
          </div>
        ))}
      </div>
      {isStaff && (
        <Link
          href="/admin"
          className="mt-6 flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-800 transition hover:bg-blue-100"
        >
          <span className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-blue-600 text-white">
              <LayoutDashboard size={21} />
            </span>
            <span>
              <strong className="block">Open Admin Panel</strong>
              <small>
                Manage products, orders, customers and store content
              </small>
            </span>
          </span>
          <ChevronRight size={20} />
        </Link>
      )}
      <div className="mt-6 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 p-7 text-white">
        <h2 className="text-xl font-extrabold">Complete your profile</h2>
        <p className="mt-2 text-sm text-blue-50">
          Add your name, phone and preferred language for a smoother checkout.
        </p>
        <Link
          href="/account/profile"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-blue-700"
        >
          Update profile <ChevronRight size={16} />
        </Link>
      </div>
    </>
  );
}

function Profile({ user }: { user: AccountUser }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("fullName") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const preferredLanguage = String(form.get("preferredLanguage") ?? "en");
    if (fullName.length < 2) {
      toast.error("Please enter your full name.");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Profile service is not configured.");
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user) throw new Error("Please sign in again.");
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone: phone || null,
          preferred_language: preferredLanguage === "ur" ? "ur" : "en",
        })
        .eq("id", auth.user.id);
      if (error) throw error;
      toast.success("Profile updated successfully.");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Profile could not be updated.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Title
        title="My profile"
        sub="Keep your account and checkout details up to date"
      />
      <form
        onSubmit={submit}
        className="overflow-hidden rounded-2xl border bg-white"
      >
        <div className="border-b bg-slate-50 px-6 py-5">
          <h2 className="font-extrabold text-slate-900">
            Personal information
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            These details are securely stored in your Supabase account.
          </p>
        </div>
        <div className="grid gap-5 p-6 sm:grid-cols-2">
          <label className="text-sm font-bold text-slate-700">
            Full name
            <input
              name="fullName"
              required
              minLength={2}
              defaultValue={user.name}
              autoComplete="name"
              className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="text-sm font-bold text-slate-700">
            Email address
            <input
              value={user.email}
              readOnly
              className="mt-2 h-12 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 font-normal text-slate-500"
            />
          </label>
          <label className="text-sm font-bold text-slate-700">
            Phone number
            <input
              name="phone"
              type="tel"
              defaultValue={user.phone}
              autoComplete="tel"
              placeholder="+92 300 1234567"
              className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <label className="text-sm font-bold text-slate-700">
            Preferred language
            <select
              name="preferredLanguage"
              defaultValue={user.preferredLanguage}
              className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="en">English</option>
              <option value="ur">Urdu</option>
            </select>
          </label>
        </div>
        <div className="flex justify-end border-t bg-slate-50 px-6 py-4">
          <button
            type="submit"
            disabled={saving}
            className="h-11 rounded-xl bg-blue-600 px-6 text-sm font-extrabold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save profile"}
          </button>
        </div>
      </form>
    </>
  );
}

function Addresses({
  initialAddresses,
  user,
}: {
  initialAddresses: AddressRecord[];
  user: AccountUser;
}) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [editing, setEditing] = useState<AddressRecord | null | undefined>();
  const [busy, setBusy] = useState(false);

  function payloadFromAddress(address: AddressRecord) {
    return {
      id: address.id,
      label: address.label,
      recipientName: address.recipient_name,
      phone: address.phone,
      alternatePhone: address.alternate_phone ?? "",
      province: address.province,
      city: address.city,
      area: address.area,
      addressLine: address.address_line,
      landmark: address.landmark ?? "",
      postalCode: address.postal_code ?? "",
      isDefault: address.is_default,
    };
  }

  async function addressRequest(
    method: "POST" | "PATCH" | "DELETE",
    body?: Record<string, unknown>,
    id?: string,
  ) {
    const response = await fetch(
      `/api/account/addresses${id ? `?id=${encodeURIComponent(id)}` : ""}`,
      {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      },
    );
    const result = (await response.json()) as {
      addresses?: AddressRecord[];
      error?: string;
    };
    if (!response.ok)
      throw new Error(result.error || "Address request failed.");
    setAddresses(result.addresses ?? []);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      id: editing?.id,
      label: String(form.get("label") ?? "").trim(),
      recipientName: String(form.get("recipientName") ?? "").trim(),
      phone: String(form.get("phone") ?? "").trim(),
      alternatePhone: String(form.get("alternatePhone") ?? "").trim(),
      province: String(form.get("province") ?? "").trim(),
      city: String(form.get("city") ?? "").trim(),
      area: String(form.get("area") ?? "").trim(),
      addressLine: String(form.get("addressLine") ?? "").trim(),
      landmark: String(form.get("landmark") ?? "").trim(),
      postalCode: String(form.get("postalCode") ?? "").trim(),
      isDefault: form.get("isDefault") === "on",
    };
    setBusy(true);
    try {
      await addressRequest(editing ? "PATCH" : "POST", payload);
      toast.success(
        editing
          ? "Address updated successfully."
          : "Address added successfully.",
      );
      setEditing(undefined);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Address could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function makeDefault(address: AddressRecord) {
    setBusy(true);
    try {
      await addressRequest("PATCH", {
        ...payloadFromAddress(address),
        isDefault: true,
      });
      toast.success("Default address updated.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Default address could not be updated.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove(address: AddressRecord) {
    if (!window.confirm(`Delete ${address.label} address?`)) return;
    setBusy(true);
    try {
      await addressRequest("DELETE", undefined, address.id);
      toast.success("Address deleted.");
      if (editing?.id === address.id) setEditing(undefined);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Address could not be deleted.",
      );
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Title
          title="Saved addresses"
          sub="Manage secure delivery destinations for faster checkout"
        />
        <button
          type="button"
          onClick={() => setEditing(null)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-extrabold text-white hover:bg-blue-700"
        >
          <Plus size={17} /> Add address
        </button>
      </div>

      {editing !== undefined && (
        <form
          onSubmit={save}
          className="mb-6 overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm"
        >
          <div className="flex items-center justify-between border-b bg-blue-50 px-5 py-4">
            <div>
              <h2 className="font-extrabold text-blue-950">
                {editing ? "Edit address" : "Add a new address"}
              </h2>
              <p className="mt-1 text-xs text-blue-700">
                All required delivery details are saved securely.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditing(undefined)}
              className="text-sm font-bold text-slate-500"
            >
              Cancel
            </button>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <label className="text-xs font-bold text-slate-700">
              Address label
              <input
                name="label"
                required
                minLength={2}
                maxLength={30}
                defaultValue={editing?.label ?? "Home"}
                placeholder="Home, Office"
                className={inputClass}
              />
            </label>
            <label className="text-xs font-bold text-slate-700">
              Recipient name
              <input
                name="recipientName"
                required
                minLength={2}
                defaultValue={editing?.recipient_name ?? user.name}
                autoComplete="name"
                className={inputClass}
              />
            </label>
            <label className="text-xs font-bold text-slate-700">
              Phone number
              <input
                name="phone"
                required
                type="tel"
                minLength={10}
                defaultValue={editing?.phone ?? user.phone}
                placeholder="03XX XXXXXXX"
                autoComplete="tel"
                className={inputClass}
              />
            </label>
            <label className="text-xs font-bold text-slate-700">
              Alternate phone
              <input
                name="alternatePhone"
                type="tel"
                defaultValue={editing?.alternate_phone ?? ""}
                placeholder="Optional"
                className={inputClass}
              />
            </label>
            <label className="text-xs font-bold text-slate-700">
              Province
              <select
                name="province"
                required
                defaultValue={editing?.province ?? ""}
                className={inputClass}
              >
                <option value="">Choose province</option>
                {[
                  "Punjab",
                  "Sindh",
                  "Khyber Pakhtunkhwa",
                  "Balochistan",
                  "Islamabad Capital Territory",
                  "Gilgit-Baltistan",
                  "Azad Kashmir",
                ].map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-bold text-slate-700">
              City
              <input
                name="city"
                required
                minLength={2}
                defaultValue={editing?.city ?? ""}
                autoComplete="address-level2"
                className={inputClass}
              />
            </label>
            <label className="text-xs font-bold text-slate-700 sm:col-span-2">
              Area / locality
              <input
                name="area"
                required
                minLength={2}
                defaultValue={editing?.area ?? ""}
                placeholder="DHA Phase 5, Gulberg"
                className={inputClass}
              />
            </label>
            <label className="text-xs font-bold text-slate-700 sm:col-span-2">
              Complete address
              <textarea
                name="addressLine"
                required
                minLength={10}
                rows={3}
                defaultValue={editing?.address_line ?? ""}
                autoComplete="street-address"
                className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="text-xs font-bold text-slate-700">
              Landmark
              <input
                name="landmark"
                defaultValue={editing?.landmark ?? ""}
                placeholder="Optional nearby landmark"
                className={inputClass}
              />
            </label>
            <label className="text-xs font-bold text-slate-700">
              Postal code
              <input
                name="postalCode"
                defaultValue={editing?.postal_code ?? ""}
                autoComplete="postal-code"
                className={inputClass}
              />
            </label>
            <label className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm font-bold text-slate-700 sm:col-span-2">
              <input
                name="isDefault"
                type="checkbox"
                defaultChecked={editing?.is_default ?? addresses.length === 0}
                className="size-4 accent-blue-600"
              />
              Use as my default delivery address
            </label>
          </div>
          <div className="flex justify-end border-t bg-slate-50 px-5 py-4">
            <button
              disabled={busy}
              className="h-11 rounded-xl bg-blue-600 px-6 text-sm font-extrabold text-white disabled:cursor-wait disabled:opacity-60"
            >
              {busy ? "Saving…" : editing ? "Update address" : "Save address"}
            </button>
          </div>
        </form>
      )}

      {addresses.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <section
              key={address.id}
              className={`rounded-2xl border bg-white p-5 ${address.is_default ? "border-blue-300 ring-2 ring-blue-50" : "border-slate-200"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`grid size-10 place-items-center rounded-xl ${address.is_default ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"}`}
                  >
                    <Home size={19} />
                  </span>
                  <div>
                    <h2 className="font-extrabold">{address.label}</h2>
                    {address.is_default && (
                      <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-extrabold uppercase text-blue-600">
                        <CheckCircle2 size={12} /> Default address
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-1 text-sm text-slate-600">
                <strong className="block text-slate-900">
                  {address.recipient_name}
                </strong>
                <p>
                  {address.address_line}, {address.area}
                </p>
                <p>
                  {address.city}, {address.province}
                  {address.postal_code ? ` ${address.postal_code}` : ""}
                </p>
                <p className="font-semibold">{address.phone}</p>
              </div>
              <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setEditing(address)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700"
                >
                  <Pencil size={13} /> Edit
                </button>
                {!address.is_default && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => makeDefault(address)}
                    className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700"
                  >
                    Make default
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => remove(address)}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </section>
          ))}
        </div>
      ) : editing === undefined ? (
        <div className="rounded-2xl border border-dashed bg-white p-10 text-center">
          <MapPin className="mx-auto text-blue-600" />
          <h3 className="mt-3 font-bold">No addresses saved</h3>
          <p className="mt-1 text-sm text-slate-500">
            Add a delivery address to make checkout faster.
          </p>
          <button
            onClick={() => setEditing(null)}
            className="mt-4 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white"
          >
            Add an address
          </button>
        </div>
      ) : null}
    </>
  );
}

function Orders({ orders }: { orders: OrderRecord[] }) {
  return (
    <>
      <Title
        title="My orders"
        sub="Track deliveries, download invoices and get support"
      />
      {orders.length ? (
        <div className="space-y-4">
          {orders.map((order) => {
            const shipment = order.shipments[0];
            return (
              <section
                key={order.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <div className="flex flex-col gap-3 border-b bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <strong className="block">{order.order_number}</strong>
                    <span className="text-xs text-slate-500">
                      {new Date(order.created_at).toLocaleDateString("en-PK", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-extrabold capitalize text-blue-700">
                      {order.status.replaceAll("_", " ")}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-extrabold capitalize text-emerald-700">
                      Payment {order.payment_status.replaceAll("_", " ")}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="space-y-3">
                    {order.order_items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-4 text-sm"
                      >
                        <div className="min-w-0">
                          <strong className="block truncate">
                            {item.product_name}
                          </strong>
                          <span className="text-xs text-slate-500">
                            {item.quantity} × {item.variant_name}
                          </span>
                        </div>
                        <strong className="shrink-0">
                          Rs {Number(item.line_total).toLocaleString("en-PK")}
                        </strong>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span className="text-xs text-slate-500">
                        Order total
                      </span>
                      <strong className="block text-lg">
                        Rs {Number(order.grand_total).toLocaleString("en-PK")}
                      </strong>
                      {shipment?.tracking_number && (
                        <small className="text-slate-500">
                          {shipment.courier || "Courier"} ·{" "}
                          {shipment.tracking_number}
                        </small>
                      )}
                    </div>
                    <Link
                      href={`/track-order?order=${encodeURIComponent(order.order_number)}`}
                      className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white"
                    >
                      Track order
                    </Link>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <>
          <Empty
            icon={Package}
            title="No orders yet"
            text="Your confirmed orders will appear here."
          />
          <Link
            href="/"
            className="mt-5 flex items-center justify-center gap-2 text-sm font-bold text-blue-600"
          >
            <RotateCcw size={16} /> Start shopping
          </Link>
        </>
      )}
    </>
  );
}
function Reviews({ reviews }: { reviews: ReviewRecord[] }) {
  return (
    <>
      <Title title="My reviews" sub="Your submitted product feedback" />
      {reviews.length ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <section
              key={review.id}
              className="rounded-2xl border bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <strong>
                    {(Array.isArray(review.products)
                      ? review.products[0]?.name
                      : review.products?.name) || "Product review"}
                  </strong>
                  <p className="mt-1 text-amber-500">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(Math.max(0, 5 - review.rating))}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold capitalize">
                  {review.status}
                </span>
              </div>
              <h3 className="mt-4 font-bold">{review.title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {review.body}
              </p>
            </section>
          ))}
        </div>
      ) : (
        <Empty
          icon={Star}
          title="No reviews yet"
          text="Delivered products will become eligible for verified reviews."
        />
      )}
    </>
  );
}

function Complaints({
  initialComplaints,
  orders,
}: {
  initialComplaints: ComplaintRecord[];
  orders: OrderRecord[];
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const response = await fetch("/api/account/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: form.get("orderId") || undefined,
          category: form.get("category"),
          priority: form.get("priority"),
          subject: form.get("subject"),
          description: form.get("description"),
        }),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.error || "Support request failed.");
      toast.success("Support ticket submitted successfully.");
      formElement.reset();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Support request failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <>
      <Title
        title="Support & complaints"
        sub="Open a ticket and follow every response"
      />
      {initialComplaints.length > 0 && (
        <div className="mb-5 space-y-3">
          {initialComplaints.map((complaint) => (
            <section
              key={complaint.id}
              className="rounded-2xl border bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <strong>{complaint.subject}</strong>
                  <p className="mt-1 text-xs text-slate-500">
                    {complaint.category}
                    {(
                      Array.isArray(complaint.orders)
                        ? complaint.orders[0]?.order_number
                        : complaint.orders?.order_number
                    )
                      ? ` · ${
                          Array.isArray(complaint.orders)
                            ? complaint.orders[0]?.order_number
                            : complaint.orders?.order_number
                        }`
                      : ""}
                    {" · "}
                    {new Date(complaint.created_at).toLocaleDateString("en-PK")}
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold capitalize text-blue-700">
                  {complaint.status.replaceAll("_", " ")}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {complaint.description}
              </p>
              {complaint.resolution && (
                <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
                  <strong>Resolution:</strong> {complaint.resolution}
                </p>
              )}
            </section>
          ))}
        </div>
      )}
      <form onSubmit={submit} className="rounded-2xl border bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold">
            Category
            <select
              name="category"
              required
              className="mt-2 h-11 w-full rounded-xl border px-3 text-sm"
            >
              <option>Delivery</option>
              <option>Product issue</option>
              <option>Payment</option>
              <option>Warranty</option>
            </select>
          </label>
          <label className="text-xs font-bold">
            Priority
            <select
              name="priority"
              className="mt-2 h-11 w-full rounded-xl border px-3 text-sm"
            >
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </select>
          </label>
          <label className="text-xs font-bold sm:col-span-2">
            Related order (optional)
            <select
              name="orderId"
              className="mt-2 h-11 w-full rounded-xl border px-3 text-sm"
            >
              <option value="">No specific order</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.order_number}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold sm:col-span-2">
            Subject
            <input
              name="subject"
              required
              minLength={5}
              className="mt-2 h-11 w-full rounded-xl border px-3 text-sm"
            />
          </label>
          <label className="text-xs font-bold sm:col-span-2">
            Tell us what happened
            <textarea
              name="description"
              required
              minLength={20}
              rows={5}
              className="mt-2 w-full rounded-xl border p-3 text-sm"
            />
          </label>
        </div>
        <button
          disabled={submitting}
          className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white disabled:bg-slate-400"
        >
          {submitting ? "Submitting…" : "Submit ticket"}
        </button>
      </form>
    </>
  );
}
function Empty({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Heart;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed bg-white p-10 text-center">
      <Icon className="mx-auto text-slate-300" size={36} />
      <h3 className="mt-3 font-bold">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
    </div>
  );
}
