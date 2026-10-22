import { getRefreshToken, getToken, removeToken, saveRefreshToken, saveToken } from './authStorage';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://projectflow-api-virid.vercel.app/api';

const REQUEST_TIMEOUT_MS = 20000;

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

export interface RawResult<T> {
  data: T;
  headers: Headers;
}

/** Low-level request: returns the body and the response headers (needed for X-Total-Count). */
export async function apiRequestRaw<T>(path: string, options: RequestInit = {}): Promise<RawResult<T>> {
  try {
    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    // Never hang forever on a dead connection: give up after 20s with a friendly message.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(buildUrl(path), {
        ...options,
        headers,
        signal: controller.signal,
      });
    } catch {
      // fetch() itself failed (offline, server down, DNS, timeout): this is a network problem,
      // whatever exact error type the JS runtime reports.
      throw new ApiError(
        'Unable to connect to the server. Please check your internet/Wi-Fi connection and try again.',
        undefined,
        true,
      );
    } finally {
      clearTimeout(timer);
    }

    const data = await parseResponseBody(response);

    if (response.status === 401 && headers.has('Authorization')) {
      throw new ApiError('Your session has expired. Please log in again.', 401);
    }

    if (!response.ok) {
      const rawMessage = typeof data === 'object' && data && 'message' in data ? (data as any).message : null;
      const message = Array.isArray(rawMessage)
        ? rawMessage.join(', ')
        : typeof rawMessage === 'string'
          ? rawMessage
          : 'Something went wrong. Please try again.';

      throw new ApiError(message, response.status);
    }

    return { data: (data ?? null) as T, headers: response.headers };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof TypeError || (error as Error)?.name === 'AbortError') {
      throw new ApiError(
        'Unable to connect to the server. Please check your internet/Wi-Fi connection and try again.',
        undefined,
        true,
      );
    }

    const detail = error instanceof Error && error.message ? ` (${error.message})` : '';
    throw new ApiError(`Something went wrong. Please try again.${detail}`);
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  return (await apiRequestRaw<T>(path, options)).data;
}

// ---- silent session renewal (refresh tokens) ----

let refreshInFlight: Promise<boolean> | null = null;

/** Trades the stored refresh token for a new access + refresh token. Returns false if that is not possible. */
async function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) return false;

        const { data } = await apiRequestRaw<{ token: string; refreshToken: string }>('/auth/refresh', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
        await saveToken(data.token);
        await saveRefreshToken(data.refreshToken);
        return true;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }

  return refreshInFlight;
}

export async function authenticatedRequestRaw<T>(path: string, options: RequestInit = {}): Promise<RawResult<T>> {
  const send = async (): Promise<RawResult<T>> => {
    const token = await getToken();
    const headers = new Headers(options.headers || {});

    if (!token || token === 'undefined' || token === 'null') {
      throw new ApiError('Your session has expired. Please log in again.', 401);
    }

    headers.set('Authorization', `Bearer ${token}`);
    return apiRequestRaw<T>(path, { ...options, headers });
  };

  try {
    return await send();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      // Access token expired: renew it silently once; only if that fails is the user logged out.
      if (await refreshSession()) {
        return send();
      }
      await removeToken();
    }
    throw error;
  }
}

export async function authenticatedRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  return (await authenticatedRequestRaw<T>(path, options)).data;
}
