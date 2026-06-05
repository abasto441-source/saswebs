-- ================================================================
-- SASWEBS — Supabase PostgreSQL Schema
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- ================================================================

-- 1. TENANTS
create table if not exists tenants (
  id text primary key default 't-' || gen_random_uuid()::text,
  name text not null,
  subdomain text unique not null,
  custom_domain text,
  plan text not null default 'Starter' check (plan in ('Starter', 'Pro', 'Enterprise')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  is_lms_enabled boolean default false,
  is_ecommerce_enabled boolean default true,
  is_pos_enabled boolean default true,
  is_reservas_enabled boolean default false,
  theme_dark_mode boolean default false,
  stripe_public_key text,
  favicon text,
  google_analytics_id text,
  expiration_date date default (now() + interval '1 year'),
  created_at timestamptz default now()
);

-- 2. USER PROFILES (extends Supabase Auth)
create table if not exists user_profiles (
  id uuid references auth.users on delete cascade primary key,
  tenant_id text references tenants(id) on delete cascade,
  role text not null default 'student' check (role in ('super_admin', 'owner', 'manager', 'pos', 'student')),
  name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- 3. PRODUCTS
create table if not exists products (
  id text primary key default 'p-' || gen_random_uuid()::text,
  tenant_id text not null references tenants(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null default 0,
  stock integer not null default 0,
  barcode text,
  image_url text,
  category text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. ORDERS (POS + eCommerce)
create table if not exists orders (
  id text primary key default 'ord-' || gen_random_uuid()::text,
  tenant_id text not null references tenants(id) on delete cascade,
  customer_email text,
  items jsonb not null default '[]',
  subtotal numeric(10,2) default 0,
  total numeric(10,2) not null default 0,
  payment_method text default 'cash' check (payment_method in ('cash', 'card', 'qr', 'transfer')),
  status text default 'completed' check (status in ('completed', 'pending', 'cancelled', 'refunded')),
  cash_tendered numeric(10,2),
  change_given numeric(10,2),
  created_at timestamptz default now()
);

-- 5. CMS COLLECTIONS
create table if not exists cms_collections (
  id text primary key default 'col-' || gen_random_uuid()::text,
  tenant_id text not null references tenants(id) on delete cascade,
  name text not null,
  slug text not null,
  fields jsonb not null default '[]',
  created_at timestamptz default now(),
  unique(tenant_id, slug)
);

-- 6. CMS ITEMS
create table if not exists cms_items (
  id text primary key default 'item-' || gen_random_uuid()::text,
  collection_id text not null references cms_collections(id) on delete cascade,
  data jsonb not null default '{}',
  created_at timestamptz default now()
);

-- 7. PAGES (Builder)
create table if not exists pages (
  id text primary key default 'p-' || gen_random_uuid()::text,
  tenant_id text not null references tenants(id) on delete cascade,
  slug text not null,
  title text,
  is_published boolean default true,
  structure_json text default '[]',
  updated_at timestamptz default now(),
  unique(tenant_id, slug)
);

-- 8. COURSES (LMS)
create table if not exists courses (
  id text primary key default 'c-' || gen_random_uuid()::text,
  tenant_id text not null references tenants(id) on delete cascade,
  title text not null,
  description text,
  thumbnail text,
  lessons_count integer default 0,
  instructor_name text,
  price numeric(10,2) default 0,
  is_published boolean default true,
  created_at timestamptz default now()
);

-- 9. ENROLLMENTS (LMS)
create table if not exists enrollments (
  id text primary key default 'e-' || gen_random_uuid()::text,
  user_id uuid references auth.users on delete cascade,
  course_id text not null references courses(id) on delete cascade,
  progress integer default 0 check (progress >= 0 and progress <= 100),
  lessons_completed jsonb default '[]',
  enrolled_at timestamptz default now(),
  unique(user_id, course_id)
);

-- 10. RESERVATIONS
create table if not exists reservations (
  id text primary key default 'res-' || gen_random_uuid()::text,
  tenant_id text not null references tenants(id) on delete cascade,
  customer_name text not null,
  email text,
  phone text,
  date_time text not null,
  service_name text,
  status text default 'confirmed' check (status in ('confirmed', 'cancelled', 'completed')),
  created_at timestamptz default now()
);

-- 11. AUDIT LOGS
create table if not exists audit_logs (
  id text primary key default 'audit-' || gen_random_uuid()::text,
  tenant_id text references tenants(id) on delete cascade,
  user_id text,
  action text not null,
  details text,
  ip text default '0.0.0.0',
  created_at timestamptz default now()
);

-- 12. AUTOMATION WORKFLOWS
create table if not exists automation_workflows (
  id text primary key default 'wf-' || gen_random_uuid()::text,
  tenant_id text not null references tenants(id) on delete cascade,
  name text not null,
  trigger_event text not null,
  actions jsonb not null default '[]',
  active boolean default true,
  created_at timestamptz default now()
);

-- 13. BRANCH LOCATIONS (Franquicias)
create table if not exists branch_locations (
  id text primary key default 'br-' || gen_random_uuid()::text,
  tenant_id text not null references tenants(id) on delete cascade,
  name text not null,
  address text,
  mrr numeric(10,2) default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 14. BRANCH INVENTORY
create table if not exists branch_inventory (
  id text primary key default 'bi-' || gen_random_uuid()::text,
  branch_id text not null references branch_locations(id) on delete cascade,
  product_id text not null references products(id) on delete cascade,
  stock integer default 0,
  unique(branch_id, product_id)
);

-- 15. API KEYS
create table if not exists api_keys (
  id text primary key default 'key-' || gen_random_uuid()::text,
  tenant_id text not null references tenants(id) on delete cascade,
  name text not null,
  public_key text unique not null,
  secret_key text unique not null,
  webhooks jsonb default '[]',
  created_at timestamptz default now()
);

-- ================================================================
-- STORED PROCEDURE: Decrement stock (atomic)
-- ================================================================
create or replace function decrement_stock(product_id text, qty integer)
returns void as $$
begin
  update products
  set stock = stock - qty,
      updated_at = now()
  where id = product_id and stock >= qty;
  
  if not found then
    raise exception 'Stock insuficiente para producto %', product_id;
  end if;
end;
$$ language plpgsql security definer;

-- ================================================================
-- ROW LEVEL SECURITY (multi-tenant isolation)
-- ================================================================

-- Helper function: get tenant_id for current user
create or replace function get_user_tenant_id()
returns text as $$
  select tenant_id from user_profiles where id = auth.uid();
$$ language sql security definer stable;

-- Helper function: get user role
create or replace function get_user_role()
returns text as $$
  select role from user_profiles where id = auth.uid();
$$ language sql security definer stable;

-- Enable RLS on all tables
alter table tenants enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table cms_collections enable row level security;
alter table cms_items enable row level security;
alter table pages enable row level security;
alter table courses enable row level security;
alter table enrollments enable row level security;
alter table reservations enable row level security;
alter table audit_logs enable row level security;
alter table automation_workflows enable row level security;
alter table branch_locations enable row level security;
alter table branch_inventory enable row level security;
alter table api_keys enable row level security;

-- PRODUCTS: tenant isolation
create policy "products_tenant_isolation" on products
  using (tenant_id = get_user_tenant_id() or get_user_role() = 'super_admin');

-- ORDERS: tenant isolation
create policy "orders_tenant_isolation" on orders
  using (tenant_id = get_user_tenant_id() or get_user_role() = 'super_admin');

-- PAGES: tenant isolation
create policy "pages_tenant_isolation" on pages
  using (tenant_id = get_user_tenant_id() or get_user_role() = 'super_admin');

-- PAGES: public read for published pages (storefront)
create policy "pages_public_read" on pages
  for select using (is_published = true);

-- CMS COLLECTIONS: tenant isolation
create policy "cms_collections_tenant_isolation" on cms_collections
  using (tenant_id = get_user_tenant_id() or get_user_role() = 'super_admin');

-- CMS ITEMS: via collection
create policy "cms_items_tenant_isolation" on cms_items
  using (
    collection_id in (
      select id from cms_collections where tenant_id = get_user_tenant_id()
    ) or get_user_role() = 'super_admin'
  );

-- COURSES: tenant isolation + public read
create policy "courses_tenant_write" on courses
  using (tenant_id = get_user_tenant_id() or get_user_role() = 'super_admin');

create policy "courses_public_read" on courses
  for select using (is_published = true);

-- ENROLLMENTS: own enrollments only
create policy "enrollments_own" on enrollments
  using (user_id = auth.uid() or get_user_role() in ('super_admin', 'owner', 'manager'));

-- AUDIT LOGS: tenant isolation
create policy "audit_logs_tenant_isolation" on audit_logs
  using (tenant_id = get_user_tenant_id() or get_user_role() = 'super_admin');

-- TENANTS: super admin sees all, others see only their own
create policy "tenants_isolation" on tenants
  using (id = get_user_tenant_id() or get_user_role() = 'super_admin');

-- ================================================================
-- SEED DATA: Tenant inicial + super admin (se crea vía API)
-- ================================================================
insert into tenants (id, name, subdomain, plan, status, is_lms_enabled, is_ecommerce_enabled, is_pos_enabled, is_reservas_enabled)
values 
  ('t-main', 'SASWEBS Principal', 'saswebs', 'Enterprise', 'active', true, true, true, true)
on conflict (id) do nothing;

-- ================================================================
-- INDEXES para performance
-- ================================================================
create index if not exists idx_products_tenant on products(tenant_id);
create index if not exists idx_orders_tenant on orders(tenant_id);
create index if not exists idx_orders_created on orders(created_at desc);
create index if not exists idx_pages_tenant_slug on pages(tenant_id, slug);
create index if not exists idx_cms_items_collection on cms_items(collection_id);
create index if not exists idx_audit_logs_tenant on audit_logs(tenant_id, created_at desc);
create index if not exists idx_enrollments_user on enrollments(user_id);
