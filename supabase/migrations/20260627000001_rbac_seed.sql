-- ================================================================
-- NRAM360 RBAC Seed Data
-- File: 20260627000001_rbac_seed.sql
-- Run AFTER 20260627000000_rbac_enterprise.sql
-- ================================================================

-- ---------------------------------------------------------------
-- PERMISSIONS seed (all atomic permissions)
-- ---------------------------------------------------------------
INSERT INTO permissions (id, module, action, description) VALUES
-- System
('system.tenants.read',          'system', 'tenants.read',          'Ver todos los tenants'),
('system.tenants.create',        'system', 'tenants.create',        'Crear nuevos tenants'),
('system.tenants.suspend',       'system', 'tenants.suspend',       'Suspender tenants'),
('system.tenants.delete',        'system', 'tenants.delete',        'Eliminar tenants'),
('system.billing.read',          'system', 'billing.read',          'Ver facturación global'),
('system.billing.manage',        'system', 'billing.manage',        'Gestionar facturación global'),
('system.licenses.read',         'system', 'licenses.read',         'Ver licencias'),
('system.licenses.assign',       'system', 'licenses.assign',       'Asignar licencias'),
('system.partners.manage',       'system', 'partners.manage',       'Gestionar partners'),
('system.marketplace.approve',   'system', 'marketplace.approve',   'Aprobar apps del marketplace'),
('system.users.impersonate',     'system', 'users.impersonate',     'Impersonar usuarios'),
('system.audit.global_read',     'system', 'audit.global_read',     'Ver logs globales'),
('system.devops.deploy',         'system', 'devops.deploy',         'Deployar la plataforma'),
('system.observability.read',    'system', 'observability.read',    'Ver métricas del sistema'),
('system.*',                     'system', '*',                      'Todos los permisos del sistema'),
-- Company
('company.settings.read',        'company', 'settings.read',        'Ver ajustes de la empresa'),
('company.settings.write',       'company', 'settings.write',       'Modificar ajustes de la empresa'),
('company.users.create',         'company', 'users.create',         'Crear usuarios'),
('company.users.delete',         'company', 'users.delete',         'Eliminar usuarios'),
('company.users.suspend',        'company', 'users.suspend',        'Suspender usuarios'),
('company.users.reset_password', 'company', 'users.reset_password', 'Resetear contraseñas'),
('company.users.assign_roles',   'company', 'users.assign_roles',   'Asignar roles a usuarios'),
('company.modules.toggle',       'company', 'modules.toggle',       'Activar/desactivar módulos'),
('company.billing.view',         'company', 'billing.view',         'Ver facturación del tenant'),
('company.whitelabel.manage',    'company', 'whitelabel.manage',    'Gestionar marca propia'),
('company.api_keys.manage',      'company', 'api_keys.manage',      'Gestionar API Keys'),
('company.audit.read',           'company', 'audit.read',           'Ver logs de auditoría'),
('company.export.all',           'company', 'export.all',           'Exportar todos los datos'),
-- Products
('products.read',                'products', 'read',                'Ver productos'),
('products.create',              'products', 'create',              'Crear productos'),
('products.update',              'products', 'update',              'Editar productos'),
('products.delete',              'products', 'delete',              'Eliminar productos'),
('products.export',              'products', 'export',              'Exportar productos'),
('products.import',              'products', 'import',              'Importar productos'),
('inventory.adjust',             'inventory','adjust',              'Ajustar stock'),
('inventory.transfer',           'inventory','transfer',            'Transferir entre sucursales'),
-- Sales
('sales.orders.read',            'sales', 'orders.read',            'Ver pedidos'),
('sales.orders.create',          'sales', 'orders.create',          'Crear pedidos'),
('sales.orders.approve',         'sales', 'orders.approve',         'Aprobar pedidos'),
('sales.orders.cancel',          'sales', 'orders.cancel',          'Cancelar pedidos'),
('sales.discounts',              'sales', 'discounts',              'Aplicar descuentos'),
-- POS
('pos.sales.read',               'pos', 'sales.read',               'Ver ventas POS'),
('pos.sales.create',             'pos', 'sales.create',             'Crear ventas POS'),
('pos.sales.void',               'pos', 'sales.void',               'Anular ventas POS'),
('pos.cashier.open',             'pos', 'cashier.open',             'Abrir caja'),
('pos.cashier.close',            'pos', 'cashier.close',            'Cerrar caja'),
('pos.reports',                  'pos', 'reports',                  'Ver reportes POS'),
('pos.terminals.manage',         'pos', 'terminals.manage',         'Gestionar terminales'),
('pos.discounts.apply',          'pos', 'discounts.apply',          'Aplicar descuentos en caja'),
-- Accounting
('accounting.read',              'accounting', 'read',              'Ver contabilidad'),
('accounting.post_journal',      'accounting', 'post_journal',      'Registrar asientos'),
('accounting.close_month',       'accounting', 'close_month',       'Cierre mensual'),
('accounting.close_year',        'accounting', 'close_year',        'Cierre anual'),
('accounting.approve_payment',   'accounting', 'approve_payment',   'Aprobar pagos'),
('accounting.reverse_entries',   'accounting', 'reverse_entries',   'Reversar asientos'),
('accounting.reports',           'accounting', 'reports',           'Ver reportes contables'),
('accounting.taxes',             'accounting', 'taxes',             'Gestionar impuestos'),
('accounting.banks',             'accounting', 'banks',             'Conciliación bancaria'),
('accounting.budgets',           'accounting', 'budgets',           'Gestionar presupuestos'),
('accounting.export',            'accounting', 'export',            'Exportar contabilidad'),
-- CRM
('crm.contacts.read',            'crm', 'contacts.read',            'Ver contactos'),
('crm.contacts.write',           'crm', 'contacts.write',           'Editar contactos'),
('crm.contacts.delete',          'crm', 'contacts.delete',          'Eliminar contactos'),
('crm.pipeline.read',            'crm', 'pipeline.read',            'Ver pipeline'),
('crm.pipeline.manage',          'crm', 'pipeline.manage',          'Gestionar pipeline'),
-- LMS
('lms.courses.read',             'lms', 'courses.read',             'Ver cursos'),
('lms.courses.create',           'lms', 'courses.create',           'Crear cursos'),
('lms.courses.publish',          'lms', 'courses.publish',          'Publicar cursos'),
('lms.students.read',            'lms', 'students.read',            'Ver estudiantes'),
('lms.students.enroll',          'lms', 'students.enroll',          'Matricular estudiantes'),
('lms.grades.read',              'lms', 'grades.read',              'Ver calificaciones'),
('lms.grades.write',             'lms', 'grades.write',             'Registrar calificaciones'),
('lms.reports',                  'lms', 'reports',                  'Ver reportes LMS'),
('lms.schools.manage',           'lms', 'schools.manage',           'Gestionar escuelas'),
('lms.certificates.issue',       'lms', 'certificates.issue',       'Emitir certificados'),
-- CMS / Website
('cms.collections.read',         'cms', 'collections.read',         'Ver colecciones CMS'),
('cms.collections.manage',       'cms', 'collections.manage',       'Gestionar colecciones CMS'),
('cms.items.read',               'cms', 'items.read',               'Ver registros CMS'),
('cms.items.create',             'cms', 'items.create',             'Crear registros CMS'),
('cms.items.update',             'cms', 'items.update',             'Editar registros CMS'),
('cms.items.delete',             'cms', 'items.delete',             'Eliminar registros CMS'),
('cms.items.publish',            'cms', 'items.publish',            'Publicar registros CMS'),
('website.pages.publish',        'website', 'pages.publish',        'Publicar páginas'),
('website.builder.access',       'website', 'builder.access',       'Acceder al builder'),
('seo.manage',                   'seo', 'manage',                   'Gestionar SEO'),
-- Workflows
('workflows.read',               'workflows', 'read',               'Ver automatizaciones'),
('workflows.create',             'workflows', 'create',             'Crear automatizaciones'),
('workflows.activate',           'workflows', 'activate',           'Activar automatizaciones'),
('workflows.delete',             'workflows', 'delete',             'Eliminar automatizaciones'),
('integrations.read',            'integrations', 'read',            'Ver integraciones'),
('integrations.connect',         'integrations', 'connect',         'Conectar integraciones'),
('api_keys.read',                'api', 'keys.read',                'Ver API keys'),
('api_keys.create',              'api', 'keys.create',              'Crear API keys'),
('api_keys.revoke',              'api', 'keys.revoke',              'Revocar API keys'),
('webhooks.manage',              'webhooks', 'manage',              'Gestionar webhooks'),
-- Purchases
('purchases.orders.read',        'purchases', 'orders.read',        'Ver órdenes de compra'),
('purchases.orders.create',      'purchases', 'orders.create',      'Crear órdenes de compra'),
('purchases.orders.approve',     'purchases', 'orders.approve',     'Aprobar órdenes de compra'),
('purchases.suppliers.manage',   'purchases', 'suppliers.manage',   'Gestionar proveedores'),
-- Reservations
('reservations.read',            'reservations', 'read',            'Ver reservas'),
('reservations.create',          'reservations', 'create',          'Crear reservas'),
('reservations.manage',          'reservations', 'manage',          'Gestionar reservas'),
-- Reports
('reports.view',                 'reports', 'view',                 'Ver reportes'),
('reports.export',               'reports', 'export',               'Exportar reportes'),
('reports.advanced',             'reports', 'advanced',             'Reportes avanzados')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------
-- SYSTEM ROLES (is_system_role = true, tenant_id = NULL)
-- ---------------------------------------------------------------
INSERT INTO roles (id, tenant_id, name, slug, description, is_system_role, color, icon) VALUES
('r-super-platform-admin', NULL, 'Super Platform Admin', 'super_platform_admin', 'Administrador global del SaaS. Acceso total.',               true, 'purple', '⚡'),
('r-platform-admin',       NULL, 'Platform Admin',       'platform_admin',       'Administrador de la plataforma.',                           true, 'indigo', '🛡️'),
('r-support-engineer',     NULL, 'Support Engineer',     'support_engineer',     'Soporte técnico con acceso de lectura.',                    true, 'blue',   '🔧'),
('r-security-auditor',     NULL, 'Security Auditor',     'security_auditor',     'Auditor de seguridad. Solo lectura de logs.',               true, 'red',    '🔒'),
('r-billing-admin',        NULL, 'Billing Admin',        'billing_admin',        'Administra facturación y licencias del SaaS.',              true, 'green',  '💰'),
('r-marketplace-admin',    NULL, 'Marketplace Admin',    'marketplace_admin',    'Modera extensiones del marketplace.',                       true, 'orange', '🛍️'),
('r-developer',            NULL, 'Developer',            'developer',            'Acceso a API Keys y webhooks globales.',                    true, 'gray',   '💻'),
('r-devops',               NULL, 'DevOps',               'devops',               'Infraestructura y deploys.',                               true, 'yellow', '⚙️'),
('r-observability',        NULL, 'Observability Admin',  'observability_admin',  'Métricas y alertas del sistema.',                          true, 'teal',   '📊'),
('r-partner-manager',      NULL, 'Partner Manager',      'partner_manager',      'Gestiona resellers y partners.',                           true, 'pink',   '🤝')
ON CONFLICT (id) DO NOTHING;

-- Default company roles (for each tenant seed - reference these in seed.sql)
INSERT INTO roles (id, tenant_id, name, slug, description, is_system_role, color, icon) VALUES
('r-owner-celeste',  't-celeste', 'Propietario',      'owner',              'Propietario de la empresa con acceso total.',  true, 'cyan',    '👑'),
('r-mgr-celeste',    't-celeste', 'Gerente General',  'general_manager',    'Gerente operativo de la empresa.',            true, 'blue',    '💼'),
('r-admin-celeste',  't-celeste', 'Administrador',    'administrator',      'Administrador del sistema interno.',          true, 'blue',    '🛠️'),
('r-acc-celeste',    't-celeste', 'Contador',         'accountant',         'Contabilidad y finanzas.',                    true, 'green',   '📒'),
('r-cash-celeste',   't-celeste', 'Cajero',           'cashier',            'Operador de caja POS.',                       true, 'amber',   '🏪'),
('r-wh-celeste',     't-celeste', 'Almacén',          'warehouse',          'Gestión de inventario.',                      true, 'orange',  '📦'),
('r-sales-celeste',  't-celeste', 'Ventas',           'sales',              'Equipo de ventas y CRM.',                     true, 'emerald', '📈'),
('r-pur-celeste',    't-celeste', 'Compras',          'purchasing',         'Compras y proveedores.',                      true, 'lime',    '🛒'),
('r-std-celeste',    't-celeste', 'Estudiante',       'student',            'Acceso al LMS como estudiante.',              true, 'rose',    '📚'),
('r-guest-celeste',  't-celeste', 'Invitado',         'guest',              'Acceso de solo lectura.',                     true, 'slate',   '👤')
ON CONFLICT (id) DO NOTHING;
