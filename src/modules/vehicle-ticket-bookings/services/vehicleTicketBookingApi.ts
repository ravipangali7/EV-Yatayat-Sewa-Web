import apiClient from '@/lib/api';
import { api, ListParams, PaginatedResponse } from '@/lib/api';

export type SeatEntry = { side: string; number: number };

export interface ScheduleDetails {
  date: string | null;
  time: string | null;
  price: string | null;
  vehicle_name: string | null;
  route_name: string | null;
  start_point_name: string | null;
  end_point_name: string | null;
}

export interface VehicleTicketBookingRecord {
  id: string;
  user: string | null;
  is_guest: boolean;
  name: string;
  phone: string;
  vehicle_schedule: string;
  ticket_id: string;
  seat: SeatEntry[] | Record<string, unknown>;
  price: string;
  is_paid: boolean;
  pnr: string;
  created_at: string;
  updated_at: string;
  schedule_details?: ScheduleDetails;
}

export const vehicleTicketBookingApi = {
  list: async (params?: ListParams & { vehicle_schedule?: string; user?: string; booked_by?: string; expand?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.vehicle_schedule) queryParams.append('vehicle_schedule', params.vehicle_schedule);
    if (params?.user) queryParams.append('user', params.user);
    if (params?.booked_by) queryParams.append('booked_by', params.booked_by);
    if (params?.expand) queryParams.append('expand', '1');
    const q = queryParams.toString();
    return api.get<PaginatedResponse<VehicleTicketBookingRecord>>(`vehicle-ticket-bookings/${q ? `?${q}` : ''}`);
  },
  pay: async (id: string) =>
    api.post<VehicleTicketBookingRecord>(`vehicle-ticket-bookings/${id}/pay/`, {}),
  get: async (id: string, params?: { expand?: boolean }) => {
    const q = params?.expand ? '?expand=1' : '';
    return api.get<VehicleTicketBookingRecord>(`vehicle-ticket-bookings/${id}/${q}`);
  },
  create: async (data: {
    user?: string;
    is_guest: boolean;
    name: string;
    phone: string;
    vehicle_schedule: string;
    ticket_id?: string;
    seats?: SeatEntry[];
    seat?: Record<string, unknown>;
    price?: number;
    is_paid?: boolean;
  }) => api.post<VehicleTicketBookingRecord>('vehicle-ticket-bookings/create/', data),
  edit: async (id: string, data: Partial<VehicleTicketBookingRecord>) =>
    api.post<VehicleTicketBookingRecord>(`vehicle-ticket-bookings/${id}/edit/`, data),
  delete: async (id: string) => api.get<void>(`vehicle-ticket-bookings/${id}/delete/`),
  getTicketPdfBlob: async (id: string): Promise<Blob> => {
    const res = await apiClient.get(`vehicle-ticket-bookings/${id}/ticket-pdf/`, { responseType: 'blob' });
    return res.data as Blob;
  },
};
