import { supabaseAdmin } from '../utils/supabase';

export const insertNotification = (userId: string, title: string, message: string) => {
  if (!supabaseAdmin) throw new Error('Admin client not available');
  return supabaseAdmin.from('notifications').insert({ user_id: userId, title, message });
};
