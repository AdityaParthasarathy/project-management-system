import { getToken, removeToken } from './authStorage';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://projectflow-api-virid.vercel.app/api';

export class ApiError extends Error {
  status?: number;
  isNetworkError?: boolean;

  constructor(message: string, status?: number, isNetworkError = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isNetworkError = isNetworkError;
  }
}

function buildUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${normalizedPath}`;
}

async function parseResponseBody(response: Response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  try {
    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(buildUrl(path), {
      ...options,
      headers,
    });

    const data = await parseResponseBody(response);

    if (response.status === 401 && headers.has('Authorization')) {
      await removeToken();
      throw new ApiError('Your session has expired. Please log in again.', 401);
    }

    if (!response.ok) {
      const message =
        typeof data === 'object' && data && 'message' in data && typeof data.message === 'string'
          ? data.message
          : 'Something went wrong. Please try again.';

      throw new ApiError(message, response.status);
    }

    return (data ?? null) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof TypeError) {
      throw new ApiError(
        'Unable to connect to the server. Please check your internet/Wi-Fi connection and try again.',
        undefined,
        true,
      );
    }

    throw new ApiError('Something went wrong. Please try again.');
  }
}

export async function authenticatedRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers = new Headers(options.headers || {});

  if (!token || token === 'undefined' || token === 'null') {
    throw new ApiError('Your session has expired. Please log in again.', 401);
  }

  headers.set('Authorization', `Bearer ${token}`);

  return apiRequest<T>(path, {
    ...options,
    headers,
  });
}
