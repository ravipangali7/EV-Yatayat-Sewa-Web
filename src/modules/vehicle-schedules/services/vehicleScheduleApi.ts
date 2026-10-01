import { api, ListParams, PaginatedResponse } from '@/lib/api';

export interface VehicleScheduleRecord {
  id: string;
  vehicle: string;
  route: string;
  date: string;
  time: string;
  price: string;
  price_per_km?: string | null;
  reverse_direction?: boolean;
  places?: SchedulePlace[];
  created_at: string;
  updated_at: string;
}

export interface SchedulePlace {
  id: string;
  name: string;
  code: string;
}

export interface VehicleScheduleExpandedRecord extends VehicleScheduleRecord {
  route_details?: {
    id: string;
    name: string;
    start_point: SchedulePlace;
    end_point: SchedulePlace;
  };
  vehicle_details?: {
    id: string;
    name: string;
    vehicle_no: string;
    featured_image: string | null;
    images: string[];
  };
  available_seats?: number;
  total_seats?: number;
  segment_price?: string;
  segment_km?: string;
  segment_price_per_km?: string;
  is_full_route?: boolean;
  booked_seats?: Array<{ side: string; number: number }>;
}

export interface ScheduleFare {
  unit_price: string;
  distance_km: string;
  price_per_km: string;
  is_full_route: boolean;
  booked_seats: Array<{ side: string; number: number }>;
}

export const vehicleScheduleApi = {
  list: async (params?: ListParams & {
    vehicle?: string;
    route?: string;
    date?: string;
    date_from?: string;
    date_to?: string;
    from_place?: string;
    to_place?: string;
    expand?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.vehicle) queryParams.append('vehicle', params.vehicle);
    if (params?.route) queryParams.append('route', params.route);
    if (params?.date) queryParams.append('date', params.date);
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.from_place) queryParams.append('from_place', params.from_place);
    if (params?.to_place) queryParams.append('to_place', params.to_place);
    if (params?.expand) queryParams.append('expand', '1');
    const q = queryParams.toString();
    return api.get<PaginatedResponse<VehicleScheduleRecord | VehicleScheduleExpandedRecord>>(
      `vehicle-schedules/${q ? `?${q}` : ''}`
    );
  },
  startPlaces: async () =>
    api.get<SchedulePlace[]>('vehicle-schedules/start-places/'),
  endPlaces: async (fromPlaceId: string) =>
    api.get<SchedulePlace[]>(`vehicle-schedules/end-places/?from=${encodeURIComponent(fromPlaceId)}`),
  get: async (id: string) => api.get<VehicleScheduleRecord>(`vehicle-schedules/${id}/`),
  fare: async (id: string, fromPlaceId?: string, toPlaceId?: string) => {
    const query = new URLSearchParams();
    if (fromPlaceId) query.append('from', fromPlaceId);
    if (toPlaceId) query.append('to', toPlaceId);
    const q = query.toString();
    return api.get<ScheduleFare>(`vehicle-schedules/${id}/fare/${q ? `?${q}` : ''}`);
  },
  create: async (data: { vehicle: string; route: string; date: string; time: string; price: number; price_per_km?: number | null; reverse_direction?: boolean }) =>
    api.post<VehicleScheduleRecord>('vehicle-schedules/create/', data),
  edit: async (id: string, data: {
    vehicle?: string;
    route?: string;
    date?: string;
    time?: string;
    price?: number | string;
    price_per_km?: number | string | null;
    reverse_direction?: boolean;
  }) =>
    api.post<VehicleScheduleRecord>(`vehicle-schedules/${id}/edit/`, data),
  delete: async (id: string) => api.get<void>(`vehicle-schedules/${id}/delete/`),
};
