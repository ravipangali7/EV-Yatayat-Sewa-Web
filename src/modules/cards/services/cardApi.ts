import { api, PaginatedResponse, ListParams } from '@/lib/api';
import { Card } from '@/types';

export const cardApi = {
  list: async (params?: ListParams & { user?: string }): Promise<PaginatedResponse<Card>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.user) queryParams.append('user', params.user);
    const q = queryParams.toString();
    return api.get<PaginatedResponse<Card>>(`cards/${q ? `?${q}` : ''}`);
  },

  get: async (id: string): Promise<Card> => {
    return api.get<Card>(`cards/${id}/`);
  },

  searchByNumber: async (cardNumber: string): Promise<Card> => {
    return api.get<Card>(`cards/search/?card_number=${encodeURIComponent(cardNumber)}`);
  },

  topup: async (id: string, amount: number): Promise<Card> => {
    return api.post<Card>(`cards/${id}/topup/`, { amount });
  },
};
