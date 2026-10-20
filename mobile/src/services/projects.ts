import { authenticatedRequest } from './api';
import { Project } from '@/types';

export interface ProjectFilters {
  search?: string;
  status?: string;
}

export async function getProjects(filters: ProjectFilters = {}) {
  const params = new URLSearchParams();

  if (filters.search) params.append('search', filters.search);
  if (filters.status) params.append('status', filters.status);

  const query = params.toString();
  const url = query ? `/projects?${query}` : '/projects';

  return authenticatedRequest<Project[]>(url);
}

export async function getProject(id: number) {
  return authenticatedRequest<Project>(`/projects/${id}`);
}

export async function createProject(payload: {
  name: string;
  description?: string;
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  startDate?: string;
  endDate?: string;
}) {
  return authenticatedRequest<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProject(
  id: number,
  payload: {
    name?: string;
    description?: string;
    status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    startDate?: string;
    endDate?: string;
  },
) {
  return authenticatedRequest<Project>(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteProject(id: number) {
  return authenticatedRequest<{ message: string }>(`/projects/${id}`, {
    method: 'DELETE',
  });
}
