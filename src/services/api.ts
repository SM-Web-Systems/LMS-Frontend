import axios, { AxiosInstance, isAxiosError } from 'axios';
import { fromAxiosError } from '../utils/apiError';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let tokenGetter: (() => Promise<string | null>) | null = null;

export function setTokenGetter(getter: () => Promise<string | null>) {
  tokenGetter = getter;
}

export async function getAuthToken(): Promise<string | null> {
  if (tokenGetter) {
    try {
      return await tokenGetter();
    } catch {
      return null;
    }
  }
  return null;
}

api.interceptors.request.use(async (config) => {
  if (tokenGetter) {
    try {
      const token = await tokenGetter();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Token retrieval failed; proceed without auth header
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!isAxiosError(error)) {
      return Promise.reject(error);
    }
    const reqUrl = error.config?.url ?? '';
    // Never hard-redirect on these: /auth/me uses Clerk token; backend may return 401 until
    // Clerk is verified server-side — redirecting would reload /login while Clerk session
    // persists and causes an infinite loop.
    if (error.response?.status === 401) {
      const skipRedirect =
        reqUrl.includes('/auth/login') ||
        reqUrl.includes('/auth/google') ||
        reqUrl.includes('/auth/me');
      if (!skipRedirect) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(fromAxiosError(error));
  }
);

export default api;
