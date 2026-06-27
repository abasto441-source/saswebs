-- 1. CRM Leads (Prospectos)
CREATE TABLE IF NOT EXISTS crm_leads (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  value NUMERIC(12, 2) DEFAULT 0.00,
  stage TEXT CHECK (stage IN ('prospect', 'contacted', 'qualified', 'proposal', 'won', 'lost')) DEFAULT 'prospect',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS en crm_leads
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY crm_leads_tenant_isolation ON crm_leads
  FOR ALL USING (tenant_id = get_user_tenant_id());

-- 2. Modificaciones a la tabla orders para envíos y tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_status TEXT CHECK (shipping_status IN ('pending', 'packing', 'shipped', 'delivered')) DEFAULT 'pending';

-- 3. Bodegas / Almacenes
CREATE TABLE IF NOT EXISTS inventory_warehouses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS en Bodegas
ALTER TABLE inventory_warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY inventory_warehouses_isolation ON inventory_warehouses
  FOR ALL USING (tenant_id = get_user_tenant_id());

-- 4. Lotes de Inventario
CREATE TABLE IF NOT EXISTS inventory_batches (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id TEXT REFERENCES inventory_warehouses(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 0,
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS en Lotes
ALTER TABLE inventory_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY inventory_batches_isolation ON inventory_batches
  FOR ALL USING (tenant_id = get_user_tenant_id());

-- 5. HelpDesk Tickets
CREATE TABLE IF NOT EXISTS helpdesk_tickets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT CHECK (status IN ('open', 'pending', 'resolved')) DEFAULT 'open',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS en Tickets
ALTER TABLE helpdesk_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY helpdesk_tickets_isolation ON helpdesk_tickets
  FOR ALL USING (tenant_id = get_user_tenant_id());

-- 6. Recursos Humanos (Empleados)
CREATE TABLE IF NOT EXISTS hr_employees (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  salary NUMERIC(12, 2) DEFAULT 0.00,
  hire_date DATE,
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS en Empleados
ALTER TABLE hr_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY hr_employees_isolation ON hr_employees
  FOR ALL USING (tenant_id = get_user_tenant_id());

-- 7. Insertar algunos datos iniciales (Seed) de prueba para Celeste S.A. (t-celeste)
INSERT INTO inventory_warehouses (id, tenant_id, name, location) VALUES
('wh-central', 't-celeste', 'Bodega Central Celeste', 'Av. Vitacura 2300, Santiago'),
('wh-sucursal', 't-celeste', 'Almacén Sucursal Providencia', 'Av. Providencia 1450, Santiago')
ON CONFLICT (id) DO NOTHING;

INSERT INTO hr_employees (id, tenant_id, first_name, last_name, email, role, salary, hire_date, status) VALUES
('emp-1', 't-celeste', 'Carlos', 'Gómez', 'carlos@celeste.com', 'Manager', 2500.00, '2025-01-15', 'active'),
('emp-2', 't-celeste', 'Sofía', 'Pérez', 'sofia@celeste.com', 'Cashier', 1200.00, '2025-03-10', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO crm_leads (id, tenant_id, name, company, email, phone, value, stage) VALUES
('lead-1', 't-celeste', 'Juan González', 'González Distribuidora', 'juan@gonzalez.com', '+56987654321', 5000.00, 'prospect'),
('lead-2', 't-celeste', 'María Rodríguez', 'Rodríguez Retail', 'maria@rodriguez.com', '+56912345678', 12000.00, 'proposal')
ON CONFLICT (id) DO NOTHING;

INSERT INTO helpdesk_tickets (id, tenant_id, customer_name, customer_email, subject, description, status, priority) VALUES
('tkt-1', 't-celeste', 'Pedro Soto', 'pedro@soto.com', 'Falla de sincronización POS', 'La caja registradora no sincroniza el stock local.', 'open', 'high'),
('tkt-2', 't-celeste', 'Lucía Díaz', 'lucia@diaz.com', 'Duda de acceso al curso', 'No puedo ver el módulo 3 del curso de administración.', 'pending', 'medium')
ON CONFLICT (id) DO NOTHING;
