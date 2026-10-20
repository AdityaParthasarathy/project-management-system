import { authenticatedRequest } from './api';
import { DashboardStats } from '@/types';

export async function getDashboard() {
  return authenticatedRequest<DashboardStats>('/dashboard');
}
