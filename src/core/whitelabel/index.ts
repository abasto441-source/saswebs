import { dbAdapter, type WhiteLabelSettings } from '@/core/config/supabase';

export function getWhiteLabelSettings(tenantId: string): WhiteLabelSettings {
  return dbAdapter.getWhiteLabelSettings(tenantId);
}

export function saveWhiteLabelSettings(tenantId: string, settings: WhiteLabelSettings) {
  dbAdapter.saveWhiteLabelSettings(tenantId, settings);
}

export function injectWhiteLabelColors(settings: WhiteLabelSettings) {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  if (settings.primaryColor) {
    root.style.setProperty('--primary-celeste', settings.primaryColor);
  }
  if (settings.secondaryColor) {
    root.style.setProperty('--celeste-claro', settings.secondaryColor);
  }
}
