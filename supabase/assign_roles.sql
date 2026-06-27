-- ================================================================
-- NRAM360 — Asignación de perfiles y roles Enterprise
-- Ejecutar en: Supabase → SQL Editor → New query → Run
-- ORDEN: Ejecutar DESPUÉS de schema.sql, seed.sql y las migraciones RBAC
-- ================================================================

-- ---------------------------------------------------------------
-- 1. USER_PROFILES — perfil principal (role = rol primario)
--    Usando los UUIDs reales de Supabase Auth
-- ---------------------------------------------------------------
INSERT INTO user_profiles (id, tenant_id, role, name) VALUES
  ('b6057d63-feb5-43e9-bca7-13afd60c73c3', 't-main',    'super_platform_admin', 'Super Administrador NRAM360'),
  ('d3daa7b7-3cc1-48be-a5a7-ecda7152b19f', 't-celeste', 'owner',                'Dueño — Celeste S.A.'),
  ('b8f0ac69-c51d-47c5-a4bd-77155d383e33', 't-celeste', 'general_manager',      'Gerente General — Celeste'),
  ('a7b86adf-8199-4cde-92aa-acddedb7eca3', 't-celeste', 'cashier',              'Cajero — Celeste POS'),
  ('a004a216-835a-4479-b7dc-e16a9e6cf074', 't-celeste', 'student',              'Alumno — Celeste Academia')
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  role      = EXCLUDED.role,
  name      = EXCLUDED.name;

-- ---------------------------------------------------------------
-- 2. USER_ROLES — asignación Enterprise RBAC (many-to-many)
--    Vincula cada usuario con su rol en la tabla roles
-- ---------------------------------------------------------------

-- Super Platform Admin → rol de sistema (sin tenant)
INSERT INTO user_roles (user_id, role_id, tenant_id, granted_by)
VALUES (
  'b6057d63-feb5-43e9-bca7-13afd60c73c3',
  'r-super-platform-admin',
  NULL,
  'b6057d63-feb5-43e9-bca7-13afd60c73c3'
)
ON CONFLICT (user_id, role_id, tenant_id) DO NOTHING;

-- Owner → propietario de Celeste
INSERT INTO user_roles (user_id, role_id, tenant_id, granted_by)
VALUES (
  'd3daa7b7-3cc1-48be-a5a7-ecda7152b19f',
  'r-owner-celeste',
  't-celeste',
  'b6057d63-feb5-43e9-bca7-13afd60c73c3'
)
ON CONFLICT (user_id, role_id, tenant_id) DO NOTHING;

-- Manager → gerente general de Celeste
INSERT INTO user_roles (user_id, role_id, tenant_id, granted_by)
VALUES (
  'b8f0ac69-c51d-47c5-a4bd-77155d383e33',
  'r-mgr-celeste',
  't-celeste',
  'd3daa7b7-3cc1-48be-a5a7-ecda7152b19f'
)
ON CONFLICT (user_id, role_id, tenant_id) DO NOTHING;

-- Cajero → cashier de Celeste POS
INSERT INTO user_roles (user_id, role_id, tenant_id, granted_by)
VALUES (
  'a7b86adf-8199-4cde-92aa-acddedb7eca3',
  'r-cash-celeste',
  't-celeste',
  'd3daa7b7-3cc1-48be-a5a7-ecda7152b19f'
)
ON CONFLICT (user_id, role_id, tenant_id) DO NOTHING;

-- Alumno → student de Celeste Academia
INSERT INTO user_roles (user_id, role_id, tenant_id, granted_by)
VALUES (
  'a004a216-835a-4479-b7dc-e16a9e6cf074',
  'r-std-celeste',
  't-celeste',
  'd3daa7b7-3cc1-48be-a5a7-ecda7152b19f'
)
ON CONFLICT (user_id, role_id, tenant_id) DO NOTHING;

-- ---------------------------------------------------------------
-- 3. ASIGNAR PERMISOS A LOS ROLES (role_permissions)
--    Solo para los roles del tenant Celeste
-- ---------------------------------------------------------------

-- Owner → todos los permisos disponibles
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'r-owner-celeste', id FROM permissions
ON CONFLICT DO NOTHING;

-- Gerente General → permisos sin billing y sin delete empresa
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'r-mgr-celeste', id FROM permissions
WHERE id NOT IN (
  'company.billing.view',
  'company.users.delete',
  'company.modules.toggle',
  'company.whitelabel.manage',
  'accounting.close_year',
  'accounting.reverse_entries',
  'company.export.all',
  'system.tenants.read',
  'system.*'
)
ON CONFLICT DO NOTHING;

-- Cajero → solo permisos de POS + productos lectura
INSERT INTO role_permissions (role_id, permission_id)
VALUES
  ('r-cash-celeste', 'pos.sales.read'),
  ('r-cash-celeste', 'pos.sales.create'),
  ('r-cash-celeste', 'pos.cashier.open'),
  ('r-cash-celeste', 'pos.cashier.close'),
  ('r-cash-celeste', 'pos.discounts.apply'),
  ('r-cash-celeste', 'products.read'),
  ('r-cash-celeste', 'inventory.adjust'),
  ('r-cash-celeste', 'reservations.read'),
  ('r-cash-celeste', 'reservations.create'),
  ('r-cash-celeste', 'reports.view')
ON CONFLICT DO NOTHING;

-- Estudiante → solo LMS
INSERT INTO role_permissions (role_id, permission_id)
VALUES
  ('r-std-celeste', 'lms.courses.read'),
  ('r-std-celeste', 'lms.grades.read'),
  ('r-std-celeste', 'reservations.read'),
  ('r-std-celeste', 'reservations.create')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------
-- 4. VERIFICACIÓN — consulta rápida para confirmar
-- ---------------------------------------------------------------
SELECT
  up.name,
  up.role AS primary_role,
  up.tenant_id,
  r.name AS rbac_role,
  COUNT(rp.permission_id) AS total_permissions
FROM user_profiles up
LEFT JOIN user_roles ur ON ur.user_id = up.id
LEFT JOIN roles r ON r.id = ur.role_id
LEFT JOIN role_permissions rp ON rp.role_id = ur.role_id
WHERE up.id IN (
  'b6057d63-feb5-43e9-bca7-13afd60c73c3',
  'd3daa7b7-3cc1-48be-a5a7-ecda7152b19f',
  'b8f0ac69-c51d-47c5-a4bd-77155d383e33',
  'a7b86adf-8199-4cde-92aa-acddedb7eca3',
  'a004a216-835a-4479-b7dc-e16a9e6cf074'
)
GROUP BY up.name, up.role, up.tenant_id, r.name
ORDER BY up.name;
