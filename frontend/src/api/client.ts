import { ApiError } from '../types/auth';

const BASE_URL = '/api';

export class ApiException extends Error {
  status: number;
  error: string;
  path: string;

  constructor(apiError: ApiError) {
    super(apiError.message || 'An unexpected API error occurred');
    this.name = 'ApiException';
    this.status = apiError.status;
    this.error = apiError.error;
    this.path = apiError.path;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Includes HttpOnly auth cookie
  };

  const response = await fetch(url, config);

  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  if (!response.ok) {
    if (isJson) {
      const errorBody: ApiError = await response.json();
      throw new ApiException(errorBody);
    } else {
      const text = await response.text();
      throw new ApiException({
        timestamp: new Date().toISOString(),
        status: response.status,
        error: response.statusText,
        message: text || 'Request failed',
        path: endpoint,
      });
    }
  }

  return isJson ? await response.json() : ({} as T);
}
