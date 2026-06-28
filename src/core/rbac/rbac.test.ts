import { describe, it, expect } from 'vitest';
import { computePermissions, hasPermission, getRoleRedirect, PERMISSIONS } from './index';

describe('NRAM360 Enterprise RBAC Engine', () => {
  it('should identify redirect paths for roles correctly', () => {
    expect(getRoleRedirect('super_platform_admin')).toBe('/admin');
    expect(getRoleRedirect('owner')).toBe('/dashboard');
    expect(getRoleRedirect('editor')).toBe('/dashboard');
    expect(getRoleRedirect('student')).toBe('/mi-cuenta');
    expect(getRoleRedirect('unknown')).toBe('/dashboard');
  });

  it('should compute and verify permissions for super admin', () => {
    const user = {
      id: 'u-1',
      email: 'admin@nram360.com',
      role: 'super_platform_admin',
      isSystemUser: true
    };
    
    // Super admins should have access to system operations
    expect(hasPermission(user, PERMISSIONS.SYSTEM_TENANTS_CREATE as any)).toBe(true);
    expect(hasPermission(user, PERMISSIONS.SYSTEM_DEVOPS_DEPLOY as any)).toBe(true);
  });

  it('should check permissions fallback for tenant admin', () => {
    const user = {
      id: 'u-2',
      email: 'manager@celeste.com',
      role: 'owner',
      tenantId: 't-celeste'
    };

    // Tenant admin should have access to company settings but not system configs
    expect(hasPermission(user, PERMISSIONS.COMPANY_SETTINGS_READ as any)).toBe(true);
    expect(hasPermission(user, PERMISSIONS.SYSTEM_TENANTS_CREATE as any)).toBe(false);
  });

  it('should respect custom permissions on the session if supplied', () => {
    const user = {
      id: 'u-3',
      email: 'user@celeste.com',
      role: 'editor',
      permissions: ['products.read', 'products.create'] as any[]
    };

    expect(hasPermission(user, 'products.read' as any)).toBe(true);
    expect(hasPermission(user, 'products.create' as any)).toBe(true);
    expect(hasPermission(user, 'products.delete' as any)).toBe(false);
  });
});
