import { api } from '@/lib/api';

export interface ActiveTrip {
  id: string;
  trip_id: string;
  start_time: string | null;
  end_time: string | null;
  is_scheduled?: boolean;
  reverse_direction?: boolean;
}

export interface CurrentStopResponse {
  at_stop: {
    place_id: string;
    name: string;
    announcement_text?: string;
    has_destination_booking?: boolean;
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
  schedule: { id: string; date: string; time: string; route_name: string; start_point_name: string; end_point_name: string; reverse_direction?: boolean };
  tickets: Array<{ id: string; pnr: string; name: string; phone: string; seat: unknown; price: string }>;
}

/** Seat booking as returned in trip detail (for driver current-trip cards). */
export interface TripSeatBookingDetail {
  id: string;
  is_guest: boolean;
  user_details?: { name?: string; phone?: string };
  vehicle_seat_details?: { side: string; number: number };
  check_in_address: string;
  check_out_datetime?: string | null;
  destination_place_details?: { name?: string } | null;
  trip_amount?: number | string | null;
  is_paid: boolean;
}

export interface TripDetailResponse extends ActiveTrip {
  seat_bookings?: TripSeatBookingDetail[];
}

export const tripApi = {
  startTrip: async (
    vehicleId: string,
    options?: { latitude?: number; longitude?: number; vehicle_schedule_id?: string; reverse_direction?: boolean }
  ): Promise<ActiveTrip & { vehicle?: string; driver?: string; route?: string } | TripStartConfirmScheduled> => {
    const body: Record<string, unknown> = { vehicle_id: vehicleId };
    if (options?.latitude != null) body.latitude = options.latitude;
    if (options?.longitude != null) body.longitude = options.longitude;
    if (options?.vehicle_schedule_id) body.vehicle_schedule_id = options.vehicle_schedule_id;
    if (options?.reverse_direction !== undefined) body.reverse_direction = options.reverse_direction;
    return api.post('trips/start/', body);
  },

  endTrip: async (
    tripId: string,
    data: { latitude: number; longitude: number; confirm_out_of_range?: boolean }
  ): Promise<TripEndResponse> => {
    return api.post<TripEndResponse>(`trips/${tripId}/end/`, data);
  },

  list: async (params?: {
    vehicle?: string;
    driver?: string;
    route?: string;
    vehicle_schedule?: string;
    active_only?: boolean;
    search?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    per_page?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.vehicle) queryParams.append('vehicle', params.vehicle);
    if (params?.driver) queryParams.append('driver', params.driver);
    if (params?.route) queryParams.append('route', params.route);
    if (params?.vehicle_schedule) queryParams.append('vehicle_schedule', params.vehicle_schedule);
    if (params?.active_only !== undefined) queryParams.append('active_only', params.active_only.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    const q = queryParams.toString();
    return api.get<{ results: unknown[]; count: number; page: number; per_page: number; stats?: { total_count?: number } }>(`trips/${q ? `?${q}` : ''}`);
  },

  get: async (id: string) => api.get<ActiveTrip>(`trips/${id}/`),

  getDetail: async (id: string) => api.get<TripDetailResponse>(`trips/${id}/`),

  getCurrentStop: async (tripId: string, lat: number, lng: number) =>
    api.get<CurrentStopResponse>(`trips/current-stop/?trip=${tripId}&latitude=${lat}&longitude=${lng}`),
};
