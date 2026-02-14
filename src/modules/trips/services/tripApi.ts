import { api } from '@/lib/api';

export interface ActiveTrip {
  id: string;
  trip_id: string;
  start_time: string | null;
  end_time: string | null;
}

export interface TripEndResponse {
  trip?: { id: string; trip_id: string; start_time: string | null; end_time: string | null };
  within_destination: boolean;
  message?: string;
  distance_km?: number;
}

export const tripApi = {
  startTrip: async (vehicleId: string) => {
    return api.post<ActiveTrip & { vehicle: string; driver: string; route: string }>('trips/start/', { vehicle_id: vehicleId });
  },

  endTrip: async (
    tripId: string,
    data: { latitude: number; longitude: number; confirm_out_of_range?: boolean }
  ): Promise<TripEndResponse> => {
    return api.post<TripEndResponse>(`trips/${tripId}/end/`, data);
  },

  list: async (params?: { vehicle?: string; driver?: string; active_only?: boolean; page?: number; per_page?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.vehicle) queryParams.append('vehicle', params.vehicle);
    if (params?.driver) queryParams.append('driver', params.driver);
    if (params?.active_only !== undefined) queryParams.append('active_only', params.active_only.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    const q = queryParams.toString();
    return api.get<{ results: unknown[]; count: number; page: number; per_page: number }>(`trips/${q ? `?${q}` : ''}`);
  },

  get: async (id: string) => api.get<ActiveTrip>(`trips/${id}/`),
};
