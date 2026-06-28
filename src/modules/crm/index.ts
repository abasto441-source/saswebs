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

export function calculateWeightedForecast(leads: CrmLead[]): number {
  const weights: Record<string, number> = {
    prospect: 0.10,
    contacted: 0.30,
    qualified: 0.50,
    proposal: 0.75,
    won: 1.00,
    lost: 0.00
  };

  return leads.reduce((sum, lead) => {
    const w = weights[lead.stage] || 0;
    return sum + (lead.value || 0) * w;
  }, 0);
}

export function calculateConversionRate(leads: CrmLead[]): number {
  if (leads.length === 0) return 0;
  const won = leads.filter(l => l.stage === 'won').length;
  return (won / leads.length) * 100;
}

export function calculateCampaignMetrics(sent: number, opened: number, clicked: number): { openRate: number; ctr: number } {
  if (sent <= 0) return { openRate: 0, ctr: 0 };
  return {
    openRate: (opened / sent) * 100,
    ctr: (clicked / sent) * 100
  };
}
