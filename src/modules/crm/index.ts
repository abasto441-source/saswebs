import { type CrmLead } from '@/core/config/supabase';

export function calculatePipelineValue(leads: CrmLead[]): number {
  return leads.reduce((sum, lead) => sum + (lead.value || 0), 0);
}

export function groupLeadsByStage(leads: CrmLead[]): Record<string, CrmLead[]> {
  const groups: Record<string, CrmLead[]> = {
    prospect: [],
    contacted: [],
    qualified: [],
    proposal: [],
    won: [],
    lost: []
  };
  leads.forEach(l => {
    if (groups[l.stage]) {
      groups[l.stage].push(l);
    }
  });
  return groups;
}
