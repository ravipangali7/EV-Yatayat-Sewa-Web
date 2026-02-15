import { api, PaginatedResponse, ListParams } from '@/lib/api';
import { SeatBooking } from '@/types';

export const seatBookingApi = {
  // List seat bookings with pagination and filters
  list: async (params?: ListParams & {
    vehicle?: string;
    user?: string;
    is_guest?: boolean;
    is_paid?: boolean;
    vehicle_seat?: string;
  }): Promise<PaginatedResponse<SeatBooking>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.vehicle) queryParams.append('vehicle', params.vehicle);
    if (params?.user) queryParams.append('user', params.user);
    if (params?.is_guest !== undefined) queryParams.append('is_guest', params.is_guest.toString());
    if (params?.is_paid !== undefined) queryParams.append('is_paid', params.is_paid.toString());
    if (params?.vehicle_seat) queryParams.append('vehicle_seat', params.vehicle_seat);
    
    const queryString = queryParams.toString();
    const url = `seat-bookings/${queryString ? `?${queryString}` : ''}`;
    return api.get<PaginatedResponse<SeatBooking>>(url);
  },

  // Get single seat booking
  get: async (id: string): Promise<SeatBooking> => {
    return api.get<SeatBooking>(`seat-bookings/${id}/`);
  },

  // Create seat booking
  create: async (data: Partial<SeatBooking>): Promise<SeatBooking> => {
    return api.post<SeatBooking>('seat-bookings/create/', data);
  },

  // Edit seat booking (using POST)
  edit: async (id: string, data: Partial<SeatBooking>): Promise<SeatBooking> => {
    return api.post<SeatBooking>(`seat-bookings/${id}/edit/`, data);
  },

  // Delete seat booking (using GET)
  delete: async (id: string): Promise<void> => {
    return api.get<void>(`seat-bookings/${id}/delete/`);
  },

  // Book a seat (special endpoint)
  bookSeat: async (data: {
    user?: string;
    is_guest: boolean;
    vehicle: string;
    vehicle_seat: string;
    check_in_lat: number;
    check_in_lng: number;
    check_in_datetime: string;
    check_in_address: string;
  }): Promise<SeatBooking> => {
    return api.post<SeatBooking>('seat-bookings/book/', data);
  },

  // Switch seat
  switchSeat: async (data: {
    vehicle_seat_id: string;
    new_vehicle_seat_id: string;
  }): Promise<SeatBooking> => {
    return api.post<SeatBooking>('seat-bookings/switch/', data);
  },

  // Checkout (optional place_id for at-stop validation)
  checkout: async (data: {
    vehicle_seat_id: string;
    check_out_lat: number;
    check_out_lng: number;
    check_out_address: string;
    is_paid: boolean;
    place_id?: string;
  }): Promise<SeatBooking> => {
    return api.post<SeatBooking>('seat-bookings/checkout/', data);
  },
};
