import api from './api';
import {
  ApiResponse,
  Student,
  CreateStudentData,
  UpdateStudentData,
  StudentQueryParams,
  Pagination,
} from '../types/api';

interface StudentsResponse {
  students: Student[];
  pagination: Pagination;
}

export const studentsService = {
  async getAll(params?: StudentQueryParams): Promise<StudentsResponse> {
    const response = await api.get<ApiResponse<StudentsResponse>>('/students', {
      params,
    });
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error?.message || 'Failed to fetch students');
  },

  async getById(id: string): Promise<Student> {
    const response = await api.get<ApiResponse<Student>>(`/students/${id}`);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error?.message || 'Failed to fetch student');
  },

  async create(data: CreateStudentData): Promise<Student> {
    const response = await api.post<ApiResponse<Student>>('/students', data);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error?.message || 'Failed to create student');
  },

  async update(id: string, data: UpdateStudentData): Promise<Student> {
    const response = await api.put<ApiResponse<Student>>(`/students/${id}`, data);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error?.message || 'Failed to update student');
  },

  async delete(id: string): Promise<void> {
    const response = await api.delete<ApiResponse<void>>(`/students/${id}`);
    
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to delete student');
    }
  },
};




