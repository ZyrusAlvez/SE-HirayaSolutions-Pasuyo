import { supabase } from '@/utils/supabase';

export const getErrandById = (id: string) =>
  supabase.from('errands_with_profiles').select('*').eq('id', id).single();

export const getCurrentUser = () => supabase.auth.getUser();

export const getUserVerification = (userId: string) =>
  supabase.from('profiles').select('verified').eq('id', userId).single();
