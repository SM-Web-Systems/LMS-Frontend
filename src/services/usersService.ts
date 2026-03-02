/**
 * Users API: directory (admin) and setting user course codes.
 */

import api from './api';
import { ApiResponse } from '../types/api';

export interface UserDirectoryItem {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  courseCodes: string[];
}

interface UsersResponse {
  users: UserDirectoryItem[];
}

export const usersService = {
  /** GET /users (admin only). Returns all users with courseCodes. */
  async getUsers(): Promise<UserDirectoryItem[]> {
    const response = await api.get<ApiResponse<UsersResponse>>('/users');
    if (response.data.success && response.data.data?.users) {
      return response.data.data.users;
    }
    throw new Error((response.data as { error?: { message?: string } })?.error?.message || 'Failed to fetch users');
  },

  /** PATCH /users/:id (admin only). Set courseCodes for a user. */
  async patchUserCourseCodes(userId: string, courseCodes: string[]): Promise<{ id: string; courseCodes: string[] }> {
    const response = await api.patch<ApiResponse<{ id: string; courseCodes: string[] }>>(`/users/${userId}`, {
      courseCodes,
    });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error((response.data as { error?: { message?: string } })?.error?.message || 'Failed to update user');
  },
};
