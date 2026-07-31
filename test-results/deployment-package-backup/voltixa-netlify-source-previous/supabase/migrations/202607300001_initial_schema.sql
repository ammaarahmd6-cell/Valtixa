-- Voltixa production schema foundation
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;
create extension if not exists unaccent;
create extension if not exists citext;

create type public.app_role as enum ('super_admin','admin','catalog_manager','order_manager','support_agent','content_manager','finance_manager','analyst','customer');
create type public.product_status as enum ('draft','published','archived');
create type public.order_status as enum ('pending','confirmed','payment_pending','paid','processing','packed','ready_to_ship','shipped','out_for_delivery','delivered','cancelled','return_requested','returned','refund_pending','refunded','failed');
create type public.ticket_status as enum ('open','awaiting_customer','in_review','approved','rejected','resolved','closed');
create type public.payment_status as enum ('pending','authorized','paid','failed','refunded','partially_refunded');

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text, email text, phone text, avatar_path text, preferred_language text not null default 'en' check (preferred_language in ('en','ur')),
 date_of_birth date, gender text, marketing_opt_in boolean not null default false, account_status text not null default 'active',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.user_roles (
 user_id uuid not null references public.profiles(id) on delete cascade, role public.app_role not null default 'customer',
 created_at timestamptz not null default now(), primary key(user_id,role)
);
create table public.addresses (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 recipient_name text not null, phone text not null, alternate_phone text, province text not null, city text not null, area text not null,
 address_line text not null, landmark text, postal_code text, label text not null default 'Home', is_default boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.categories (
 id uuid primary key default gen_random_uuid(), parent_id uuid references public.categories(id) on delete restrict, name text not null, slug text not null unique,
 icon text, image_path text, seo_title text, seo_description text, sort_order int not null default 0, is_featured boolean not null default false,
 is_visible boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.brands (
 id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique, logo_path text, description text,
 seo_title text, seo_description text, sort_order int not null default 0, is_featured boolean not null default false, is_visible boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.products (
 id uuid primary key default gen_random_uuid(), category_id uuid not null references public.categories(id), brand_id uuid not null references public.brands(id),
 name text not null, slug text not null unique, short_description text, description text, status public.product_status not null default 'draft',
 is_featured boolean not null default false, search_keywords text[] not null default '{}', search_vector tsvector, seo_title text, seo_description text,
 published_at timestamptz, archived_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.product_variants (
 id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade, sku text not null unique,
 name text not null, attributes jsonb not null default '{}', price numeric(12,2) not null check(price>=0), retail_price numeric(12,2) not null check(retail_price>=price),
 cost numeric(12,2) check(cost>=0), weight_grams int check(weight_grams>=0), is_active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.product_images (
 id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade,
 variant_id uuid references public.product_variants(id) on delete cascade, storage_path text not null, alt_text text not null, sort_order int not null default 0,
 is_primary boolean not null default false, created_at timestamptz not null default now()
);
create table public.specification_groups (id uuid primary key default gen_random_uuid(), category_id uuid references public.categories(id), name text not null, sort_order int not null default 0);
create table public.specification_definitions (id uuid primary key default gen_random_uuid(), group_id uuid not null references public.specification_groups(id) on delete cascade, key text not null, label text not null, data_type text not null default 'text', is_filterable boolean not null default false, sort_order int not null default 0, unique(group_id,key));
create table public.product_specification_values (product_id uuid not null references public.products(id) on delete cascade, definition_id uuid not null references public.specification_definitions(id) on delete cascade, value_text text, value_number numeric, value_boolean boolean, primary key(product_id,definition_id));
create table public.inventory (
 variant_id uuid primary key references public.product_variants(id) on delete restrict, quantity int not null default 0 check(quantity>=0),
 reserved_quantity int not null default 0 check(reserved_quantity>=0 and reserved_quantity<=quantity), low_stock_threshold int not null default 5 check(low_stock_threshold>=0), updated_at timestamptz not null default now()
);
create table public.inventory_movements (id uuid primary key default gen_random_uuid(), variant_id uuid not null references public.product_variants(id), quantity_delta int not null, reason text not null, order_id uuid, created_by uuid references public.profiles(id), created_at timestamptz not null default now());
create table public.price_history (id uuid primary key default gen_random_uuid(), variant_id uuid not null references public.product_variants(id), price numeric(12,2) not null check(price>=0), retail_price numeric(12,2) not null check(retail_price>=price), starts_at timestamptz not null default now(), ends_at timestamptz);
create table public.collections (id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique, description text, is_visible boolean not null default true, starts_at timestamptz, ends_at timestamptz, sort_order int not null default 0);
create table public.collection_products (collection_id uuid references public.collections(id) on delete cascade, product_id uuid references public.products(id) on delete cascade, sort_order int not null default 0, primary key(collection_id,product_id));
create table public.banners (id uuid primary key default gen_random_uuid(), title text not null, subtitle text, desktop_path text, mobile_path text, href text, background_color text, is_visible boolean not null default true, starts_at timestamptz, ends_at timestamptz, sort_order int not null default 0);

create table public.carts (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade, anonymous_token_hash text, status text not null default 'active', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(user_id is not null or anonymous_token_hash is not null));
create unique index carts_one_active_user on public.carts(user_id) where status='active' and user_id is not null;
create table public.cart_items (id uuid primary key default gen_random_uuid(), cart_id uuid not null references public.carts(id) on delete cascade, variant_id uuid not null references public.product_variants(id), quantity int not null check(quantity between 1 and 10), gift_wrap boolean not null default false, warranty_plan_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(cart_id,variant_id,gift_wrap,warranty_plan_id));
create table public.wishlists (id uuid primary key default gen_random_uuid(), user_id uuid not null unique references public.profiles(id) on delete cascade, is_shared boolean not null default false, share_token uuid unique, created_at timestamptz not null default now());
create table public.wishlist_items (id uuid primary key default gen_random_uuid(), wishlist_id uuid not null references public.wishlists(id) on delete cascade, product_id uuid not null references public.products(id), variant_id uuid references public.product_variants(id), price_when_added numeric(12,2), created_at timestamptz not null default now());
create unique index wishlist_items_unique on public.wishlist_items(wishlist_id,product_id,coalesce(variant_id,'00000000-0000-0000-0000-000000000000'));
create table public.comparison_lists (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete cascade, name text not null default 'My comparison', share_token uuid unique default gen_random_uuid(), created_at timestamptz not null default now());
create table public.comparison_items (list_id uuid references public.comparison_lists(id) on delete cascade, product_id uuid references public.products(id) on delete cascade, sort_order smallint not null check(sort_order between 0 and 3), primary key(list_id,product_id), unique(list_id,sort_order));
create table public.recently_viewed (user_id uuid references public.profiles(id) on delete cascade, product_id uuid references public.products(id) on delete cascade, viewed_at timestamptz not null default now(), primary key(user_id,product_id));
create table public.coupons (id uuid primary key default gen_random_uuid(), code citext not null unique, discount_type text not null check(discount_type in ('fixed','percent')), discount_value numeric(12,2) not null check(discount_value>0), minimum_subtotal numeric(12,2) not null default 0, maximum_discount numeric(12,2), usage_limit int, per_user_limit int not null default 1, starts_at timestamptz not null, ends_at timestamptz not null, is_active boolean not null default true, check(ends_at>starts_at));

create table public.orders (
 id uuid primary key default gen_random_uuid(), order_number text not null unique, customer_id uuid not null references public.profiles(id), address_snapshot jsonb not null,
 status public.order_status not null default 'pending', payment_status public.payment_status not null default 'pending', payment_method text not null,
 subtotal numeric(12,2) not null check(subtotal>=0), discount numeric(12,2) not null default 0 check(discount>=0), coupon_discount numeric(12,2) not null default 0 check(coupon_discount>=0),
 shipping numeric(12,2) not null default 0 check(shipping>=0), tax numeric(12,2) not null default 0 check(tax>=0), grand_total numeric(12,2) not null check(grand_total>=0),
 idempotency_key uuid not null unique, notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz
);
alter table public.inventory_movements add constraint inventory_movements_order_fk foreign key(order_id) references public.orders(id);
create table public.order_items (id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete restrict, product_id uuid not null references public.products(id), variant_id uuid not null references public.product_variants(id), product_name text not null, variant_name text not null, sku text not null, unit_price numeric(12,2) not null check(unit_price>=0), quantity int not null check(quantity>0), line_total numeric(12,2) generated always as (unit_price*quantity) stored);
create table public.order_status_history (id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade, from_status public.order_status, to_status public.order_status not null, note text, changed_by uuid references public.profiles(id), created_at timestamptz not null default now());
create table public.coupon_redemptions (coupon_id uuid references public.coupons(id), user_id uuid references public.profiles(id), order_id uuid unique references public.orders(id), redeemed_at timestamptz not null default now(), primary key(coupon_id,order_id));
create table public.payments (id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id), provider text not null, provider_reference text, amount numeric(12,2) not null check(amount>=0), status public.payment_status not null default 'pending', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.payment_events (id uuid primary key default gen_random_uuid(), payment_id uuid not null references public.payments(id), provider_event_id text not null unique, event_type text not null, payload jsonb not null, received_at timestamptz not null default now());
create table public.shipments (id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id), courier text, tracking_number text, tracking_url text, status text not null default 'pending', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.shipment_events (id uuid primary key default gen_random_uuid(), shipment_id uuid not null references public.shipments(id) on delete cascade, status text not null, description text, event_at timestamptz not null default now());

create table public.reviews (id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id), user_id uuid not null references public.profiles(id), order_item_id uuid references public.order_items(id), rating smallint not null check(rating between 1 and 5), title text not null, body text not null, is_verified boolean not null default false, status text not null default 'pending', helpful_count int not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id,order_item_id));
create table public.review_images (id uuid primary key default gen_random_uuid(), review_id uuid not null references public.reviews(id) on delete cascade, storage_path text not null, sort_order int not null default 0);
create table public.review_votes (review_id uuid references public.reviews(id) on delete cascade, user_id uuid references public.profiles(id) on delete cascade, helpful boolean not null, primary key(review_id,user_id));
create table public.complaints (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id), order_id uuid references public.orders(id), category text not null, subject text not null, description text not null, priority text not null default 'normal', status public.ticket_status not null default 'open', assigned_to uuid references public.profiles(id), resolution text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.complaint_messages (id uuid primary key default gen_random_uuid(), complaint_id uuid not null references public.complaints(id) on delete cascade, sender_id uuid not null references public.profiles(id), body text not null, is_internal boolean not null default false, created_at timestamptz not null default now());
create table public.complaint_attachments (id uuid primary key default gen_random_uuid(), complaint_id uuid not null references public.complaints(id) on delete cascade, uploader_id uuid not null references public.profiles(id), storage_path text not null, mime_type text not null, size_bytes int not null check(size_bytes between 1 and 10485760), created_at timestamptz not null default now());
create table public.returns (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id), order_item_id uuid not null references public.order_items(id), reason text not null, status text not null default 'requested', refund_method text, refund_status text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.return_events (id uuid primary key default gen_random_uuid(), return_id uuid not null references public.returns(id) on delete cascade, status text not null, note text, created_by uuid references public.profiles(id), created_at timestamptz not null default now());
create table public.warranties (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id), order_item_id uuid not null references public.order_items(id), serial_number text, provider text not null, duration_months int not null check(duration_months>0), activated_at date not null, expires_at date not null, certificate_path text);
create table public.warranty_claims (id uuid primary key default gen_random_uuid(), warranty_id uuid not null references public.warranties(id), user_id uuid not null references public.profiles(id), description text not null, status text not null default 'open', created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create table public.notifications (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id), title text not null, body text not null, type text not null, deep_link text, read_at timestamptz, created_at timestamptz not null default now());
create table public.newsletter_subscribers (id uuid primary key default gen_random_uuid(), email citext not null unique, status text not null default 'subscribed', created_at timestamptz not null default now());
create table public.contact_submissions (id uuid primary key default gen_random_uuid(), category text not null, name text not null, email citext not null, phone text, order_number text, subject text not null, message text not null, status text not null default 'new', created_at timestamptz not null default now());
create table public.faqs (id uuid primary key default gen_random_uuid(), question text not null, answer text not null, category text, sort_order int not null default 0, is_visible boolean not null default true, published_at timestamptz);
create table public.blog_categories (id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique);
create table public.blog_posts (id uuid primary key default gen_random_uuid(), category_id uuid references public.blog_categories(id), title text not null, slug text not null unique, excerpt text, body text not null, cover_path text, status public.product_status not null default 'draft', seo_title text, seo_description text, published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.search_events (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete set null, anonymous_session_hash text, query text not null, result_count int not null default 0, created_at timestamptz not null default now());
create table public.site_settings (key text primary key, value jsonb not null, is_public boolean not null default false, updated_at timestamptz not null default now());
create table public.staff_notes (id uuid primary key default gen_random_uuid(), entity_type text not null, entity_id uuid not null, author_id uuid not null references public.profiles(id), body text not null, created_at timestamptz not null default now());
create table public.audit_logs (id bigint generated always as identity primary key, actor_id uuid references public.profiles(id), action text not null, entity_type text not null, entity_id uuid, old_values jsonb, new_values jsonb, ip_hash text, created_at timestamptz not null default now());

create index products_category_idx on public.products(category_id) where status='published';
create index products_brand_idx on public.products(brand_id) where status='published';
create index products_search_idx on public.products using gin(search_vector);
create index products_name_trgm_idx on public.products using gin(name gin_trgm_ops);
create index products_published_idx on public.products(status,published_at desc);
create index variants_price_idx on public.product_variants(price);
create index orders_customer_idx on public.orders(customer_id,created_at desc);
create index orders_status_idx on public.orders(status,created_at desc);
create index complaints_status_idx on public.complaints(status,created_at desc);
create index specs_filter_text_idx on public.product_specification_values(definition_id,value_text);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
do $$ declare t text; begin foreach t in array array['profiles','addresses','categories','brands','products','product_variants','inventory','carts','cart_items','orders','payments','shipments','reviews','complaints','returns','warranty_claims','blog_posts'] loop execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',t,t); end loop; end $$;
create or replace function public.handle_new_user() returns trigger security definer set search_path=public language plpgsql as $$ begin insert into public.profiles(id,email,phone,full_name) values(new.id,new.email,new.phone,coalesce(new.raw_user_meta_data->>'full_name','')); insert into public.user_roles(user_id,role) values(new.id,'customer'); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
create or replace function public.update_product_search() returns trigger language plpgsql as $$ begin new.search_vector=setweight(to_tsvector('simple',unaccent(coalesce(new.name,''))),'A')||setweight(to_tsvector('simple',unaccent(coalesce(array_to_string(new.search_keywords,' '),''))),'B'); return new; end $$;
create trigger products_search_vector before insert or update of name,search_keywords on public.products for each row execute function public.update_product_search();
create sequence public.order_number_seq;
create or replace function public.next_order_number() returns text language sql security definer set search_path=public as $$ select 'VLX-'||to_char(now(),'YYYY')||'-'||lpad(nextval('public.order_number_seq')::text,8,'0') $$;

create or replace function public.is_staff(required_roles public.app_role[] default array['super_admin','admin']::public.app_role[]) returns boolean stable security definer set search_path=public language sql as $$
 select exists(select 1 from public.user_roles where user_id=auth.uid() and role=any(required_roles))
$$;

create or replace function public.checkout_atomic(p_cart_id uuid,p_address jsonb,p_payment_method text,p_idempotency_key uuid)
returns public.orders security definer set search_path=public language plpgsql as $$
declare v_order public.orders; v_subtotal numeric; v_user uuid:=auth.uid(); v_item record;
begin
 if v_user is null then raise exception 'authentication_required'; end if;
 select sum(v.price*ci.quantity) into v_subtotal from public.cart_items ci join public.carts c on c.id=ci.cart_id join public.product_variants v on v.id=ci.variant_id where c.id=p_cart_id and c.user_id=v_user and c.status='active';
 if v_subtotal is null then raise exception 'empty_cart'; end if;
 for v_item in select ci.variant_id,ci.quantity as requested_qty,i.quantity as stock_qty,i.reserved_quantity from public.cart_items ci join public.inventory i on i.variant_id=ci.variant_id where ci.cart_id=p_cart_id for update of i loop
  if v_item.stock_qty-v_item.reserved_quantity<v_item.requested_qty then raise exception 'insufficient_stock'; end if;
 end loop;
 insert into public.orders(order_number,customer_id,address_snapshot,payment_method,subtotal,shipping,grand_total,idempotency_key)
 values(public.next_order_number(),v_user,p_address,p_payment_method,v_subtotal,case when v_subtotal>=5000 then 0 else 250 end,v_subtotal+case when v_subtotal>=5000 then 0 else 250 end,p_idempotency_key) returning * into v_order;
 insert into public.order_items(order_id,product_id,variant_id,product_name,variant_name,sku,unit_price,quantity)
 select v_order.id,p.id,v.id,p.name,v.name,v.sku,v.price,ci.quantity from public.cart_items ci join public.product_variants v on v.id=ci.variant_id join public.products p on p.id=v.product_id where ci.cart_id=p_cart_id;
 update public.inventory i set quantity=i.quantity-ci.quantity from public.cart_items ci where ci.cart_id=p_cart_id and ci.variant_id=i.variant_id;
 insert into public.inventory_movements(variant_id,quantity_delta,reason,order_id) select variant_id,-quantity,'checkout',v_order.id from public.cart_items where cart_id=p_cart_id;
 update public.carts set status='converted' where id=p_cart_id;
 insert into public.order_status_history(order_id,to_status,note) values(v_order.id,'pending','Order created atomically');
 return v_order;
exception when unique_violation then select * into v_order from public.orders where idempotency_key=p_idempotency_key and customer_id=v_user; return v_order;
end $$;
revoke all on function public.checkout_atomic(uuid,jsonb,text,uuid) from public;
grant execute on function public.checkout_atomic(uuid,jsonb,text,uuid) to authenticated;

-- Enable RLS on every exposed table.
do $$ declare r record; begin for r in select tablename from pg_tables where schemaname='public' loop execute format('alter table public.%I enable row level security',r.tablename); end loop; end $$;
create policy "public catalog categories" on public.categories for select using(is_visible);
create policy "public catalog brands" on public.brands for select using(is_visible);
create policy "public published products" on public.products for select using(status='published');
create policy "public active variants" on public.product_variants for select using(is_active and exists(select 1 from public.products p where p.id=product_id and p.status='published'));
create policy "public product images" on public.product_images for select using(exists(select 1 from public.products p where p.id=product_id and p.status='published'));
create policy "public visible collections" on public.collections for select using(is_visible and (starts_at is null or starts_at<=now()) and (ends_at is null or ends_at>now()));
create policy "public collection items" on public.collection_products for select using(exists(select 1 from public.collections c where c.id=collection_id and c.is_visible));
create policy "public banners" on public.banners for select using(is_visible and (starts_at is null or starts_at<=now()) and (ends_at is null or ends_at>now()));
create policy "public approved reviews" on public.reviews for select using(status='approved');
create policy "public faqs" on public.faqs for select using(is_visible and published_at<=now());
create policy "public blog" on public.blog_posts for select using(status='published' and published_at<=now());
create policy "own profile" on public.profiles for select using(id=auth.uid() or public.is_staff());
create policy "update own profile" on public.profiles for update using(id=auth.uid()) with check(id=auth.uid());
create policy "own addresses" on public.addresses for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "own role visibility" on public.user_roles for select using(user_id=auth.uid() or public.is_staff());
create policy "own carts" on public.carts for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "own cart items" on public.cart_items for all using(exists(select 1 from public.carts c where c.id=cart_id and c.user_id=auth.uid())) with check(exists(select 1 from public.carts c where c.id=cart_id and c.user_id=auth.uid()));
create policy "own wishlist" on public.wishlists for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "own wishlist items" on public.wishlist_items for all using(exists(select 1 from public.wishlists w where w.id=wishlist_id and w.user_id=auth.uid())) with check(exists(select 1 from public.wishlists w where w.id=wishlist_id and w.user_id=auth.uid()));
create policy "own comparisons" on public.comparison_lists for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "own comparison items" on public.comparison_items for all using(exists(select 1 from public.comparison_lists l where l.id=list_id and l.user_id=auth.uid())) with check(exists(select 1 from public.comparison_lists l where l.id=list_id and l.user_id=auth.uid()));
create policy "own recently viewed" on public.recently_viewed for all using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "own orders" on public.orders for select using(customer_id=auth.uid() or public.is_staff(array['super_admin','admin','order_manager','finance_manager','analyst']::public.app_role[]));
create policy "own payments" on public.payments for select using(exists(select 1 from public.orders o where o.id=order_id and o.customer_id=auth.uid()) or public.is_staff(array['super_admin','admin','finance_manager']::public.app_role[]));
create policy "own complaints" on public.complaints for all using(user_id=auth.uid() or public.is_staff(array['super_admin','admin','support_agent']::public.app_role[])) with check(user_id=auth.uid() or public.is_staff(array['super_admin','admin','support_agent']::public.app_role[]));
create policy "own returns" on public.returns for select using(user_id=auth.uid() or public.is_staff());
create policy "own warranties" on public.warranties for select using(user_id=auth.uid() or public.is_staff());
create policy "own warranty claims" on public.warranty_claims for all using(user_id=auth.uid() or public.is_staff()) with check(user_id=auth.uid() or public.is_staff());
create policy "own notifications" on public.notifications for select using(user_id=auth.uid());
create policy "update own notifications" on public.notifications for update using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "submit contact" on public.contact_submissions for insert with check(length(message) between 20 and 5000);
create policy "subscribe newsletter" on public.newsletter_subscribers for insert with check(email is not null);
create policy "submit eligible reviews" on public.reviews for insert with check(user_id=auth.uid() and exists(select 1 from public.order_items oi join public.orders o on o.id=oi.order_id where oi.id=order_item_id and o.customer_id=auth.uid() and o.status='delivered'));

-- Staff CRUD remains role-scoped; business-sensitive tables are intentionally excluded.
do $$ declare t text; begin
 foreach t in array array['categories','brands','products','product_variants','product_images','specification_groups','specification_definitions','product_specification_values','inventory','inventory_movements','price_history','collections','collection_products','banners','faqs','blog_categories','blog_posts','site_settings'] loop
  execute format('create policy "staff manage %1$s" on public.%1$I for all using (public.is_staff(array[''super_admin'',''admin'',''catalog_manager'',''content_manager'']::public.app_role[])) with check (public.is_staff(array[''super_admin'',''admin'',''catalog_manager'',''content_manager'']::public.app_role[]))',t);
 end loop;
end $$;

-- Storage buckets and conservative policies.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp','image/avif']),
 ('brand-logos','brand-logos',true,2097152,array['image/png','image/webp','image/svg+xml']),
 ('category-images','category-images',true,5242880,array['image/jpeg','image/png','image/webp']),
 ('homepage-banners','homepage-banners',true,8388608,array['image/jpeg','image/png','image/webp','image/avif']),
 ('blog-images','blog-images',true,5242880,array['image/jpeg','image/png','image/webp']),
 ('private-attachments','private-attachments',false,10485760,array['image/jpeg','image/png','application/pdf']),
 ('invoices','invoices',false,5242880,array['application/pdf'])
on conflict(id) do nothing;
create policy "read public media" on storage.objects for select using(bucket_id in ('product-images','brand-logos','category-images','homepage-banners','blog-images'));
create policy "staff manage public media" on storage.objects for all using(public.is_staff(array['super_admin','admin','catalog_manager','content_manager']::public.app_role[])) with check(public.is_staff(array['super_admin','admin','catalog_manager','content_manager']::public.app_role[]));
create policy "own private attachments" on storage.objects for select using(bucket_id='private-attachments' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "upload own private attachments" on storage.objects for insert with check(bucket_id='private-attachments' and (storage.foldername(name))[1]=auth.uid()::text);
