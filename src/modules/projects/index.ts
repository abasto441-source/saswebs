export interface ProjectTask {
  id: string;
  title: string;
  assignedTo?: string;
  status: 'todo' | 'in_progress' | 'done';
}

export function filterCompletedTasks(tasks: ProjectTask[]): ProjectTask[] {
  return tasks.filter(t => t.status === 'done');
}
