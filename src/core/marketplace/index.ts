import { dbAdapter, type MarketplaceApp, type TenantActiveApp } from '@/core/config/supabase';

export function getAvailableApps(): MarketplaceApp[] {
  return dbAdapter.getMarketplaceApps();
}

export function getTenantInstalledApps(tenantId: string): TenantActiveApp[] {
  return dbAdapter.getTenantActiveApps(tenantId);
}

export function installMarketplaceApp(tenantId: string, appId: string) {
  const installed = getTenantInstalledApps(tenantId);
  if (!installed.some(a => a.appId === appId)) {
    const updated = [...installed, { tenantId, appId }];
    dbAdapter.saveTenantActiveApps(tenantId, updated);
    dbAdapter.addAuditLog(tenantId, 'system', 'Instalar App Marketplace', `Aplicación ${appId} agregada al inquilino`);
  }
}
