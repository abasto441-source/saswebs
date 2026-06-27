-- ================================================================
-- NRAM360 RBAC Enterprise Migration
-- File: 20260627000000_rbac_enterprise.sql
-- Run in: Supabase SQL Editor
-- ================================================================

-- ---------------------------------------------------------------
-- 1. Drop the hardcoded role CHECK from user_profiles
-- ---------------------------------------------------------------
ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_role_check;

-- Keep the role column for backwards compatibility (primary role)
-- but now it can hold any string value
ALTER TABLE user_profiles
  ALTER COLUMN role SET DEFAULT 'guest';

-- ---------------------------------------------------------------
-- 2. PERMISSIONS table — atomic permission catalogue
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS permissions (
  id text PRIMARY KEY,           -- e.g., 'products.create'
  module text NOT NULL,          -- e.g., 'inventory'
  action text NOT NULL,          -- e.g., 'create'
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------
-- 3. ROLES table — per-tenant customizable roles
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  id text PRIMARY KEY DEFAULT 'role-' || gen_random_uuid()::text,
  tenant_id text REFERENCES tenants(id) ON DELETE CASCADE, -- null = system role
  name text NOT NULL,
  slug text NOT NULL,            -- e.g., 'gerente-norte'
  description text,
  is_system_role boolean DEFAULT false,  -- system roles cannot be deleted
  color text DEFAULT 'slate',
  icon text DEFAULT '👤',
  created_at timestamptz DEFAULT now(),
  UNIQUE(tenant_id, slug)
);

-- ---------------------------------------------------------------
-- 4. ROLE_PERMISSIONS — which permissions a role has
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id text NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id text NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- ---------------------------------------------------------------
-- 5. USER_ROLES — which roles a user has (many-to-many)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_roles (
  id text PRIMARY KEY DEFAULT 'ur-' || gen_random_uuid()::text,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id text NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  tenant_id text REFERENCES tenants(id) ON DELETE CASCADE,
  scope text,            -- optional: 'branch:br-001' to limit to a branch
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  UNIQUE(user_id, role_id, tenant_id)
);

-- ---------------------------------------------------------------
-- 6. Enable RLS on new tables
-- ---------------------------------------------------------------
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Permissions: readable by all authenticated users
CREATE POLICY "permissions_read_authenticated" ON permissions
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Roles: system roles visible to all, tenant roles visible to tenant
CREATE POLICY "roles_read" ON roles
  FOR SELECT USING (
    tenant_id IS NULL  -- system roles
    OR tenant_id = get_user_tenant_id()
    OR get_user_role() = 'super_platform_admin'
  );

CREATE POLICY "roles_write_admin" ON roles
  FOR ALL USING (
    get_user_role() IN ('super_platform_admin', 'owner', 'administrator')
    AND (tenant_id IS NULL OR tenant_id = get_user_tenant_id())
  );

-- Role permissions: readable by tenant
CREATE POLICY "role_permissions_read" ON role_permissions
  FOR SELECT USING (
    role_id IN (
      SELECT id FROM roles
      WHERE tenant_id = get_user_tenant_id() OR tenant_id IS NULL
    )
  );

-- User roles: users see their own, admins see all in tenant
CREATE POLICY "user_roles_read" ON user_roles
  FOR SELECT USING (
    user_id = auth.uid()
    OR (
      tenant_id = get_user_tenant_id()
      AND get_user_role() IN ('super_platform_admin', 'owner', 'co_owner', 'administrator', 'general_manager')
    )
  );

CREATE POLICY "user_roles_write_admin" ON user_roles
  FOR ALL USING (
    tenant_id = get_user_tenant_id()
    AND get_user_role() IN ('super_platform_admin', 'owner', 'co_owner', 'administrator')
  );

-- ---------------------------------------------------------------
-- 7. SQL function: get effective permissions for a user
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id uuid)
RETURNS text[] AS $$
DECLARE
  perms text[];
BEGIN
  SELECT ARRAY_AGG(DISTINCT rp.permission_id)
  INTO perms
  FROM user_roles ur
  JOIN role_permissions rp ON rp.role_id = ur.role_id
  WHERE ur.user_id = p_user_id
    AND (ur.expires_at IS NULL OR ur.expires_at > now());

  RETURN COALESCE(perms, ARRAY[]::text[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ---------------------------------------------------------------
-- 8. SQL function: check if user has a specific permission
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION user_has_permission(p_user_id uuid, p_permission text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    WHERE ur.user_id = p_user_id
      AND rp.permission_id = p_permission
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ---------------------------------------------------------------
-- 9. Indexes for performance
-- ---------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_user_roles_user    ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant  ON user_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_role_perms_role    ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_roles_tenant       ON roles(tenant_id);
