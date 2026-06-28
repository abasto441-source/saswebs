import { dbAdapter, type Tenant } from '@/core/config/supabase';

export function getActiveTenantId(): string {
  return dbAdapter.getActiveTenant().id;
}

export function getActiveTenant(): Tenant {
  return dbAdapter.getActiveTenant();
}

export function switchTenant(tenantId: string) {
  dbAdapter.setActiveTenantId(tenantId);
}
