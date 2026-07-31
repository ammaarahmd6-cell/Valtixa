-- Voltixa Pakistan-market seed.
-- Run `npm run catalog:sync` after a reset to also populate normalized
-- specification definitions and values from the application catalog.

insert into public.categories(name,slug,sort_order) values
('Mobiles','mobiles',1),('Smart Watches','smart-watches',2),('Wireless Earbuds','wireless-earbuds',3),('Air Purifiers','air-purifiers',4),
('Personal Care','personal-care',5),('Mobile Accessories','mobile-accessories',6),('Bluetooth Speakers','bluetooth-speakers',7),('Power Banks','power-banks',8),
('Tablets','tablets',9),('Laptops','laptops',10),('TV & Home Appliances','tv-home-appliances',11),('Auto','auto',12);

insert into public.categories(parent_id,name,slug,sort_order)
select id,x.name,x.slug,x.ord from public.categories c cross join (values
('Trimmers & Shavers','trimmers-shavers',1),('Hair Straighteners & Curlers','hair-styling',2),('Electric Toothbrushes','electric-toothbrushes',3),
('Epilators','epilators',4),('Hair Dryers','hair-dryers',5)
) x(name,slug,ord) where c.slug='personal-care';

insert into public.categories(parent_id,name,slug,sort_order)
select id,x.name,x.slug,x.ord from public.categories c cross join (values
('Charging Cables','charging-cables',1),('Wireless Chargers','wireless-chargers',2),('Wall Chargers','wall-chargers',3),
('Car Chargers','car-chargers',4),('Mobile Cases','mobile-cases',5),('Screen Protectors','screen-protectors',6)
) x(name,slug,ord) where c.slug='mobile-accessories';

insert into public.categories(parent_id,name,slug,sort_order)
select id,x.name,x.slug,x.ord from public.categories c cross join
(values ('LED TVs','led-tvs',1),('Air Conditioners','air-conditioners',2),('Refrigerators','refrigerators',3))
x(name,slug,ord) where c.slug='tv-home-appliances';

insert into public.categories(parent_id,name,slug,sort_order)
select id,x.name,x.slug,x.ord from public.categories c cross join
(values ('Electric Bikes','electric-bikes',1),('Motorcycles','motorcycles',2))
x(name,slug,ord) where c.slug='auto';

insert into public.brands(name,slug,sort_order,is_featured,is_visible) values
('Samsung','samsung',1,true,true),('Xiaomi','xiaomi',2,true,true),('Infinix','infinix',3,true,true),('Lenovo','lenovo',4,true,true),
('Baseus','baseus',5,true,true),('JBL','jbl',6,true,true),('Philips','philips',7,true,true),('UGREEN','ugreen',8,true,true);

with catalog(category_slug,brand_slug,name,slug,short_description,description,is_featured,image_path) as (values
('mobiles','samsung','Samsung Galaxy A56 5G','samsung-galaxy-a56-5g','6.7-inch 120Hz AMOLED, 50MP OIS camera and IP67 protection.','Official Pakistan-market Galaxy A-series phone with a 120Hz Super AMOLED display, stabilized 50MP camera, 5000mAh battery and long software support.',true,'/images/products/nova-x1-pro-5g.webp'),
('mobiles','xiaomi','Xiaomi Redmi Note 14 Pro','xiaomi-redmi-note-14-pro','200MP camera, 120Hz AMOLED display and 5500mAh battery.','Pakistan-market Redmi Note model with a bright AMOLED display, 200MP main camera, durable glass protection and a large 5500mAh battery.',true,'/images/products/orion-a55-5g.webp'),
('mobiles','infinix','Infinix Note 50 Pro','infinix-note-50-pro','144Hz AMOLED, 50MP OIS and 90W wired charging.','Locally available Note-series phone with a smooth 144Hz AMOLED panel, 50MP OIS camera and fast wired plus wireless charging.',true,'/images/products/vertex-note-12.webp'),
('wireless-earbuds','xiaomi','Redmi Buds 6 Pro','redmi-buds-6-pro','Adaptive ANC, LDAC and up to 34 hours total battery.','Premium true-wireless Redmi earbuds with adaptive active noise cancellation, LDAC support and up to 34 hours of total listening time.',true,'/images/products/auralink-airpulse-anc-buds.webp'),
('smart-watches','samsung','Samsung Galaxy Watch7 44mm','samsung-galaxy-watch7-44mm','Super AMOLED smartwatch with GPS and advanced wellness sensors.','Samsung 44mm Bluetooth smartwatch with a Super AMOLED display, dual-frequency GPS, advanced wellness sensors and Wear OS.',true,'/images/products/chronos-pulse-s3.webp'),
('laptops','lenovo','Lenovo IdeaPad Slim 3 Gen 8','lenovo-ideapad-slim-3-gen-8','Ryzen 7 productivity laptop with 16GB RAM and 512GB SSD.','Thin everyday Lenovo laptop for work and study, combining Ryzen 7 performance, a sharp 14-inch display and rapid-charge support.',true,'/images/products/lumina-book-air-14.webp'),
('tablets','samsung','Samsung Galaxy Tab S10 FE','samsung-galaxy-tab-s10-fe','10.9-inch 90Hz tablet with Exynos 1580 and included S Pen.','Slim Galaxy tablet with a bright 10.9-inch 90Hz display, Exynos 1580 performance, expandable storage and an included S Pen.',true,'/images/products/nimbus-tab-view-11.webp'),
('power-banks','baseus','Baseus Blade 100W Power Bank','baseus-blade-100w-power-bank','Slim 20,000mAh power bank with up to 100W USB-C output.','Slim 20,000mAh laptop power bank sold in Pakistan, with up to 100W USB-C output and a clear digital power display.',false,'/images/products/voltic-corecharge-20k.webp'),
('bluetooth-speakers','jbl','JBL Flip 6 Portable Speaker','jbl-flip-6-portable-speaker','Portable 30W speaker with IP67 protection and PartyBoost.','Rugged portable JBL speaker with powerful two-way sound, IP67 water and dust protection and up to 12 hours of playtime.',false,'/images/products/sonicraft-roam-360.webp'),
('air-purifiers','xiaomi','Xiaomi Smart Air Purifier 4 Compact','xiaomi-smart-air-purifier-4-compact','Compact smart purifier with PM2.5 sensor and app control.','Compact smart purifier suited to bedrooms and home offices, with PM2.5 sensing, app control and quiet night operation.',false,'/images/products/puriva-breathe-mini.webp'),
('personal-care','philips','Philips Multigroom Series 7000','philips-multigroom-series-7000','MG7720/15 14-in-1 showerproof grooming kit.','Pakistan-listed MG7720/15 grooming kit with 14 tools, DualCut technology, showerproof construction and long cordless runtime.',false,'/images/products/groomix-precision-pro.webp'),
('mobile-accessories','ugreen','UGREEN Nexode 65W GaN Charger','ugreen-nexode-65w-gan-charger','Three-port 65W GaN charger for phones, tablets and laptops.','Compact Pakistan-listed 65W GaN fast charger with two USB-C ports, one USB-A port and intelligent multi-device power sharing.',false,'/images/products/nexel-gan-trio-65w.webp')
), inserted_products as (
 insert into public.products(category_id,brand_id,name,slug,short_description,description,status,is_featured,search_keywords,published_at)
 select c.id,b.id,x.name,x.slug,x.short_description,x.description,'published',x.is_featured,array[x.brand_slug,x.category_slug,'Pakistan'],now()
 from catalog x join public.categories c on c.slug=x.category_slug join public.brands b on b.slug=x.brand_slug
 returning id,slug
)
insert into public.product_images(product_id,storage_path,alt_text,sort_order,is_primary)
select p.id,x.image_path,x.name,0,true from catalog x join inserted_products p on p.slug=x.slug;

with variant_data(product_slug,sku,name,attributes,price,retail_price,quantity) as (values
('samsung-galaxy-a56-5g','SAM-A56-8-256','8GB · 256GB','{"ram":"8GB","storage":"256GB"}'::jsonb,112499,137999,12),
('samsung-galaxy-a56-5g','SAM-A56-12-256','12GB · 256GB','{"ram":"12GB","storage":"256GB"}'::jsonb,122999,137999,6),
('xiaomi-redmi-note-14-pro','XMI-RN14P-8-256','8GB · 256GB','{"ram":"8GB","storage":"256GB"}'::jsonb,70499,82999,15),
('xiaomi-redmi-note-14-pro','XMI-RN14P-12-512','12GB · 512GB','{"ram":"12GB","storage":"512GB"}'::jsonb,92999,99999,9),
('infinix-note-50-pro','INF-N50P-12-256','12GB · 256GB','{"ram":"12GB","storage":"256GB"}'::jsonb,82999,89999,20),
('redmi-buds-6-pro','XMI-BUDS6P-BLK','Space Black','{"colour":"Space Black"}'::jsonb,16599,17999,18),
('redmi-buds-6-pro','XMI-BUDS6P-WHT','Glacier White','{"colour":"Glacier White"}'::jsonb,16599,17999,14),
('redmi-buds-6-pro','XMI-BUDS6P-PUR','Lavender Purple','{"colour":"Lavender Purple"}'::jsonb,16599,17999,10),
('samsung-galaxy-watch7-44mm','SAM-W7-44-GRN','44mm · Green','{"size":"44mm","colour":"Green"}'::jsonb,46999,120000,9),
('samsung-galaxy-watch7-44mm','SAM-W7-44-SLV','44mm · Silver','{"size":"44mm","colour":"Silver"}'::jsonb,46999,120000,7),
('lenovo-ideapad-slim-3-gen-8','LEN-SLIM3-R7-16-512','Ryzen 7 · 16GB · 512GB','{"processor":"Ryzen 7 7730U"}'::jsonb,174999,189999,8),
('samsung-galaxy-tab-s10-fe','SAM-TS10FE-8-128','Wi-Fi · 8GB · 128GB','{"ram":"8GB","storage":"128GB"}'::jsonb,115999,124999,7),
('samsung-galaxy-tab-s10-fe','SAM-TS10FE-12-256','Wi-Fi · 12GB · 256GB','{"ram":"12GB","storage":"256GB"}'::jsonb,139999,149999,3),
('baseus-blade-100w-power-bank','BAS-BLADE-100W-BLK','20,000mAh · Black','{"colour":"Black"}'::jsonb,22999,24999,24),
('jbl-flip-6-portable-speaker','JBL-FLIP6-BLU','Blue','{"colour":"Blue"}'::jsonb,31999,36999,10),
('jbl-flip-6-portable-speaker','JBL-FLIP6-BLK','Black','{"colour":"Black"}'::jsonb,31999,36999,8),
('xiaomi-smart-air-purifier-4-compact','XMI-AIR4C-WHT','White','{"colour":"White"}'::jsonb,34999,39999,11),
('philips-multigroom-series-7000','PHI-MG7720-15','MG7720/15 · Silver','{"colour":"Silver"}'::jsonb,27999,31999,21),
('ugreen-nexode-65w-gan-charger','UGR-15334-65W','65W · Space Gray','{"colour":"Space Gray"}'::jsonb,12600,16508,36)
), inserted_variants as (
 insert into public.product_variants(product_id,sku,name,attributes,price,retail_price,is_active)
 select p.id,v.sku,v.name,v.attributes,v.price,v.retail_price,true
 from variant_data v join public.products p on p.slug=v.product_slug
 returning id,sku
)
insert into public.inventory(variant_id,quantity,low_stock_threshold)
select v.id,d.quantity,least(5,d.quantity)
from inserted_variants v join variant_data d on d.sku=v.sku;

insert into public.collections(name,slug,description,is_visible,sort_order) values
('Flash Deals','flash-deals','Limited-time offers.',true,1),
('Best Sellers','best-sellers','Popular products in Pakistan.',true,2),
('New Arrivals','new-arrivals','Fresh catalog additions.',true,3);

insert into public.banners(title,subtitle,href,background_color,is_visible,sort_order) values
('Fresh tech. Fully charged.','Trusted technology for Pakistan','/deals','#0F172A',true,1);

insert into public.coupons(code,discount_type,discount_value,minimum_subtotal,maximum_discount,usage_limit,starts_at,ends_at) values
('VOLT10','percent',10,5000,5000,100,now(),now()+interval '90 days');

insert into public.faqs(question,answer,sort_order,is_visible,published_at) values
('Are products authentic?','Yes. Catalog items represent products sourced through verified channels.',1,true,now()),
('Where do you deliver?','Voltixa supports serviceable addresses throughout Pakistan.',2,true,now()),
('How does warranty work?','Coverage varies by product and authorized provider.',3,true,now());

insert into public.blog_categories(name,slug) values ('Buying Guides','buying-guides');
insert into public.blog_posts(category_id,title,slug,excerpt,body,status,published_at)
select id,'How to choose your next phone','choose-your-next-phone','A practical Voltixa guide.','Start with daily needs, then compare battery, camera, storage and warranty.','published',now()
from public.blog_categories where slug='buying-guides';

insert into public.site_settings(key,value,is_public) values
('store',jsonb_build_object('brand','Voltixa','tagline','Powering Your Digital Lifestyle','currency','PKR'),true),
('payments',jsonb_build_object('cod',true,'card','adapter_required','jazzcash','adapter_required','easypaisa','adapter_required'),false);

-- Test users must be created through Supabase Auth, then assigned:
-- insert into public.user_roles(user_id,role) values ('AUTH-USER-UUID','super_admin');
