import { authenticatedRequest } from './api';
import { Task } from '@/types';

export interface TaskFilters {
  search?: string;
  status?: string;
  priority?: string;
  projectId?: number;
}

export async function getTasks(filters: TaskFilters = {}) {
  const params = new URLSearchParams();

  if (filters.search) params.append('search', filters.search);
  if (filters.status) params.append('status', filters.status);
  if (filters.priority) params.append('priority', filters.priority);
  if (filters.projectId) params.append('projectId', String(filters.projectId));

  const query = params.toString();
  const url = query ? `/tasks?${query}` : '/tasks';

  return authenticatedRequest<Task[]>(url);
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
