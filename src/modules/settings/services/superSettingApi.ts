import { api, PaginatedResponse, ListParams } from '@/lib/api';
import { SuperSetting } from '@/types';

export const superSettingApi = {
  // List all super settings
  list: async (params?: ListParams): Promise<PaginatedResponse<SuperSetting>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    
    const queryString = queryParams.toString();
    const url = `super-settings/${queryString ? `?${queryString}` : ''}`;
    return api.get<PaginatedResponse<SuperSetting>>(url);
  },

  // Get single super setting
  get: async (id: string): Promise<SuperSetting> => {
    return api.get<SuperSetting>(`super-settings/${id}/`);
  },

  // Create super setting
  create: async (data: Partial<SuperSetting>): Promise<SuperSetting> => {
    return api.post<SuperSetting>('super-settings/create/', data);
  },

  // Edit super setting (using POST)
  edit: async (id: string, data: Partial<SuperSetting>): Promise<SuperSetting> => {
    return api.post<SuperSetting>(`super-settings/${id}/edit/`, data);
  },

  // Delete super setting (using GET)
  delete: async (id: string): Promise<void> => {
    return api.get<void>(`super-settings/${id}/delete/`);
  },
};
