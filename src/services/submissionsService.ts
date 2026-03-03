import api, { getAuthToken } from './api';
import {
  ApiResponse,
  Submission,
  CreateSubmissionData,
  ReviewSubmissionData,
  SubmissionQueryParams,
  Pagination,
} from '../types/api';

interface SubmissionsResponse {
  submissions: Submission[];
  pagination: Pagination;
}

export const submissionsService = {
  async getAll(params?: SubmissionQueryParams): Promise<SubmissionsResponse> {
    const response = await api.get<ApiResponse<SubmissionsResponse>>('/submissions', {
      params,
    });
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error?.message || 'Failed to fetch submissions');
  },

  async getById(id: string): Promise<Submission> {
    const response = await api.get<ApiResponse<Submission>>(`/submissions/${id}`);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error?.message || 'Failed to fetch submission');
  },

  async create(data: CreateSubmissionData): Promise<Submission> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('file', data.file);

    const response = await api.post<ApiResponse<Submission>>('/submissions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error?.message || 'Failed to create submission');
  },

  async update(id: string, data: { title?: string; description?: string }): Promise<Submission> {
    const response = await api.put<ApiResponse<Submission>>(`/submissions/${id}`, data);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error?.message || 'Failed to update submission');
  },

  async delete(id: string): Promise<void> {
    const response = await api.delete<ApiResponse<void>>(`/submissions/${id}`);
    
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to delete submission');
    }
  },

  async review(id: string, data: ReviewSubmissionData): Promise<Submission> {
    const response = await api.post<ApiResponse<Submission>>(
      `/submissions/${id}/review`,
      data
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error?.message || 'Failed to review submission');
  },

  getDownloadUrl(id: string): string {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';
    return `${baseUrl}/submissions/${id}/download`;
  },

  async download(id: string): Promise<void> {
    const token = await getAuthToken();
    const response = await fetch(this.getDownloadUrl(id), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download file');
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition
      ?.split('filename=')[1]
      ?.replace(/"/g, '') || 'download';

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};




