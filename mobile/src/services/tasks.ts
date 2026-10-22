import { authenticatedRequest, authenticatedRequestRaw } from './api';
import { withCache } from './cache';
import { Task } from '@/types';

export interface TaskFilters {
  search?: string;
  status?: string;
  priority?: string;
  projectId?: number;
}

export interface TaskPageOptions extends TaskFilters {
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export async function getTasks(filters: TaskFilters = {}) {
  const params = new URLSearchParams();

  if (filters.search) params.append('search', filters.search);
  if (filters.status) params.append('status', filters.status);
  if (filters.priority) params.append('priority', filters.priority);
  if (filters.projectId) params.append('projectId', String(filters.projectId));

  const query = params.toString();
  const url = query ? `/tasks?${query}` : '/tasks';

  return withCache(`tasks:${query}`, () => authenticatedRequest<Task[]>(url));
}

/** One page of tasks (sorted) plus the total number of matches. Works offline from the saved copy. */
export async function getTasksPage(options: TaskPageOptions = {}) {
  const params = new URLSearchParams();

  if (options.search) params.append('search', options.search);
  if (options.status) params.append('status', options.status);
  if (options.priority) params.append('priority', options.priority);
  if (options.projectId) params.append('projectId', String(options.projectId));
  params.append('page', '1');
  params.append('limit', String(options.limit ?? 8));
  if (options.sortBy) params.append('sortBy', options.sortBy);
  if (options.order) params.append('order', options.order);

  const query = params.toString();

  return withCache(`tasks-page:${query}`, async () => {
    const { data, headers } = await authenticatedRequestRaw<Task[]>(`/tasks?${query}`);
    return { items: data, total: Number(headers.get('x-total-count') ?? data.length) };
  });
}

export async function getTask(id: number) {
  return authenticatedRequest<Task>(`/tasks/${id}`);
}

export async function createTask(payload: {
  name: string;
  description?: string;
  projectId: number;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate?: string;
}) {
  return authenticatedRequest<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateTask(
  id: number,
  payload: {
    name?: string;
    description?: string;
    projectId?: number;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    dueDate?: string;
  },
) {
  return authenticatedRequest<Task>(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteTask(id: number) {
  return authenticatedRequest<{ message: string }>(`/tasks/${id}`, {
    method: 'DELETE',
  });
}
