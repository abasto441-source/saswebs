-- Performance Indexes for multi-tenant queries in NRAM360 SaaS
-- Target fields: tenant_id, foreign keys, slugs, composite query paths

CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_websites_tenant_id ON websites(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pages_website_id ON pages(website_id);
CREATE INDEX IF NOT EXISTS idx_pages_website_slug ON pages(website_id, slug);
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_courses_tenant_id ON courses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_profile_course ON enrollments(profile_id, course_id);
CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_crm_leads_tenant_id ON crm_leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_warehouses_tenant_id ON inventory_warehouses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_tenant_id ON inventory_batches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_helpdesk_tickets_tenant_id ON helpdesk_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hr_employees_tenant_id ON hr_employees(tenant_id);
