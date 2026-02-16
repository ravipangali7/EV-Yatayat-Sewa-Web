import { api, PaginatedResponse, ListParams } from '@/lib/api';
import { Card } from '@/types';

export interface CardWithUserDetails extends Card {
  user_details?: { id: string; name?: string; phone?: string };
}

export const cardApi = {
  list: async (params?: ListParams & { user?: string; search?: string }): Promise<PaginatedResponse<CardWithUserDetails>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.user) queryParams.append('user', params.user);
    if (params?.search) queryParams.append('search', params.search);
    const q = queryParams.toString();
    return api.get<PaginatedResponse<CardWithUserDetails>>(`cards/${q ? `?${q}` : ''}`);
  },

  get: async (id: string): Promise<CardWithUserDetails> => {
    return api.get<CardWithUserDetails>(`cards/${id}/`);
  },

  create: async (data: { user?: string; card_number: string; balance?: string | number; is_active?: boolean }): Promise<CardWithUserDetails> => {
    return api.post<CardWithUserDetails>('cards/create/', data);
  },

  update: async (id: string, data: { user?: string; card_number?: string; balance?: string | number; is_active?: boolean }): Promise<CardWithUserDetails> => {
    return api.post<CardWithUserDetails>(`cards/${id}/edit/`, data);
  },

  delete: async (id: string): Promise<void> => {
    return api.get<void>(`cards/${id}/delete/`);
  },

  searchByNumber: async (cardNumber: string): Promise<Card> => {
    return api.get<Card>(`cards/search/?card_number=${encodeURIComponent(cardNumber)}`);
  },

  topup: async (id: string, amount: number): Promise<Card> => {
    return api.post<Card>(`cards/${id}/topup/`, { amount });
  },
};
