import { api } from '@/lib/api';

export interface DashboardStatsResponse {
  date_from: string;
  date_to: string;
  totals: {
    users: number;
    drivers: number;
    active_vehicles: number;
    total_vehicles: number;
    places: number;
    routes: number;
    total_balance: string;
    total_to_pay: string;
    total_to_receive: string;
  };
  period: {
    trip_count: number;
    seat_booking_count: number;
    transaction_count: number;
    transaction_sum: string;
    seat_revenue: string;
    ticket_revenue: string;
    total_revenue: string;
  };
  daily_trips: { date: string; count: number }[];
  daily_revenue: { date: string; amount: string }[];
}

export const dashboardApi = {
  getStats: async (params?: { date_from?: string; date_to?: string }): Promise<DashboardStatsResponse> => {
    const search = new URLSearchParams();
    if (params?.date_from) search.append('date_from', params.date_from);
    if (params?.date_to) search.append('date_to', params.date_to);
    const q = search.toString();
    return api.get<DashboardStatsResponse>(`dashboard/stats/${q ? `?${q}` : ''}`);
  },
};
