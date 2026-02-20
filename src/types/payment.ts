/** NCHL ConnectIPS payment types */

export type PaymentPurpose = 'wallet_deposit' | 'card_topup' | 'vehicle_ticket_booking' | 'pay_due';

export interface PaymentFormData {
  MERCHANTID: string;
  APPID: string;
  APPNAME: string;
  TXNID: string;
  TXNDATE: string;
  TXNCRNCY: string;
  TXNAMT: string;
  REFERENCEID: string;
  REMARKS: string;
  PARTICULARS: string;
  TOKEN: string;
  gateway_url: string;
  success_url: string;
  failure_url: string;
}

export interface PaymentInitiateRequest {
  amount: number;
  remarks?: string;
  particulars?: string;
  purpose?: PaymentPurpose;
  card_id?: string;
  vehicle_ticket_booking_id?: string;
  return_to?: string;
}

export interface PaymentTransaction {
  id: string;
  user: string;
  amount: string;
  amount_paisa: number;
  status: 'pending' | 'success' | 'failed';
  reference_id: string;
  txn_id: string;
  connectips_txn_id: string | null;
  connectips_batch_id: string | null;
  error_message: string | null;
  purpose: PaymentPurpose;
  card: string | null;
  vehicle_ticket_booking: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface PaymentValidateRequest {
  txn_id: string;
}

export interface PaymentCallbackParams {
  txn_id?: string;
  TXNID?: string;
  status?: string;
  return_to?: string;
}
