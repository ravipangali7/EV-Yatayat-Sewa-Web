import { api, ListParams, PaginatedResponse } from '@/lib/api';

export interface VehicleScheduleRecord {
  id: string;
  vehicle: string;
  route: string;
  date: string;
  time: string;
  price: string;
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
}

export const vehicleScheduleApi = {
  list: async (params?: ListParams & {
    vehicle?: string;
    route?: string;
    date?: string;
    from_place?: string;
    to_place?: string;
    expand?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.vehicle) queryParams.append('vehicle', params.vehicle);
    if (params?.route) queryParams.append('route', params.route);
    if (params?.date) queryParams.append('date', params.date);
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
  create: async (data: { vehicle: string; route: string; date: string; time: string; price: number }) =>
    api.post<VehicleScheduleRecord>('vehicle-schedules/create/', data),
  edit: async (id: string, data: Partial<VehicleScheduleRecord>) =>
    api.post<VehicleScheduleRecord>(`vehicle-schedules/${id}/edit/`, data),
  delete: async (id: string) => api.get<void>(`vehicle-schedules/${id}/delete/`),
};
