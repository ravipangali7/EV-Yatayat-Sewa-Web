import { api, PaginatedResponse, ListParams } from '@/lib/api';
import { Route, RouteStopPoint } from '@/types';

export const routeApi = {
  // List routes with pagination and filters
  list: async (params?: ListParams): Promise<PaginatedResponse<Route>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.start_point) queryParams.append('start_point', params.start_point);
    if (params?.end_point) queryParams.append('end_point', params.end_point);
    if (params?.is_bidirectional !== undefined) queryParams.append('is_bidirectional', params.is_bidirectional.toString());
    
    const queryString = queryParams.toString();
    const url = `routes/${queryString ? `?${queryString}` : ''}`;
    return api.get<PaginatedResponse<Route>>(url);
  },

  // Get single route
  get: async (id: string): Promise<Route> => {
    return api.get<Route>(`routes/${id}/`);
  },

  // Create route
  create: async (data: Partial<Route> & { stop_points?: Array<{ place: string; order: number }> }): Promise<Route> => {
    return api.post<Route>('routes/create/', data);
  },

  // Edit route (using POST)
  edit: async (id: string, data: Partial<Route> & { stop_points?: Array<{ place: string; order: number }> }): Promise<Route> => {
    return api.post<Route>(`routes/${id}/edit/`, data);
  },

  // Delete route (using GET)
  delete: async (id: string): Promise<void> => {
    return api.get<void>(`routes/${id}/delete/`);
  },

  // Stop Points
  getStopPoints: async (routeId: string): Promise<RouteStopPoint[]> => {
    return api.get<RouteStopPoint[]>(`routes/${routeId}/stop-points/`);
  },

  createStopPoint: async (routeId: string, data: { place: string; order: number }): Promise<RouteStopPoint> => {
    return api.post<RouteStopPoint>(`routes/${routeId}/stop-points/create/`, data);
  },

  editStopPoint: async (routeId: string, stopPointId: string, data: Partial<RouteStopPoint>): Promise<RouteStopPoint> => {
    return api.post<RouteStopPoint>(`routes/${routeId}/stop-points/${stopPointId}/edit/`, data);
  },

  deleteStopPoint: async (routeId: string, stopPointId: string): Promise<void> => {
    return api.get<void>(`routes/${routeId}/stop-points/${stopPointId}/delete/`);
  },
};
