import { type HelpdeskTicket } from '@/core/config/supabase';

export function getSlaPriorityClass(priority: 'low' | 'medium' | 'high'): string {
  switch (priority) {
    case 'high': return 'text-red-600 bg-red-50 border-red-200';
    case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
    default: return 'text-slate-500 bg-slate-50 border-slate-200';
  }
}

export function filterOpenTickets(tickets: HelpdeskTicket[]): HelpdeskTicket[] {
  return tickets.filter(t => t.status !== 'resolved');
}
