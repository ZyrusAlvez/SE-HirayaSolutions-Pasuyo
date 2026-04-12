import { supabase } from '@/utils/supabase';

export const getErrandById = (id: string) =>
  supabase.from('errands_with_profiles').select('*').eq('id', id).single();

export const fetchAvailableErrands = () =>
  supabase
    .from('errands_with_profiles')
    .select('id, title, description, is_remote, location_lat, location_lng, location_name, budget, deadline, images, poster_name, poster_avatar, poster_is_verified')
    .eq('status', 'Available');
