import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';
const WP_AUTH_SOURCE = 'wordpress';
const WP_TOKEN_KEY = 'token';
const AUTH_SOURCE_KEY = 'auth_source';

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

export function setWordPressAuthToken(token: string): void {
  localStorage.setItem(WP_TOKEN_KEY, token);
  localStorage.setItem(AUTH_SOURCE_KEY, WP_AUTH_SOURCE);
}

export function clearWordPressAuthToken(): void {
  if (localStorage.getItem(AUTH_SOURCE_KEY) === WP_AUTH_SOURCE) {
    localStorage.removeItem(WP_TOKEN_KEY);
    localStorage.removeItem(AUTH_SOURCE_KEY);
  }
}

export function getWordPressAuthToken(): string | null {
  const source = localStorage.getItem(AUTH_SOURCE_KEY);
  if (source !== WP_AUTH_SOURCE) return null;
  return localStorage.getItem(WP_TOKEN_KEY);
}

api.interceptors.request.use(async (config) => {
  const wpToken = getWordPressAuthToken();
  if (wpToken) {
    config.headers.Authorization = `Bearer ${wpToken}`;
    config.headers['X-Auth-Source'] = WP_AUTH_SOURCE;
    return config;
  }

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
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';
      // Auth init is handled by the auth provider — only redirect for other 401s
      if (!requestUrl.includes('/auth/me')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
