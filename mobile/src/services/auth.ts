import { apiRequest, authenticatedRequest } from './api';
import { getRefreshToken } from './authStorage';
import { withCache } from './cache';
import { User } from '@/types';

export interface AuthResponse {
  token: string;
  refreshToken: string;
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
  // Tell the server to revoke the refresh token (real logout), then the caller clears local storage.
  const refreshToken = await getRefreshToken();
  return apiRequest<{ message: string }>('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: refreshToken ?? undefined }),
  });
}

export async function getMe() {
  // Cached so the app can still start (and stay signed in) while offline.
  return withCache('me', () => authenticatedRequest<User>('/auth/me'));
}
