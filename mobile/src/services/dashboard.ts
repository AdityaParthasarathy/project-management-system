import { authenticatedRequest } from './api';
import { withCache } from './cache';
import { DashboardStats } from '@/types';

export async function getDashboard() {
  return withCache('dashboard', () => authenticatedRequest<DashboardStats>('/dashboard'));
}
