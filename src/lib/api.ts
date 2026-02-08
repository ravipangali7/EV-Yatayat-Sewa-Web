import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'sonner';

// Base API URL - adjust this to match your Django server
// const API_BASE_URL = 'http://127.0.0.1:8000/api';
const API_BASE_URL = 'https://system.evyatayat.com/api';
const MEDIA_BASE_URL = 'https://system.evyatayat.com/media/';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    // If data is FormData, remove Content-Type to let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle errors
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;
      
      switch (status) {
        case 400:
          toast.error(data?.error || 'Bad request. Please check your input.');
          break;
        case 401:
          // Don't show error toast for login page (it will show its own error)
          if (!window.location.pathname.includes('/login')) {
            toast.error('Unauthorized. Please login again.');
          }
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          // Redirect to login if not already there
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          break;
        case 403:
          toast.error('Forbidden. You do not have permission.');
          break;
        case 404:
          toast.error('Resource not found.');
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        default:
          toast.error(data?.error || 'An error occurred.');
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error('An unexpected error occurred.');
    }
    
    return Promise.reject(error);
  }
);

// Generic API methods
export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  page: number;
  per_page: number;
}

export interface ListParams {
  page?: number;
  per_page?: number;
  search?: string;
  [key: string]: any;
}

export const api = {
  // GET request
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.get<T>(url, config);
    return response.data;
  },

  // POST request
  post: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.post<T>(url, data, config);
    return response.data;
  },

  // POST request for file uploads
  upload: async <T>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> => {
    // Pass FormData directly - interceptor will handle Content-Type removal
    const response = await apiClient.post<T>(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        // Explicitly don't set Content-Type - let browser set it with boundary
      },
    });
    return response.data;
  },
};

export default apiClient;
