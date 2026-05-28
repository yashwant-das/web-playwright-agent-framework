export interface Task {
  id: string;                    // e.g. "T-003"
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
  assignedTo?: 'human' | 'ai';
  dependsOn?: string[];          // e.g. ["T-001", "T-002"]
  blockedReason?: string;
}
