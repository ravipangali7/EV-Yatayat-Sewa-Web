import { api, PaginatedResponse, ListParams } from '@/lib/api';
import { Transaction } from '@/types';

export const transactionApi = {
  // List transactions with pagination and filters
  list: async (params?: ListParams): Promise<PaginatedResponse<Transaction>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.wallet) queryParams.append('wallet', params.wallet);
    if (params?.user) queryParams.append('user', params.user);
    if (params?.card) queryParams.append('card', params.card);
    
    const queryString = queryParams.toString();
    const url = `transactions/${queryString ? `?${queryString}` : ''}`;
    return api.get<PaginatedResponse<Transaction>>(url);
  },

  // Get single transaction
  get: async (id: string): Promise<Transaction> => {
    return api.get<Transaction>(`transactions/${id}/`);
  },

  // Create transaction
  create: async (data: Partial<Transaction>): Promise<Transaction> => {
    return api.post<Transaction>('transactions/create/', data);
  },

  // Edit transaction (using POST)
  edit: async (id: string, data: Partial<Transaction>): Promise<Transaction> => {
    return api.post<Transaction>(`transactions/${id}/edit/`, data);
  },

  // Delete transaction (using GET)
  delete: async (id: string): Promise<void> => {
    return api.get<void>(`transactions/${id}/delete/`);
  },
};
