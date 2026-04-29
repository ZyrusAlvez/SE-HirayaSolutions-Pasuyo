import { supabase } from '@/utils/supabase';

export type ServiceFeeErrand = {
  id: string;
  title: string;
  budget: number;
  serviceFee: number;
  service_fee_paid: boolean;
  created_at: string;
  poster_name?: string;
  poster_avatar?: string;
};

export const getUser = () => supabase.auth.getUser();

export const getUnpaidAcceptedErrands = (userId: string) =>
  supabase
    .from('errands_with_profiles')
    .select('id, title, budget, service_fee_paid, created_at, poster_name, poster_avatar, accepted_by')
    .eq('accepted_by', userId)
    .eq('status', 'Completed')
    .eq('service_fee_paid', false)
    .order('created_at', { ascending: false });
