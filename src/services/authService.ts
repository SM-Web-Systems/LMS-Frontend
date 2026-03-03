import api from './api';
import { ApiResponse, User } from '../types/api';

export const authService = {
  async getMe(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error?.message || 'Failed to get user');
  },
};
