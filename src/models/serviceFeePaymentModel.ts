import { supabase } from '@/utils/supabase';
import { Platform } from 'react-native';

export type ServiceFeePayment = {
  id: string;
  user_id: string;
  amount: number;
  reference_no: string;
  screenshot_url: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

export const getUser = () => supabase.auth.getUser();

export const uploadReceipt = async (userId: string, uri: string): Promise<string> => {
  const fileName = `${userId}/${Date.now()}.jpg`;

  let body: any;
  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    body = await res.blob();
  } else {
    body = { uri, type: 'image/jpeg', name: fileName };
  }

  const { error } = await supabase.storage
    .from('service-fee-receipts')
    .upload(fileName, body, { contentType: 'image/jpeg', upsert: false });
  if (error) throw new Error('Failed to upload receipt');

  const { data } = supabase.storage.from('service-fee-receipts').getPublicUrl(fileName);
  return data.publicUrl;
};

export const insertPayment = (
  userId: string,
  amount: number,
  referenceNo: string,
  screenshotUrl: string,
) =>
  supabase.from('service_fee_payments').insert({
    user_id: userId,
    amount,
    reference_no: referenceNo,
    screenshot_url: screenshotUrl,
  }).select('id').single();

export const getUserPayments = (userId: string) =>
  supabase
    .from('service_fee_payments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

export const getApprovedPaymentsTotal = async (userId: string): Promise<number> => {
  const { data } = await supabase
    .from('service_fee_payments')
    .select('amount')
    .eq('user_id', userId)
    .eq('status', 'approved');
  return (data ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
};
