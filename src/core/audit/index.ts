import { dbAdapter, type AuditLog } from '@/core/config/supabase';

export function getAuditLogs(tenantId: string): AuditLog[] {
  return dbAdapter.getAuditLogs().filter(l => l.tenantId === tenantId);
}

export function writeAuditLog(tenantId: string, userId: string, action: string, details: string) {
  dbAdapter.addAuditLog(tenantId, userId, action, details);
}
