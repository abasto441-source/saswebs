import { type AutomationWorkflow } from '@/core/config/supabase';

export function getActiveWorkflows(workflows: AutomationWorkflow[]): AutomationWorkflow[] {
  return workflows.filter(w => w.active);
}

export function matchesTrigger(workflow: AutomationWorkflow, triggerName: string): boolean {
  return workflow.trigger === triggerName;
}
