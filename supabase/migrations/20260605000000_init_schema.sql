-- PostgreSQL Schema Definition for SaaS Web & POS Platform (NRAM360)
-- Implementing Logical Multi-tenancy Isolation via Row Level Security (RLS)

-- Enable uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TENANTS TABLE
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    subdomain TEXT UNIQUE NOT NULL,
    custom_domain TEXT UNIQUE,
    plan TEXT NOT NULL DEFAULT 'Pro',
    status TEXT NOT NULL DEFAULT 'active',
    expiration_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. USERS & PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY, -- Maps to auth.users.id
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL, -- Null if Super Admin
    role TEXT NOT NULL DEFAULT 'editor', -- super_admin, tenant_admin, editor, student
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. WEBSITES CONFIGURATION TABLE
CREATE TABLE IF NOT EXISTS websites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    is_lms_enabled BOOLEAN NOT NULL DEFAULT true,
    is_ecommerce_enabled BOOLEAN NOT NULL DEFAULT true,
    is_pos_enabled BOOLEAN NOT NULL DEFAULT true,
    is_qr_payment_enabled BOOLEAN NOT NULL DEFAULT true,
    qr_code_url TEXT,
    google_analytics_id TEXT,
    theme TEXT NOT NULL DEFAULT 'light',
    theme_dark_mode BOOLEAN NOT NULL DEFAULT false,
    favicon TEXT NOT NULL DEFAULT '🎨',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. PAGES TREE TABLE (Decoupled Zustand Tree storage)
CREATE TABLE IF NOT EXISTS pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID REFERENCES websites(id) ON DELETE CASCADE NOT NULL,
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT false,
    structure JSONB NOT NULL DEFAULT '{"blocks": []}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(website_id, slug)
);

-- 5. PRODUCTS INVENTORY TABLE
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    barcode TEXT UNIQUE NOT NULL,
    image_url TEXT,
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. COURSES LMS TABLE
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    thumbnail TEXT,
    lessons_count INTEGER NOT NULL DEFAULT 10,
    instructor_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. ENROLLMENTS & LESSONS PROGRESS TABLE
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0, -- 0 to 100 percentage
    lessons_completed JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(profile_id, course_id)
);

-- 8. ORDERS POS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
    payment_method TEXT NOT NULL, -- cash, card, qr
    total NUMERIC(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'synced',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price NUMERIC(10,2) NOT NULL
);

-- --- ENABLE ROW LEVEL SECURITY (RLS) ---
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- --- RLS POLICIES FOR LOGICAL TENANT ISOLATION ---

-- Tenant isolation helper functions
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
    SELECT tenant_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 1. Profiles Policies
CREATE POLICY "Tenant admin can view profiles of their tenant" ON profiles
    FOR ALL USING (tenant_id = get_user_tenant_id() OR get_user_role() = 'super_admin');

-- 2. Websites Policies
CREATE POLICY "Tenant users can view websites config" ON websites
    FOR ALL USING (tenant_id = get_user_tenant_id() OR get_user_role() = 'super_admin');

-- 3. Pages Policies
CREATE POLICY "Anyone can view published pages" ON pages
    FOR SELECT USING (is_published = true);

CREATE POLICY "Tenant editors can modify pages" ON pages
    FOR ALL USING (
        website_id IN (SELECT id FROM websites WHERE tenant_id = get_user_tenant_id())
        OR get_user_role() = 'super_admin'
    );

-- 4. Products Policies
CREATE POLICY "Anyone can view products list" ON products
    FOR SELECT USING (true);

CREATE POLICY "Tenant editors can manage products" ON products
    FOR ALL USING (tenant_id = get_user_tenant_id() OR get_user_role() = 'super_admin');

-- 5. Courses Policies
CREATE POLICY "Anyone can view courses list" ON courses
    FOR SELECT USING (true);

CREATE POLICY "Tenant editors can manage courses" ON courses
    FOR ALL USING (tenant_id = get_user_tenant_id() OR get_user_role() = 'super_admin');