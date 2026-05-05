import { supabase } from '@/utils/supabase';

export const getUser = () => supabase.auth.getUser();

export const getCompletedAcceptedErrands = (userId: string) =>
  supabase
    .from('errands_with_profiles')
    .select('id, title, budget, created_at, poster_name, poster_avatar')
    .eq('accepted_by', userId)
    .eq('status', 'Completed')
    .order('created_at', { ascending: false });

export const getPaidAmount = async (userId: string): Promise<number> => {
  const { data } = await supabase
    .from('service_fee_payments')
    .select('amount')
    .eq('user_id', userId)
    .eq('status', 'approved');
  return (data ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
};

export const getProfileVerification = (userId: string) =>
  supabase
    .from('profiles')
    .select('verified')
    .eq('id', userId)
    .single();
