import { dbAdapter, type TelemetryMetric } from '@/core/config/supabase';

export function getTenantTelemetry(tenantId: string): TelemetryMetric {
  return dbAdapter.getTelemetryMetric(tenantId);
}

export function logCpuUsageMetric(tenantId: string, durationMs: number) {
  const current = getTenantTelemetry(tenantId);
  const updated = {
    ...current,
    latencyMs: durationMs,
    timestamp: Date.now()
  };
  dbAdapter.saveTelemetryMetric(tenantId, updated);
}
