export interface User {
  id: string;
  username: string;
  phone: string;
  email: string;
  name: string;
  profile_picture?: string;
  fcm_token?: string;
  token?: string;
  is_driver: boolean;
  is_superuser?: boolean;
  is_staff?: boolean;
  is_active?: boolean;
  license_no?: string;
  license_image?: string;
  license_type?: string;
  license_expiry_date?: string;
  is_ticket_dealer?: boolean;
  ticket_commission?: number;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  user: string;
  user_details?: User;
  balance: number;
  to_pay: number;
  to_receive: number;
  created_at: string;
  updated_at: string;
}

export type TransactionStatus = 'pending' | 'success' | 'failed';
export type TransactionType = 'add' | 'deducted';

export interface Transaction {
  id: string;
  status: TransactionStatus;
  balance_before: number;
  balance_after: number;
  amount: number;
  wallet: string;
  wallet_details?: Wallet;
  user: string;
  user_details?: User;
  card?: string | null;
  card_details?: { id: string; card_number: string; balance: string; is_active: boolean } | null;
  type: TransactionType;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

export interface SuperSetting {
  id: string;
  per_km_charge: number;
  gps_threshold: number;
  seat_layout?: string[];
  created_at: string;
  updated_at: string;
}

export interface Card {
  id: string;
  user: string | null;
  card_number: string;
  balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Place {
  id: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  address: string;
  created_at: string;
  updated_at: string;
}

export interface RouteStopPoint {
  id: string;
  route: string;
  place: string;
  place_details?: Place;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface Route {
  id: string;
  name: string;
  is_bidirectional: boolean;
  start_point: string;
  start_point_details?: Place;
  end_point: string;
  end_point_details?: Place;
  stop_points?: RouteStopPoint[];
  created_at: string;
  updated_at: string;
}

export type VehicleSeatSide = 'A' | 'B' | 'C';
export type VehicleSeatStatus = 'available' | 'booked';

export interface VehicleSeat {
  id: string;
  vehicle: string;
  side: VehicleSeatSide;
  number: number;
  status: VehicleSeatStatus;
  created_at: string;
  updated_at: string;
}

export interface VehicleImage {
  id: string;
  vehicle: string;
  title: string;
  description: string;
  image: string;
  created_at: string;
  updated_at: string;
}

export interface ActiveTrip {
  id: string;
  trip_id: string;
  start_time: string | null;
  end_time: string | null;
}

export interface Vehicle {
  id: string;
  imei: string;
  name: string;
  vehicle_no: string;
  vehicle_type: string;
  odometer: number;
  overspeed_limit: number;
  description?: string;
  featured_image?: string;
  drivers: string[];
  driver_details?: User[];
  active_driver?: string;
  active_driver_details?: User;
  routes: string[];
  route_details?: Route[];
  active_route?: string;
  active_route_details?: Route;
  active_trip?: ActiveTrip | null;
  is_active: boolean;
  bill_book?: string;
  bill_book_expiry_date?: string;
  insurance_expiry_date?: string;
  road_permit_expiry_date?: string;
  seat_layout?: string[];
  seats?: VehicleSeat[];
  images?: VehicleImage[];
  created_at: string;
  updated_at: string;
}

export interface SeatBooking {
  id: string;
  user?: string;
  user_details?: User;
  is_guest: boolean;
  vehicle: string;
  vehicle_details?: {
    id: string;
    name: string;
    vehicle_no: string;
    vehicle_type: string;
  };
  vehicle_seat: string;
  vehicle_seat_details?: VehicleSeat;
  trip?: string | null;
  trip_details?: ActiveTrip | null;
  check_in_lat: number;
  check_in_lng: number;
  check_in_datetime: string;
  check_in_address: string;
  check_out_lat?: number;
  check_out_lng?: number;
  check_out_datetime?: string;
  check_out_address?: string;
  trip_distance?: number;
  trip_duration?: number;
  trip_amount?: number;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaginationState {
  page: number;
  perPage: number;
  total: number;
}

export interface FilterState {
  search: string;
  [key: string]: string | number | boolean | undefined;
}
