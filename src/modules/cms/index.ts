import { type CMSCollection, type CMSItem } from '@/core/config/supabase';

export function formatCmsItemData(collection: CMSCollection, item: CMSItem): Record<string, string> {
  const formatted: Record<string, string> = {};
  collection.fields.forEach(f => {
    const fname = typeof f === 'string' ? f : f.name;
    formatted[fname] = item.data[fname] || '';
  });
  return formatted;
}
