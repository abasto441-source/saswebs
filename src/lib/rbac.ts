/**
 * NRAM360 Enterprise RBAC Engine
 * 
 * Architecture:
 *   - Permissions are atomic strings: "module.action" (e.g., "products.create")
 *   - Roles group permissions and are stored in the DB (not hardcoded)
 *   - System roles (super_platform_admin, etc.) have hardcoded permissions for bootstrap
 *   - Tenant roles are fully customizable from the database
 */

// ============================================================
// PERMISSION CATALOGUE (the full list of what exists)
// ============================================================
export const PERMISSIONS = {
  // System-level (Nivel 1 - SaaS)
  SYSTEM_TENANTS_READ:       "system.tenants.read",
  SYSTEM_TENANTS_CREATE:     "system.tenants.create",
  SYSTEM_TENANTS_SUSPEND:    "system.tenants.suspend",
  SYSTEM_TENANTS_DELETE:     "system.tenants.delete",
  SYSTEM_BILLING_READ:       "system.billing.read",
  SYSTEM_BILLING_MANAGE:     "system.billing.manage",
  SYSTEM_LICENSES_READ:      "system.licenses.read",
  SYSTEM_LICENSES_ASSIGN:    "system.licenses.assign",
  SYSTEM_PARTNERS_MANAGE:    "system.partners.manage",
  SYSTEM_MARKETPLACE_APPROVE:"system.marketplace.approve",
  SYSTEM_USERS_IMPERSONATE:  "system.users.impersonate",
  SYSTEM_AUDIT_GLOBAL_READ:  "system.audit.global_read",
  SYSTEM_DEVOPS_DEPLOY:      "system.devops.deploy",
  SYSTEM_OBSERVABILITY_READ: "system.observability.read",
  SYSTEM_ALL:                "system.*",

  // Company-level (Nivel 2 - Empresa)
  COMPANY_SETTINGS_READ:     "company.settings.read",
  COMPANY_SETTINGS_WRITE:    "company.settings.write",
  COMPANY_USERS_CREATE:      "company.users.create",
  COMPANY_USERS_DELETE:      "company.users.delete",
  COMPANY_USERS_SUSPEND:     "company.users.suspend",
  COMPANY_USERS_RESET_PW:    "company.users.reset_password",
  COMPANY_USERS_ASSIGN_ROLES:"company.users.assign_roles",
  COMPANY_MODULES_TOGGLE:    "company.modules.toggle",
  COMPANY_BILLING_VIEW:      "company.billing.view",
  COMPANY_WHITELABEL_MANAGE: "company.whitelabel.manage",
  COMPANY_API_KEYS_MANAGE:   "company.api_keys.manage",
  COMPANY_AUDIT_READ:        "company.audit.read",
  COMPANY_EXPORT_ALL:        "company.export.all",

  // Products & Inventory
  PRODUCTS_READ:             "products.read",
  PRODUCTS_CREATE:           "products.create",
  PRODUCTS_UPDATE:           "products.update",
  PRODUCTS_DELETE:           "products.delete",
  PRODUCTS_EXPORT:           "products.export",
  PRODUCTS_IMPORT:           "products.import",
  INVENTORY_ADJUST:          "inventory.adjust",
  INVENTORY_TRANSFER:        "inventory.transfer",

  // Sales / Orders
  SALES_ORDERS_READ:         "sales.orders.read",
  SALES_ORDERS_CREATE:       "sales.orders.create",
  SALES_ORDERS_APPROVE:      "sales.orders.approve",
  SALES_ORDERS_CANCEL:       "sales.orders.cancel",
  SALES_DISCOUNTS:           "sales.discounts",

  // POS
  POS_SALES_READ:            "pos.sales.read",
  POS_SALES_CREATE:          "pos.sales.create",
  POS_SALES_VOID:            "pos.sales.void",
  POS_CASHIER_OPEN:          "pos.cashier.open",
  POS_CASHIER_CLOSE:         "pos.cashier.close",
  POS_REPORTS:               "pos.reports",
  POS_TERMINALS_MANAGE:      "pos.terminals.manage",
  POS_DISCOUNTS_APPLY:       "pos.discounts.apply",

  // Accounting
  ACCOUNTING_READ:           "accounting.read",
  ACCOUNTING_POST_JOURNAL:   "accounting.post_journal",
  ACCOUNTING_CLOSE_MONTH:    "accounting.close_month",
  ACCOUNTING_CLOSE_YEAR:     "accounting.close_year",
  ACCOUNTING_APPROVE_PAYMENT:"accounting.approve_payment",
  ACCOUNTING_REVERSE_ENTRIES:"accounting.reverse_entries",
  ACCOUNTING_REPORTS:        "accounting.reports",
  ACCOUNTING_TAXES:          "accounting.taxes",
  ACCOUNTING_BANKS:          "accounting.banks",
  ACCOUNTING_BUDGETS:        "accounting.budgets",
  ACCOUNTING_EXPORT:         "accounting.export",

  // CRM
  CRM_CONTACTS_READ:         "crm.contacts.read",
  CRM_CONTACTS_WRITE:        "crm.contacts.write",
  CRM_CONTACTS_DELETE:       "crm.contacts.delete",
  CRM_PIPELINE_READ:         "crm.pipeline.read",
  CRM_PIPELINE_MANAGE:       "crm.pipeline.manage",

  // LMS / Education
  LMS_COURSES_READ:          "lms.courses.read",
  LMS_COURSES_CREATE:        "lms.courses.create",
  LMS_COURSES_PUBLISH:       "lms.courses.publish",
  LMS_STUDENTS_READ:         "lms.students.read",
  LMS_STUDENTS_ENROLL:       "lms.students.enroll",
  LMS_GRADES_READ:           "lms.grades.read",
  LMS_GRADES_WRITE:          "lms.grades.write",
  LMS_REPORTS:               "lms.reports",
  LMS_SCHOOLS_MANAGE:        "lms.schools.manage",
  LMS_CERTIFICATES_ISSUE:    "lms.certificates.issue",

  // CMS & Website
  CMS_COLLECTIONS_READ:      "cms.collections.read",
  CMS_COLLECTIONS_MANAGE:    "cms.collections.manage",
  CMS_ITEMS_READ:            "cms.items.read",
  CMS_ITEMS_CREATE:          "cms.items.create",
  CMS_ITEMS_UPDATE:          "cms.items.update",
  CMS_ITEMS_DELETE:          "cms.items.delete",
  CMS_ITEMS_PUBLISH:         "cms.items.publish",
  WEBSITE_PAGES_PUBLISH:     "website.pages.publish",
  WEBSITE_BUILDER_ACCESS:    "website.builder.access",
  SEO_MANAGE:                "seo.manage",

  // Workflows & Integrations
  WORKFLOWS_READ:            "workflows.read",
  WORKFLOWS_CREATE:          "workflows.create",
  WORKFLOWS_ACTIVATE:        "workflows.activate",
  WORKFLOWS_DELETE:          "workflows.delete",
  INTEGRATIONS_READ:         "integrations.read",
  INTEGRATIONS_CONNECT:      "integrations.connect",
  API_KEYS_READ:             "api_keys.read",
  API_KEYS_CREATE:           "api_keys.create",
  API_KEYS_REVOKE:           "api_keys.revoke",
  WEBHOOKS_MANAGE:           "webhooks.manage",

  // Purchases
  PURCHASES_ORDERS_READ:     "purchases.orders.read",
  PURCHASES_ORDERS_CREATE:   "purchases.orders.create",
  PURCHASES_ORDERS_APPROVE:  "purchases.orders.approve",
  PURCHASES_SUPPLIERS_MANAGE:"purchases.suppliers.manage",

  // Reports (cross-module)
  REPORTS_VIEW:              "reports.view",
  REPORTS_EXPORT:            "reports.export",
  REPORTS_ADVANCED:          "reports.advanced",

  // Reservations
  RESERVATIONS_READ:         "reservations.read",
  RESERVATIONS_CREATE:       "reservations.create",
  RESERVATIONS_MANAGE:       "reservations.manage",
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// ============================================================
// SYSTEM ROLES (hardcoded bootstrap — cannot be modified by tenants)
// These are for Nivel 1 (SaaS platform operators)
// ============================================================
export type SystemRoleId =
  | "super_platform_admin"
  | "platform_admin"
  | "support_engineer"
  | "security_auditor"
  | "billing_admin"
  | "marketplace_admin"
  | "developer"
  | "devops"
  | "observability_admin"
  | "partner_manager"
  // Nivel 2 — defaults (can be overridden per tenant)
  | "owner"
  | "co_owner"
  | "general_manager"
  | "administrator"
  | "supervisor"
  | "accountant"
  | "cashier"
  | "warehouse"
  | "sales"
  | "purchasing"
  | "hr"
  | "support"
  | "customer"
  | "student"
  | "api_user"
  | "guest";

// Permissions bundled per system role (used when DB is not available / bootstrapping)
export const SYSTEM_ROLE_PERMISSIONS: Record<SystemRoleId, Permission[]> = {
  super_platform_admin: [PERMISSIONS.SYSTEM_ALL as Permission],

  platform_admin: [
    PERMISSIONS.SYSTEM_TENANTS_READ,
    PERMISSIONS.SYSTEM_TENANTS_CREATE,
    PERMISSIONS.SYSTEM_TENANTS_SUSPEND,
    PERMISSIONS.SYSTEM_BILLING_READ,
    PERMISSIONS.SYSTEM_BILLING_MANAGE,
    PERMISSIONS.SYSTEM_LICENSES_READ,
    PERMISSIONS.SYSTEM_LICENSES_ASSIGN,
    PERMISSIONS.SYSTEM_PARTNERS_MANAGE,
    PERMISSIONS.SYSTEM_MARKETPLACE_APPROVE,
    PERMISSIONS.SYSTEM_AUDIT_GLOBAL_READ,
    PERMISSIONS.SYSTEM_OBSERVABILITY_READ,
  ],

  support_engineer: [
    PERMISSIONS.SYSTEM_TENANTS_READ,
    PERMISSIONS.SYSTEM_USERS_IMPERSONATE,
    PERMISSIONS.SYSTEM_AUDIT_GLOBAL_READ,
    PERMISSIONS.SYSTEM_OBSERVABILITY_READ,
  ],

  security_auditor: [
    PERMISSIONS.SYSTEM_AUDIT_GLOBAL_READ,
    PERMISSIONS.SYSTEM_OBSERVABILITY_READ,
    PERMISSIONS.SYSTEM_TENANTS_READ,
  ],

  billing_admin: [
    PERMISSIONS.SYSTEM_BILLING_READ,
    PERMISSIONS.SYSTEM_BILLING_MANAGE,
    PERMISSIONS.SYSTEM_LICENSES_READ,
    PERMISSIONS.SYSTEM_LICENSES_ASSIGN,
    PERMISSIONS.SYSTEM_PARTNERS_MANAGE,
  ],

  marketplace_admin: [
    PERMISSIONS.SYSTEM_MARKETPLACE_APPROVE,
    PERMISSIONS.SYSTEM_TENANTS_READ,
  ],

  developer: [
    PERMISSIONS.API_KEYS_READ,
    PERMISSIONS.API_KEYS_CREATE,
    PERMISSIONS.WEBHOOKS_MANAGE,
    PERMISSIONS.SYSTEM_TENANTS_READ,
  ],

  devops: [
    PERMISSIONS.SYSTEM_DEVOPS_DEPLOY,
    PERMISSIONS.SYSTEM_OBSERVABILITY_READ,
    PERMISSIONS.SYSTEM_TENANTS_READ,
  ],

  observability_admin: [
    PERMISSIONS.SYSTEM_OBSERVABILITY_READ,
    PERMISSIONS.SYSTEM_AUDIT_GLOBAL_READ,
  ],

  partner_manager: [
    PERMISSIONS.SYSTEM_PARTNERS_MANAGE,
    PERMISSIONS.SYSTEM_LICENSES_READ,
    PERMISSIONS.SYSTEM_LICENSES_ASSIGN,
    PERMISSIONS.SYSTEM_TENANTS_READ,
  ],

  // NIVEL 2 — EMPRESA (default permissions, can be overridden in DB)
  owner: [
    PERMISSIONS.COMPANY_SETTINGS_READ,   PERMISSIONS.COMPANY_SETTINGS_WRITE,
    PERMISSIONS.COMPANY_USERS_CREATE,    PERMISSIONS.COMPANY_USERS_DELETE,
    PERMISSIONS.COMPANY_USERS_SUSPEND,   PERMISSIONS.COMPANY_USERS_RESET_PW,
    PERMISSIONS.COMPANY_USERS_ASSIGN_ROLES, PERMISSIONS.COMPANY_MODULES_TOGGLE,
    PERMISSIONS.COMPANY_BILLING_VIEW,    PERMISSIONS.COMPANY_WHITELABEL_MANAGE,
    PERMISSIONS.COMPANY_API_KEYS_MANAGE, PERMISSIONS.COMPANY_AUDIT_READ,
    PERMISSIONS.COMPANY_EXPORT_ALL,
    PERMISSIONS.PRODUCTS_READ,           PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_UPDATE,         PERMISSIONS.PRODUCTS_DELETE,
    PERMISSIONS.PRODUCTS_EXPORT,         PERMISSIONS.PRODUCTS_IMPORT,
    PERMISSIONS.INVENTORY_ADJUST,        PERMISSIONS.INVENTORY_TRANSFER,
    PERMISSIONS.SALES_ORDERS_READ,       PERMISSIONS.SALES_ORDERS_CREATE,
    PERMISSIONS.SALES_ORDERS_APPROVE,    PERMISSIONS.SALES_ORDERS_CANCEL,
    PERMISSIONS.SALES_DISCOUNTS,
    PERMISSIONS.POS_SALES_READ,          PERMISSIONS.POS_SALES_CREATE,
    PERMISSIONS.POS_SALES_VOID,          PERMISSIONS.POS_CASHIER_OPEN,
    PERMISSIONS.POS_CASHIER_CLOSE,       PERMISSIONS.POS_REPORTS,
    PERMISSIONS.POS_TERMINALS_MANAGE,    PERMISSIONS.POS_DISCOUNTS_APPLY,
    PERMISSIONS.ACCOUNTING_READ,         PERMISSIONS.ACCOUNTING_POST_JOURNAL,
    PERMISSIONS.ACCOUNTING_CLOSE_MONTH,  PERMISSIONS.ACCOUNTING_CLOSE_YEAR,
    PERMISSIONS.ACCOUNTING_APPROVE_PAYMENT, PERMISSIONS.ACCOUNTING_REPORTS,
    PERMISSIONS.ACCOUNTING_TAXES,        PERMISSIONS.ACCOUNTING_BANKS,
    PERMISSIONS.ACCOUNTING_BUDGETS,      PERMISSIONS.ACCOUNTING_EXPORT,
    PERMISSIONS.LMS_COURSES_READ,        PERMISSIONS.LMS_COURSES_CREATE,
    PERMISSIONS.LMS_COURSES_PUBLISH,     PERMISSIONS.LMS_STUDENTS_READ,
    PERMISSIONS.LMS_STUDENTS_ENROLL,     PERMISSIONS.LMS_GRADES_READ,
    PERMISSIONS.LMS_GRADES_WRITE,        PERMISSIONS.LMS_REPORTS,
    PERMISSIONS.LMS_SCHOOLS_MANAGE,      PERMISSIONS.LMS_CERTIFICATES_ISSUE,
    PERMISSIONS.CMS_COLLECTIONS_READ,    PERMISSIONS.CMS_COLLECTIONS_MANAGE,
    PERMISSIONS.CMS_ITEMS_READ,          PERMISSIONS.CMS_ITEMS_CREATE,
    PERMISSIONS.CMS_ITEMS_UPDATE,        PERMISSIONS.CMS_ITEMS_DELETE,
    PERMISSIONS.CMS_ITEMS_PUBLISH,       PERMISSIONS.WEBSITE_PAGES_PUBLISH,
    PERMISSIONS.WEBSITE_BUILDER_ACCESS,  PERMISSIONS.SEO_MANAGE,
    PERMISSIONS.WORKFLOWS_READ,          PERMISSIONS.WORKFLOWS_CREATE,
    PERMISSIONS.WORKFLOWS_ACTIVATE,      PERMISSIONS.WORKFLOWS_DELETE,
    PERMISSIONS.INTEGRATIONS_READ,       PERMISSIONS.INTEGRATIONS_CONNECT,
    PERMISSIONS.API_KEYS_READ,           PERMISSIONS.API_KEYS_CREATE,
    PERMISSIONS.API_KEYS_REVOKE,         PERMISSIONS.WEBHOOKS_MANAGE,
    PERMISSIONS.RESERVATIONS_READ,       PERMISSIONS.RESERVATIONS_CREATE,
    PERMISSIONS.RESERVATIONS_MANAGE,
    PERMISSIONS.REPORTS_VIEW,            PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.REPORTS_ADVANCED,
    PERMISSIONS.CRM_CONTACTS_READ,       PERMISSIONS.CRM_CONTACTS_WRITE,
    PERMISSIONS.CRM_PIPELINE_READ,       PERMISSIONS.CRM_PIPELINE_MANAGE,
    PERMISSIONS.PURCHASES_ORDERS_READ,   PERMISSIONS.PURCHASES_ORDERS_CREATE,
    PERMISSIONS.PURCHASES_ORDERS_APPROVE,PERMISSIONS.PURCHASES_SUPPLIERS_MANAGE,
  ],

  co_owner: [], // Same as owner — inherits at runtime

  general_manager: [
    PERMISSIONS.COMPANY_SETTINGS_READ,   PERMISSIONS.COMPANY_USERS_CREATE,
    PERMISSIONS.COMPANY_USERS_SUSPEND,   PERMISSIONS.COMPANY_USERS_ASSIGN_ROLES,
    PERMISSIONS.COMPANY_AUDIT_READ,      PERMISSIONS.COMPANY_EXPORT_ALL,
    PERMISSIONS.PRODUCTS_READ,           PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_UPDATE,         PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.INVENTORY_TRANSFER,      PERMISSIONS.SALES_ORDERS_READ,
    PERMISSIONS.SALES_ORDERS_CREATE,     PERMISSIONS.SALES_ORDERS_APPROVE,
    PERMISSIONS.SALES_DISCOUNTS,         PERMISSIONS.POS_SALES_READ,
    PERMISSIONS.POS_REPORTS,             PERMISSIONS.ACCOUNTING_READ,
    PERMISSIONS.ACCOUNTING_REPORTS,      PERMISSIONS.LMS_COURSES_READ,
    PERMISSIONS.LMS_STUDENTS_READ,       PERMISSIONS.LMS_REPORTS,
    PERMISSIONS.CMS_ITEMS_READ,          PERMISSIONS.RESERVATIONS_READ,
    PERMISSIONS.RESERVATIONS_MANAGE,     PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,          PERMISSIONS.REPORTS_ADVANCED,
  ],

  administrator: [
    PERMISSIONS.COMPANY_SETTINGS_READ,   PERMISSIONS.COMPANY_SETTINGS_WRITE,
    PERMISSIONS.COMPANY_USERS_CREATE,    PERMISSIONS.COMPANY_USERS_SUSPEND,
    PERMISSIONS.COMPANY_USERS_ASSIGN_ROLES, PERMISSIONS.COMPANY_AUDIT_READ,
    PERMISSIONS.PRODUCTS_READ,           PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_UPDATE,         PERMISSIONS.PRODUCTS_DELETE,
    PERMISSIONS.INVENTORY_ADJUST,        PERMISSIONS.INVENTORY_TRANSFER,
    PERMISSIONS.REPORTS_VIEW,            PERMISSIONS.REPORTS_EXPORT,
  ],

  supervisor: [
    PERMISSIONS.PRODUCTS_READ,           PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.SALES_ORDERS_READ,       PERMISSIONS.POS_SALES_READ,
    PERMISSIONS.REPORTS_VIEW,            PERMISSIONS.COMPANY_AUDIT_READ,
  ],

  accountant: [
    PERMISSIONS.ACCOUNTING_READ,         PERMISSIONS.ACCOUNTING_POST_JOURNAL,
    PERMISSIONS.ACCOUNTING_REPORTS,      PERMISSIONS.ACCOUNTING_EXPORT,
    PERMISSIONS.REPORTS_VIEW,            PERMISSIONS.REPORTS_EXPORT,
  ],

  cashier: [
    PERMISSIONS.POS_SALES_READ,          PERMISSIONS.POS_SALES_CREATE,
    PERMISSIONS.POS_CASHIER_OPEN,        PERMISSIONS.POS_CASHIER_CLOSE,
    PERMISSIONS.POS_DISCOUNTS_APPLY,     PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.INVENTORY_ADJUST,        PERMISSIONS.RESERVATIONS_READ,
    PERMISSIONS.RESERVATIONS_CREATE,
  ],

  warehouse: [
    PERMISSIONS.PRODUCTS_READ,           PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.INVENTORY_TRANSFER,      PERMISSIONS.PURCHASES_ORDERS_READ,
  ],

  sales: [
    PERMISSIONS.PRODUCTS_READ,           PERMISSIONS.SALES_ORDERS_READ,
    PERMISSIONS.SALES_ORDERS_CREATE,     PERMISSIONS.SALES_DISCOUNTS,
    PERMISSIONS.CRM_CONTACTS_READ,       PERMISSIONS.CRM_CONTACTS_WRITE,
    PERMISSIONS.CRM_PIPELINE_READ,       PERMISSIONS.CRM_PIPELINE_MANAGE,
    PERMISSIONS.REPORTS_VIEW,
  ],

  purchasing: [
    PERMISSIONS.PRODUCTS_READ,           PERMISSIONS.PURCHASES_ORDERS_READ,
    PERMISSIONS.PURCHASES_ORDERS_CREATE, PERMISSIONS.PURCHASES_SUPPLIERS_MANAGE,
    PERMISSIONS.INVENTORY_ADJUST,
  ],

  hr: [
    PERMISSIONS.COMPANY_USERS_CREATE,    PERMISSIONS.COMPANY_USERS_SUSPEND,
    PERMISSIONS.COMPANY_USERS_RESET_PW,
  ],

  support: [
    PERMISSIONS.CRM_CONTACTS_READ,       PERMISSIONS.SALES_ORDERS_READ,
    PERMISSIONS.RESERVATIONS_READ,       PERMISSIONS.LMS_STUDENTS_READ,
  ],

  customer: [
    PERMISSIONS.SALES_ORDERS_READ,       PERMISSIONS.LMS_COURSES_READ,
    PERMISSIONS.RESERVATIONS_READ,       PERMISSIONS.RESERVATIONS_CREATE,
  ],

  student: [
    PERMISSIONS.LMS_COURSES_READ,        PERMISSIONS.LMS_GRADES_READ,
  ],

  api_user: [
    PERMISSIONS.PRODUCTS_READ,           PERMISSIONS.SALES_ORDERS_READ,
    PERMISSIONS.SALES_ORDERS_CREATE,
  ],

  guest: [
    PERMISSIONS.PRODUCTS_READ,           PERMISSIONS.LMS_COURSES_READ,
    PERMISSIONS.CMS_ITEMS_READ,          PERMISSIONS.RESERVATIONS_CREATE,
  ],
};

// ============================================================
// ROLE DISPLAY INFO (for UI)
// ============================================================
export const ROLE_DISPLAY: Record<string, {
  label: string;
  level: "system" | "company" | "department";
  color: string;
  icon: string;
}> = {
  super_platform_admin: { label: "Super Admin SaaS",   level: "system",     color: "purple", icon: "⚡" },
  platform_admin:       { label: "Platform Admin",      level: "system",     color: "indigo", icon: "🛡️" },
  support_engineer:     { label: "Soporte Técnico",     level: "system",     color: "blue",   icon: "🔧" },
  security_auditor:     { label: "Auditor Seguridad",   level: "system",     color: "red",    icon: "🔒" },
  billing_admin:        { label: "Admin Facturación",   level: "system",     color: "green",  icon: "💰" },
  marketplace_admin:    { label: "Admin Marketplace",   level: "system",     color: "orange", icon: "🛍️" },
  developer:            { label: "Desarrollador",       level: "system",     color: "gray",   icon: "💻" },
  devops:               { label: "DevOps",              level: "system",     color: "yellow", icon: "⚙️" },
  observability_admin:  { label: "Admin Observabilidad",level: "system",     color: "teal",   icon: "📊" },
  partner_manager:      { label: "Manager de Partners", level: "system",     color: "pink",   icon: "🤝" },
  owner:                { label: "Propietario",          level: "company",    color: "cyan",   icon: "👑" },
  co_owner:             { label: "Co-Propietario",       level: "company",    color: "cyan",   icon: "👑" },
  general_manager:      { label: "Gerente General",      level: "company",    color: "blue",   icon: "💼" },
  administrator:        { label: "Administrador",        level: "company",    color: "blue",   icon: "🛠️" },
  supervisor:           { label: "Supervisor",           level: "company",    color: "teal",   icon: "👁️" },
  accountant:           { label: "Contador",             level: "department", color: "green",  icon: "📒" },
  cashier:              { label: "Cajero",               level: "department", color: "amber",  icon: "🏪" },
  warehouse:            { label: "Almacén",              level: "department", color: "orange", icon: "📦" },
  sales:                { label: "Ventas",               level: "department", color: "emerald",icon: "📈" },
  purchasing:           { label: "Compras",              level: "department", color: "lime",   icon: "🛒" },
  hr:                   { label: "RRHH",                 level: "department", color: "pink",   icon: "👥" },
  support:              { label: "Soporte",              level: "department", color: "sky",    icon: "🎧" },
  customer:             { label: "Cliente",              level: "company",    color: "slate",  icon: "🧑" },
  student:              { label: "Estudiante",           level: "company",    color: "rose",   icon: "📚" },
  api_user:             { label: "API User",             level: "company",    color: "gray",   icon: "🔑" },
  guest:                { label: "Invitado",             level: "company",    color: "slate",  icon: "👤" },
};

// ============================================================
// RUNTIME PERMISSION ENGINE
// ============================================================

export interface UserSession {
  id: string;
  email: string;
  role: string;              // Primary role (from user_profiles)
  roles?: string[];          // All roles (from user_roles table)
  permissions?: Permission[]; // Pre-computed permissions (from login response)
  tenantId?: string;
  isSystemUser?: boolean;
}

/**
 * Compute effective permissions for a user based on their roles.
 * Falls back to SYSTEM_ROLE_PERMISSIONS if DB permissions not available.
 */
export function computePermissions(user: UserSession): Set<Permission> {
  const perms = new Set<Permission>();

  // If permissions were pre-loaded (from login API response), use them directly
  if (user.permissions?.length) {
    user.permissions.forEach((p) => perms.add(p));
    return perms;
  }

  // Fallback: compute from hardcoded SYSTEM_ROLE_PERMISSIONS
  const allRoles = user.roles?.length
    ? user.roles
    : [user.role];

  for (const role of allRoles) {
    const rolePerms = SYSTEM_ROLE_PERMISSIONS[role as SystemRoleId] || [];

    // Handle wildcard permission
    if (rolePerms.includes(PERMISSIONS.SYSTEM_ALL as Permission)) {
      // super_platform_admin gets everything
      Object.values(PERMISSIONS).forEach((p) => perms.add(p as Permission));
      return perms;
    }

    rolePerms.forEach((p) => perms.add(p));

    // co_owner inherits owner permissions
    if (role === "co_owner") {
      SYSTEM_ROLE_PERMISSIONS.owner.forEach((p) => perms.add(p));
    }
  }

  return perms;
}

/**
 * Check if a user has a specific permission.
 * Use this in API routes and components.
 * 
 * @example
 * if (!hasPermission(user, PERMISSIONS.PRODUCTS_CREATE)) {
 *   return 403;
 * }
 */
export function hasPermission(user: UserSession, permission: Permission): boolean {
  if (!user) return false;

  // System super admin bypasses all checks
  if (user.role === "super_platform_admin") return true;

  const perms = computePermissions(user);

  // Check wildcard module permission (e.g., "system.*")
  const [module] = permission.split(".");
  if (perms.has(`${module}.*` as Permission)) return true;

  return perms.has(permission);
}

/**
 * Check multiple permissions (user must have ALL of them).
 */
export function hasAllPermissions(user: UserSession, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(user, p));
}

/**
 * Check multiple permissions (user must have AT LEAST ONE).
 */
export function hasAnyPermission(user: UserSession, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(user, p));
}

/**
 * Get allowed tab keys for dashboard navigation based on user permissions.
 * Returns a list of tab identifiers the user can see.
 */
export function getAllowedTabs(user: UserSession): string[] {
  const tabs: string[] = [];

  if (hasPermission(user, PERMISSIONS.REPORTS_VIEW))            tabs.push("analytics");
  if (hasPermission(user, PERMISSIONS.PRODUCTS_READ))           tabs.push("products");
  if (hasPermission(user, PERMISSIONS.LMS_COURSES_READ))        tabs.push("courses");
  if (hasPermission(user, PERMISSIONS.LMS_STUDENTS_READ))       tabs.push("lms_users");
  if (hasPermission(user, PERMISSIONS.RESERVATIONS_READ))       tabs.push("reservations");
  if (hasPermission(user, PERMISSIONS.COMPANY_MODULES_TOGGLE))  tabs.push("apps");
  if (hasPermission(user, PERMISSIONS.COMPANY_SETTINGS_READ))   tabs.push("settings");
  if (hasPermission(user, PERMISSIONS.CMS_ITEMS_READ))          tabs.push("cms");
  if (hasPermission(user, PERMISSIONS.WORKFLOWS_READ))          tabs.push("workflows");
  if (hasPermission(user, PERMISSIONS.INTEGRATIONS_READ))       tabs.push("integrations");
  if (hasPermission(user, PERMISSIONS.COMPANY_BILLING_VIEW))    tabs.push("billing");
  if (hasPermission(user, PERMISSIONS.COMPANY_AUDIT_READ))      tabs.push("audit");
  if (hasPermission(user, PERMISSIONS.REPORTS_VIEW))            tabs.push("reports");
  if (hasPermission(user, PERMISSIONS.API_KEYS_READ))           tabs.push("api");
  if (hasPermission(user, PERMISSIONS.INVENTORY_TRANSFER))      tabs.push("franquicias");
  if (hasPermission(user, PERMISSIONS.ACCOUNTING_READ))         tabs.push("accounting_accounts");
  if (hasPermission(user, PERMISSIONS.ACCOUNTING_POST_JOURNAL)) tabs.push("accounting_entries");
  if (hasPermission(user, PERMISSIONS.ACCOUNTING_REPORTS))      tabs.push("accounting_reports");
  if (hasPermission(user, PERMISSIONS.LMS_SCHOOLS_MANAGE))      tabs.push("education_schools");
  if (hasPermission(user, PERMISSIONS.LMS_STUDENTS_READ))       tabs.push("education_members");
  if (hasPermission(user, PERMISSIONS.COMPANY_WHITELABEL_MANAGE)) tabs.push("whitelabel");

  return tabs;
}

/**
 * Get the default redirect route for a role.
 */
export function getRoleRedirect(role: string): string {
  const systemRoles = [
    "super_platform_admin", "platform_admin", "support_engineer",
    "security_auditor", "billing_admin", "marketplace_admin",
    "developer", "devops", "observability_admin", "partner_manager",
  ];
  if (systemRoles.includes(role)) return "/admin";
  if (role === "student" || role === "customer") return "/mi-cuenta";
  if (role === "cashier") return "/pos";
  return "/dashboard";
}
