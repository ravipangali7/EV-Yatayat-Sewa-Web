import { api, PaginatedResponse, ListParams } from '@/lib/api';
import type {
  PaymentFormData,
  PaymentInitiateRequest,
  PaymentTransaction,
  PaymentValidateRequest,
} from '@/types/payment';

export const paymentApi = {
  initiatePayment: async (body: PaymentInitiateRequest): Promise<PaymentFormData> => {
    return api.post<PaymentFormData>('payment/initiate/', body);
  },

  validatePayment: async (body: PaymentValidateRequest): Promise<PaymentTransaction> => {
    return api.post<PaymentTransaction>('payment/validate/', body);
  },

  getPaymentTransactions: async (
    params?: ListParams
  ): Promise<PaginatedResponse<PaymentTransaction>> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    const queryString = queryParams.toString();
    return api.get<PaginatedResponse<PaymentTransaction>>(
      `payment/transactions/${queryString ? `?${queryString}` : ''}`
    );
  },

  getPaymentTransactionById: async (id: string): Promise<PaymentTransaction> => {
    return api.get<PaymentTransaction>(`payment/transactions/${id}/`);
  },
};
