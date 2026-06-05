-- ================================================================
-- SASWEBS — Seed de datos iniciales + Usuarios del sistema
-- Ejecutar DESPUÉS de schema.sql en Supabase SQL Editor
-- ================================================================

-- Tenant principal
insert into tenants (id, name, subdomain, plan, status, is_lms_enabled, is_ecommerce_enabled, is_pos_enabled, is_reservas_enabled)
values ('t-main', 'SASWEBS Principal', 'saswebs', 'Enterprise', 'active', true, true, true, true)
on conflict (id) do nothing;

-- Tenant demo: Academia
insert into tenants (id, name, subdomain, plan, status, is_lms_enabled, is_ecommerce_enabled, is_pos_enabled, is_reservas_enabled)
values ('t-celeste', 'Academia y Tienda Celeste S.A.', 'celeste', 'Pro', 'active', true, true, true, true)
on conflict (id) do nothing;

-- Tenant demo: TecnoStore
insert into tenants (id, name, subdomain, plan, status, is_lms_enabled, is_ecommerce_enabled, is_pos_enabled, is_reservas_enabled)
values ('t-tech', 'Ventas de Tecnología TecnoBo', 'tecnobo', 'Starter', 'active', false, true, true, false)
on conflict (id) do nothing;

-- Productos de ejemplo para t-celeste
insert into products (id, tenant_id, name, price, stock, barcode, category) values
('p-1', 't-celeste', 'Lector de Código de Barras Láser USB', 150.00, 25, '7701234567890', 'Hardware'),
('p-2', 't-celeste', 'Impresora Térmica de Recibos 80mm', 320.00, 12, '7701234567891', 'Hardware'),
('p-3', 't-celeste', 'Terminal POS Inteligente Android', 850.00, 8, '7701234567892', 'Terminales'),
('p-4', 't-celeste', 'Abrigo Minimalista de Lana', 120.00, 15, '7701234567895', 'Novedades'),
('p-5', 't-celeste', 'Camisa de Lino Premium', 75.00, 30, '7701234567896', 'Novedades')
on conflict (id) do nothing;

-- Cursos de ejemplo
insert into courses (id, tenant_id, title, description, lessons_count, instructor_name, price) values
('c-nextjs', 't-celeste', 'Desarrollo Full-Stack con Next.js 16', 'Aprende App Router, Server Actions y Tailwind CSS de cero a experto.', 12, 'Rubén Castillo', 49.99),
('c-postgres', 't-celeste', 'PostgreSQL Avanzado y Multi-inquilino', 'Domina esquemas JSONB, Row Level Security (RLS) y optimización.', 8, 'Sarah Connor', 39.99)
on conflict (id) do nothing;

-- CMS Collections
insert into cms_collections (id, tenant_id, name, slug, fields) values
('col-articles', 't-celeste', 'Artículos de Prensa', 'articulos-prensa', 
 '[{"name":"titulo","type":"text"},{"name":"autor","type":"text"},{"name":"contenido","type":"text"},{"name":"fecha","type":"date"}]'::jsonb)
on conflict (id) do nothing;

-- Workflows de automatización
insert into automation_workflows (id, tenant_id, name, trigger_event, actions, active) values
('wf-1', 't-celeste', 'Contacto → Email de confirmación', 'contact_form_submit', '["send_email"]'::jsonb, true),
('wf-2', 't-celeste', 'Venta POS → Log de auditoría', 'pos_sale', '["sync_crm_webhook"]'::jsonb, true)
on conflict (id) do nothing;

-- Audit log inicial
insert into audit_logs (id, tenant_id, user_id, action, details) values
('audit-seed', 't-celeste', 'system@saswebs.com', 'Sistema inicializado', 'Base de datos SASWEBS instalada correctamente con datos semilla.')
on conflict (id) do nothing;

-- ================================================================
-- NOTA: Los usuarios se crean a través del API de autenticación.
-- Los 5 usuarios iniciales serán creados vía /api/auth/register
-- o directamente desde Supabase Auth → Users → Add User.
-- 
-- Usuarios a crear:
-- superadmin@nram360.com | role: super_admin | tenant: t-main
-- owner@nram360.com      | role: owner       | tenant: t-celeste  
-- manager@nram360.com    | role: manager     | tenant: t-celeste
-- cajero@nram360.com     | role: pos         | tenant: t-celeste
-- alumno@nram360.com     | role: student     | tenant: t-celeste
-- ================================================================
