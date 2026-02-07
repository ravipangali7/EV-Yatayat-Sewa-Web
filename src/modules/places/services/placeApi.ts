import { api, PaginatedResponse, ListParams } from '@/lib/api';
import { Place } from '@/types';

export const placeApi = {
  // List places with pagination and filters
  list: async (params?: ListParams): Promise<PaginatedResponse<Place>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const queryString = queryParams.toString();
    const url = `places/${queryString ? `?${queryString}` : ''}`;
    return api.get<PaginatedResponse<Place>>(url);
  },

  // Get single place
  get: async (id: string): Promise<Place> => {
    return api.get<Place>(`places/${id}/`);
  },

  // Create place
  create: async (data: Partial<Place>): Promise<Place> => {
    return api.post<Place>('places/create/', data);
  },

  // Edit place (using POST)
  edit: async (id: string, data: Partial<Place>): Promise<Place> => {
    return api.post<Place>(`places/${id}/edit/`, data);
  },

  // Delete place (using GET)
  delete: async (id: string): Promise<void> => {
    return api.get<void>(`places/${id}/delete/`);
  },
};
