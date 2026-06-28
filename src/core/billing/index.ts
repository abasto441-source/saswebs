import { dbAdapter, type SaaSPlanLimit } from '@/core/config/supabase';

export function getTenantSaaSLimits(tenantId: string): SaaSPlanLimit {
  return dbAdapter.getTenantSaaSLimits(tenantId);
}

export function saveSaaSPlanLimits(limits: SaaSPlanLimit[]) {
  dbAdapter.saveSaaSPlanLimits(limits);
}

export function upgradeTenantPlan(tenantId: string) {
  const tenants = dbAdapter.getTenants().map(t => {
    if (t.id === tenantId) {
      return { ...t, plan: 'Enterprise' as const };
    }
    return t;
  });
  dbAdapter.saveTenants(tenants);

  const allLimits = dbAdapter.getSaaSPlanLimits();
  const limitIdx = allLimits.findIndex(l => l.tenantId === tenantId);
  if (limitIdx >= 0) {
    allLimits[limitIdx] = {
      ...allLimits[limitIdx],
      maxPages: 100,
      maxPosTerminals: 999
    };
    dbAdapter.saveSaaSPlanLimits(allLimits);
  }
}
