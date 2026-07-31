-- Category-scoped brand availability for dependent admin dropdowns.
create table if not exists public.category_brands (
  category_id uuid not null references public.categories(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  primary key (category_id, brand_id)
);

create index if not exists category_brands_brand_idx
  on public.category_brands(brand_id, category_id);

alter table public.category_brands enable row level security;

drop policy if exists "public category brands" on public.category_brands;
create policy "public category brands"
  on public.category_brands for select
  using (
    exists(select 1 from public.categories c where c.id=category_id and c.is_visible)
    and exists(select 1 from public.brands b where b.id=brand_id and b.is_visible)
  );

drop policy if exists "staff manage category brands" on public.category_brands;
create policy "staff manage category brands"
  on public.category_brands for all
  using (
    public.is_staff(
      array['super_admin','admin','catalog_manager']::public.app_role[]
    )
  )
  with check (
    public.is_staff(
      array['super_admin','admin','catalog_manager']::public.app_role[]
    )
  );
