import api from './api';
import { ApiResponse, LoginResponse, User } from '../types/api';

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', {
      email,
      password,
    });
    
    if (response.data.success && response.data.data) {
      const { token, user } = response.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      return response.data.data;
    }
    
    throw new Error(response.data.error?.message || 'Login failed');
  },

  async loginWithGoogle(idToken: string): Promise<LoginResponse> {
    try {
      const response = await api.post<ApiResponse<LoginResponse>>('/auth/google', {
        id_token: idToken,
      });
      if (response.data.success && response.data.data) {
        const { token, user } = response.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        return response.data.data;
      }
      throw new Error(response.data.error?.message || 'Google sign-in failed');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        throw new Error('Google sign-in is not set up on the server yet. Use email/password or ask the backend to add POST /auth/google.');
      }
      throw err;
    }
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  async getMe(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error?.message || 'Failed to get user');
  },

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  updateStoredUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};




