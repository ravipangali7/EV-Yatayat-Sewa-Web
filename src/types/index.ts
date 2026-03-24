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
  initial_km?: number | null;
  initial_km_charge?: number | null;
  // Canonical key is gps_threshold_second; gps_threshold kept for compatibility.
  gps_threshold?: number;
  gps_threshold_second?: number;
  point_cover_radius?: number | string | null;
  seat_layout?: string[];
  stop_point_announcement_header?: string;
  short_trip_min_distance_for_booking?: number;
  short_trip_max_distance_for_booking?: number;
  luna_web_origin?: string | null;
  luna_api_token?: string | null;
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
  announcement_text?: string;
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
  reverse_direction?: boolean;
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
  /** Present when vehicle detail or my-active-vehicle includes last location (e.g. for driver destination filtering). */
  last_latitude?: string | null;
  last_longitude?: string | null;
  last_location_at?: string | null;
}

export interface VehicleNearby extends Vehicle {
  last_latitude: string;
  last_longitude: string;
  last_location_at: string | null;
  distance_km: number;
  can_book: boolean;
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
  destination_place?: string | null;
  destination_place_details?: Place | null;
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

// --- Analytics (vehicle & user) ---
export type AnalyticsDatePreset = 'all' | 'last_day' | 'last_week' | 'last_month' | 'custom';

export interface VehicleAnalyticsParams {
  date_from?: string;
  date_to?: string;
  preset?: AnalyticsDatePreset;
}

export interface VehicleAnalyticsResponse {
  date_from: string;
  date_to: string;
  preset: string;
  summary: {
    total_seat_revenue: string;
    total_ticket_revenue: string;
    total_revenue: string;
    trip_count: number;
    seat_booking_count: number;
    ticket_booking_count: number;
  };
  by_seat: Array<{
    seat_id: string;
    seat_label: string;
    side: string;
    number: number;
    booking_count: number;
    total_revenue: string;
  }>;
  most_booked_by_side: Array<{ side: string; booking_count: number; revenue: string }>;
  top_seats_by_count: Array<{ seat_id: string; seat_label: string; side: string; number: number; booking_count: number; total_revenue: string }>;
  top_seats_by_revenue: Array<{ seat_id: string; seat_label: string; side: string; number: number; booking_count: number; total_revenue: string }>;
  daily_revenue: Array<{ date: string; amount: string }>;
  daily_trips: Array<{ date: string; count: number }>;
  daily_seat_bookings: Array<{ date: string; count: number }>;
  by_driver: Array<{ driver_id: string; driver_name: string; trip_count: number; seat_revenue: string }>;
}

export interface UserAnalyticsParams {
  date_from?: string;
  date_to?: string;
  preset?: AnalyticsDatePreset;
}

export interface UserAnalyticsResponse {
  date_from: string;
  date_to: string;
  preset: string;
  user_id: string;
  is_driver: boolean;
  summary: {
    trip_count_as_driver: number;
    total_seat_revenue_as_driver: string;
    total_ticket_revenue_as_driver: string;
    seat_booking_count_as_passenger: number;
    total_spend_as_passenger: string;
  };
  as_driver: {
    by_vehicle: Array<{ vehicle_id: string; vehicle_name: string; trip_count: number; seat_revenue: string }>;
    most_booked_by_side: Array<{ side: string; booking_count: number; revenue: string }>;
    top_seats: Array<{ seat_label: string; booking_count: number; total_revenue: string }>;
    daily_trips: Array<{ date: string; count: number }>;
    daily_revenue: Array<{ date: string; amount: string }>;
  };
  as_passenger: {
    by_vehicle: Array<{ vehicle_id: string; vehicle_name: string; booking_count: number; total_spend: string }>;
  };
}

// --- Monitoring (control room snapshot) ---
export interface MonitoringSummary {
  total_vehicles: number;
  on_trip_count: number;
  total_seats_booked: number;
  total_revenue_today: string;
}

export interface MonitoringVehicle {
  id: string;
  imei?: string | null;
  name: string;
  vehicle_no: string;
  start_point: string;
  end_point: string;
  active_driver_name: string | null;
  active_driver_phone: string | null;
  seats_booked: number;
  seats_total: number;
  today_revenue: string;
  today_trips: number;
  lat: number | null;
  lng: number | null;
  speed_kmh: number;
  last_location_at: string | null;
  status: 'on_trip' | 'idle';
}

export interface HeavyDue {
  id: string;
  name: string;
  phone: string;
  avatar_initial: string;
  to_pay: string;
  trips_this_month: number;
}

export interface MonitoringSnapshot {
  fetched_at: string;
  summary: MonitoringSummary;
  vehicles: MonitoringVehicle[];
  heavy_dues: HeavyDue[];
}
