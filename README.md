# Voltixa

Voltixa is an original, responsive electronics commerce platform for Pakistan, built with Next.js App Router, strict TypeScript, Tailwind CSS, Supabase, Zustand, React Hook Form, Zod, Recharts, Vitest, and Playwright.

## Local setup

1. Install Node.js 22 or newer and run `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Create a Supabase project, then add its project URL and publishable anon key.
4. In the Supabase SQL editor, apply `supabase/migrations/202607300001_initial_schema.sql`.
5. Apply `supabase/seed.sql`. It creates categories, 12 original brands, 30 original demo products, variants, inventory, content, a coupon, and site settings.
6. Run `npm run dev` and open `http://localhost:3000`.

Without Supabase environment values, the storefront still runs as a clearly labelled development experience. Cart, wishlist, and comparison persist locally. Checkout validates prices and inventory on the server but does not pretend to persist a production order.

## Authentication

Enable Email in Supabase Authentication. For phone OTP, configure an officially supported SMS provider in Supabase; the app never simulates SMS delivery. Add the site URL and `/account` callback to Auth redirect URLs. Google can be enabled from the Supabase provider panel.

To create the first admin:

1. Register normally through `/register`.
2. Find the Auth user UUID in Supabase.
3. Run:

```sql
insert into public.user_roles(user_id, role)
values ('USER_UUID', 'super_admin')
on conflict do nothing;
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` through a `NEXT_PUBLIC_` variable.

## Database and security

The migration includes normalized catalog, variants, inventory, orders, payment events, fulfillment, reviews, complaints, returns, warranties, content, analytics, and audit tables. RLS is enabled on every public table. Public catalog access is read-only; customer records are owner-scoped; staff content access is role-scoped; payment confirmation and other privileged transitions remain service-only.

`checkout_atomic` locks inventory rows, re-reads trusted prices, creates the order and snapshots, decrements inventory, writes movements, and honors an idempotency key in one transaction. Replace the development checkout handler’s documented branch with the authenticated RPC once Supabase is configured.

Public image buckets enforce MIME/size limits. Private attachments are stored beneath the authenticated user UUID and use signed URLs. Generate invoices into the private `invoices` bucket.

## Provider integration points

- Card, JazzCash, Easypaisa, and bank transfer adapters belong in server-only handlers.
- Online payments must become `paid` only after a verified, idempotent provider webhook writes `payment_events`.
- Courier adapters should create `shipments` and append immutable `shipment_events`.
- Email/SMS/push workers consume notification records; secrets stay server-side.
- Production rate limiting and CAPTCHA should be attached at the reverse proxy or a durable edge store.

## Quality commands

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

## Deployment

Deploy to any Next.js-compatible Node host. Configure the environment values in the platform, set the production site URL in Supabase Auth, apply migrations before deploying application code, then smoke-test auth, COD checkout, RLS isolation, admin roles, webhooks, storage uploads, sitemap, and email delivery.

For Netlify, follow [NETLIFY_DEPLOY.md](./NETLIFY_DEPLOY.md). The project uses
Netlify's Next.js/OpenNext runtime so server-rendered pages, route handlers,
Supabase authentication, and admin APIs remain functional. A static HTML-only
export is intentionally not used.

## Production readiness checklist

- Replace representative product visuals and demo copy through the admin/CMS.
- Configure Supabase Auth email and official SMS providers.
- Connect checkout to `checkout_atomic` with authenticated server cookies.
- Implement and verify payment/courier adapters and webhook signatures.
- Add durable distributed rate limits and CAPTCHA.
- Verify each RLS policy with two customer accounts and every staff role.
- Configure backups, point-in-time recovery, monitoring, alerting, log redaction, and a maintenance-mode flag.
- Run unit, Playwright, accessibility, mobile, production-build, and disaster-recovery checks.

The campaign hero was generated specifically for Voltixa with the built-in image generation workflow and is stored at `public/images/voltixa-hero.png`.
