import { api } from '@/lib/api';

export interface ActiveTrip {
  id: string;
  trip_id: string;
  start_time: string | null;
  end_time: string | null;
  is_scheduled?: boolean;
}

export interface CurrentStopResponse {
  at_stop: {
    place_id: string;
    name: string;
    pickups: Array<{ pnr: string; name: string; phone?: string; seat: string }>;
    dropoffs: Array<{ booking_id: string; vehicle_seat_id: string; seat_label: string; name: string; pnr: string }>;
  } | null;
}

export interface TripEndResponse {
  trip?: { id: string; trip_id: string; start_time: string | null; end_time: string | null };
  within_destination: boolean;
  message?: string;
  distance_km?: number;
}

export interface TripStartConfirmScheduled {
  need_confirm_scheduled: true;
  schedule: { id: string; date: string; time: string; route_name: string; start_point_name: string; end_point_name: string };
  tickets: Array<{ id: string; pnr: string; name: string; phone: string; seat: unknown; price: string }>;
}

export const tripApi = {
  startTrip: async (
    vehicleId: string,
    options?: { latitude?: number; longitude?: number; vehicle_schedule_id?: string }
  ): Promise<ActiveTrip & { vehicle?: string; driver?: string; route?: string } | TripStartConfirmScheduled> => {
    const body: Record<string, unknown> = { vehicle_id: vehicleId };
    if (options?.latitude != null) body.latitude = options.latitude;
    if (options?.longitude != null) body.longitude = options.longitude;
    if (options?.vehicle_schedule_id) body.vehicle_schedule_id = options.vehicle_schedule_id;
    return api.post('trips/start/', body);
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

  getCurrentStop: async (tripId: string, lat: number, lng: number) =>
    api.get<CurrentStopResponse>(`trips/current-stop/?trip=${tripId}&latitude=${lat}&longitude=${lng}`),
};
