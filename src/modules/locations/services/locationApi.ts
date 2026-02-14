import { api, ListParams, PaginatedResponse } from '@/lib/api';

export interface LocationRecord {
  id: string;
  vehicle: string;
  trip: string | null;
  latitude: string;
  longitude: string;
  speed: string | null;
  created_at: string;
  updated_at: string;
}

export const locationApi = {
  list: async (params?: ListParams & { vehicle?: string; trip?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.vehicle) queryParams.append('vehicle', params.vehicle);
    if (params?.trip) queryParams.append('trip', params.trip);
    const q = queryParams.toString();
    return api.get<PaginatedResponse<LocationRecord>>(`locations/${q ? `?${q}` : ''}`);
  },
  create: async (data: { vehicle: string; trip?: string; latitude: number; longitude: number; speed?: number }) =>
    api.post<LocationRecord>('locations/create/', data),
};
