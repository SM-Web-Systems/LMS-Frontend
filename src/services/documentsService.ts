import api from './api';
import {
  ApiResponse,
  CourseDocument,
  CreateDocumentData,
  UpdateDocumentData,
  DocumentQueryParams,
  Pagination,
} from '../types/api';

interface DocumentsResponse {
  documents: CourseDocument[];
  pagination: Pagination;
}

export const documentsService = {
  async getAll(params?: DocumentQueryParams): Promise<DocumentsResponse> {
    const response = await api.get<ApiResponse<DocumentsResponse>>('/documents', {
      params,
    });

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error?.message || 'Failed to fetch documents');
  },

  async getById(id: string): Promise<CourseDocument> {
    const response = await api.get<ApiResponse<CourseDocument>>(`/documents/${id}`);

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error?.message || 'Failed to fetch document');
  },

  async create(data: CreateDocumentData): Promise<CourseDocument> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('category', data.category);
    formData.append('file', data.file);

    const response = await api.post<ApiResponse<CourseDocument>>('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error?.message || 'Failed to upload document');
  },

  async update(id: string, data: UpdateDocumentData): Promise<CourseDocument> {
    const response = await api.put<ApiResponse<CourseDocument>>(`/documents/${id}`, data);

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error?.message || 'Failed to update document');
  },

  async delete(id: string): Promise<void> {
    const response = await api.delete<ApiResponse<void>>(`/documents/${id}`);

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to delete document');
    }
  },

  getDownloadUrl(id: string): string {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';
    return `${baseUrl}/documents/${id}/download`;
  },

  async download(id: string): Promise<void> {
    const token = localStorage.getItem('token');
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

  async getCategories(): Promise<string[]> {
    const response = await api.get<ApiResponse<{ categories: string[] }>>('/documents/categories');

    if (response.data.success && response.data.data) {
      return response.data.data.categories;
    }

    return [];
  },
};

