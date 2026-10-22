// SOURCE OF TRUTH shared by backend, web and mobile.
// Edit here, then run `node scripts/sync-shared.mjs` to copy into each app.

export const PROJECT_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as const;
export const TASK_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED'] as const;
export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
export const ROLES = ['USER', 'ADMIN'] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export type Role = (typeof ROLES)[number];

export const PROJECT_SORT_FIELDS = ['createdAt', 'name', 'status', 'startDate', 'endDate'] as const;
export const TASK_SORT_FIELDS = ['createdAt', 'name', 'priority', 'status', 'dueDate'] as const;
export type SortOrder = 'asc' | 'desc';

export interface User {
  id: number;
  fullName: string;
  email: string;
  role?: Role;
  createdAt?: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  userId: number;
}

export interface Task {
  id: number;
  name: string;
  description?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string | null;
  createdAt: string;
  projectId: number;
  userId: number;
}

export interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  projectsInProgress: number;
}

export interface AuditLogEntry {
  id: number;
  action: string;
  entity: string;
  entityId?: number | null;
  details?: string | null;
  createdAt: string;
  userId?: number | null;
}

export interface AuthResponse {
  message: string;
  token: string; // short-lived access token (JWT)
  refreshToken: string; // long-lived, rotated on every use
  user: User;
}
