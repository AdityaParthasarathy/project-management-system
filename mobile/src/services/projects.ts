import { authenticatedRequest, authenticatedRequestRaw } from './api';
import { withCache } from './cache';
import { Project } from '@/types';

export interface ProjectFilters {
  search?: string;
  status?: string;
}

export interface ProjectPageOptions extends ProjectFilters {
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export async function getProjects(filters: ProjectFilters = {}) {
  const params = new URLSearchParams();

  if (filters.search) params.append('search', filters.search);
  if (filters.status) params.append('status', filters.status);

  const query = params.toString();
  const url = query ? `/projects?${query}` : '/projects';

  return withCache(`projects:${query}`, () => authenticatedRequest<Project[]>(url));
}

/** One page of projects (sorted) plus the total number of matches. Works offline from the saved copy. */
export async function getProjectsPage(options: ProjectPageOptions = {}) {
  const params = new URLSearchParams();

  if (options.search) params.append('search', options.search);
  if (options.status) params.append('status', options.status);
  params.append('page', '1');
  params.append('limit', String(options.limit ?? 8));
  if (options.sortBy) params.append('sortBy', options.sortBy);
  if (options.order) params.append('order', options.order);

  const query = params.toString();

  return withCache(`projects-page:${query}`, async () => {
    const { data, headers } = await authenticatedRequestRaw<Project[]>(`/projects?${query}`);
    return { items: data, total: Number(headers.get('x-total-count') ?? data.length) };
  });
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
