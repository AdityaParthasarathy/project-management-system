import { apiRequest, authenticatedRequest } from './api';
import { User } from '@/types';

export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

export async function login(email: string, password: string) {
  const response = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  return response;
}

export async function register(fullName: string, email: string, password: string) {
  const response = await apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ fullName, email, password }),
  });

  return response;
}

export async function logout() {
  return authenticatedRequest<{ message: string }>('/auth/logout', {
    method: 'POST',
  });
}

export async function getMe() {
  return authenticatedRequest<User>('/auth/me');
}
