import { api, PaginatedResponse, ListParams } from '@/lib/api';
import { Wallet } from '@/types';

export const walletApi = {
  // List wallets with pagination and filters
  list: async (params?: ListParams): Promise<PaginatedResponse<Wallet>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.user) queryParams.append('user', params.user);
    
    const queryString = queryParams.toString();
    const url = `wallets/${queryString ? `?${queryString}` : ''}`;
    return api.get<PaginatedResponse<Wallet>>(url);
  },

  // Get single wallet
  get: async (id: string): Promise<Wallet> => {
    return api.get<Wallet>(`wallets/${id}/`);
  },

  // Create wallet
  create: async (data: Partial<Wallet>): Promise<Wallet> => {
    return api.post<Wallet>('wallets/create/', data);
  },

  // Edit wallet (using POST)
  edit: async (id: string, data: Partial<Wallet>): Promise<Wallet> => {
    return api.post<Wallet>(`wallets/${id}/edit/`, data);
  },

  // Delete wallet (using GET)
  delete: async (id: string): Promise<void> => {
    return api.get<void>(`wallets/${id}/delete/`);
  },

  // Deposit to current user's wallet
  deposit: async (amount: number): Promise<{ balance: string; message: string }> => {
    return api.post<{ balance: string; message: string }>('wallets/my/deposit/', { amount });
  },
};
