import { api, PaginatedResponse, ListParams } from '@/lib/api';
import { User } from '@/types';

export const userApi = {
  // List users with pagination and filters
  list: async (params?: ListParams): Promise<PaginatedResponse<User>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.is_driver !== undefined) queryParams.append('is_driver', params.is_driver.toString());
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    
    const queryString = queryParams.toString();
    const url = `users/${queryString ? `?${queryString}` : ''}`;
    return api.get<PaginatedResponse<User>>(url);
  },

  // Get single user
  get: async (id: string): Promise<User> => {
    return api.get<User>(`users/${id}/`);
  },

  // Create user
  create: async (data: Partial<User>): Promise<User> => {
    return api.post<User>('users/create/', data);
  },

  // Create user with file upload
  createWithFile: async (formData: FormData): Promise<User> => {
    return api.upload<User>('users/create/', formData);
  },

  // Edit user (using POST)
  edit: async (id: string, data: Partial<User>): Promise<User> => {
    return api.post<User>(`users/${id}/edit/`, data);
  },

  // Edit user with file upload (using POST)
  editWithFile: async (id: string, formData: FormData): Promise<User> => {
    return api.upload<User>(`users/${id}/edit/`, formData);
  },

  // Delete user (using GET)
  delete: async (id: string): Promise<void> => {
    return api.get<void>(`users/${id}/delete/`);
  },
};
