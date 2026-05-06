import { supabase, supabaseAdmin } from '../utils/supabase';

export interface FullUserProfile {
  id: string;
  display_name: string | null;
  email: string | null;
  verified: boolean;
  role: string | null;
  created_at: string;
  rating: number | null;
  pending_verification: boolean;
  avatar_url: string | null;
  verification_submitted_at: string | null;
  id_type: string | null;
  is_active: boolean;
}

export interface UserDetail {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  verified: boolean;
  role: string | null;
  rating: number | null;
  created_at: string;
  is_active: boolean;
}

export interface VerificationProfile {
  id: string;
  display_name: string | null;
  email: string | null;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  suffix: string | null;
  gender: string | null;
  date_of_birth: string | null;
  address_province: string | null;
  address_city: string | null;
  address_barangay: string | null;
  id_type: string | null;
  id_front_url: string | null;
  id_back_url: string | null;
  utility_bill_type: string | null;
  utility_bill_front_url: string | null;
  utility_bill_back_url: string | null;
  verification_submitted_at: string | null;
}

export interface Errand {
  id: string;
  title: string;
  poster_name: string | null;
  budget: number | null;
  status: string;
  is_remote: boolean;
  created_at: string;
}

export interface LogEntry {
  id: string;
  action: string;
  details: string | null;
  created_at: string;
  admin_id: string | null;
  target_user_id: string | null;
}

export interface AnalyticsData {
  lineData: { labels: string[]; data: number[] };
  pieData: { name: string; count: number }[];
}

const getAdmin = () => {
  if (!supabaseAdmin) throw new Error('Admin client not available');
  return supabaseAdmin;
};

export const getAdminUsers = () =>
  getAdmin()
    .from('admin_user_profiles')
    .select('id, display_name, email, verified, role, created_at, rating, pending_verification, avatar_url, verification_submitted_at, id_type');

export const getUserIsActive = (id: string) =>
  getAdmin().from('profiles').select('is_active').eq('id', id).maybeSingle();

export const getUserDetail = (id: string) =>
  getAdmin()
    .from('admin_user_profiles')
    .select('id, display_name, email, avatar_url, verified, role, rating, created_at')
    .eq('id', id)
    .single();

export const getVerificationProfile = (id: string) =>
  getAdmin()
    .from('profiles')
    .select('id, first_name, middle_name, last_name, suffix, gender, date_of_birth, address_province, address_city, address_barangay, id_type, id_front_url, id_back_url, utility_bill_type, utility_bill_front_url, utility_bill_back_url, verification_submitted_at')
    .eq('id', id)
    .single();

export const updateUserActiveStatus = (id: string, is_active: boolean) =>
  getAdmin().from('profiles').update({ is_active }).eq('id', id);

export const updateVerificationStatus = (id: string, verified: boolean) =>
  getAdmin().from('profiles').update({ verified, pending_verification: false }).eq('id', id);

export const getAdminErrands = () =>
  getAdmin()
    .from('errands_with_profiles')
    .select('id, title, poster_name, budget, status, is_remote, created_at');

export const getAdminLogs = () =>
  getAdmin()
    .from('admin_logs')
    .select('id, action, details, created_at, admin_id, target_user_id')
    .order('created_at', { ascending: false });

export const getAdminLogsSubscription = (callback: () => void) =>
  getAdmin()
    .channel('admin-logs')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_logs' }, callback)
    .subscribe();

export const removeLogsSubscription = (channel: ReturnType<typeof getAdminLogsSubscription>) =>
  getAdmin().removeChannel(channel);

export const getErrandsForAnalytics = () =>
  getAdmin().from('errands').select('created_at, status');

export const postAdminLog = async (action: string, targetUserId: string, details: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  return getAdmin().from('admin_logs').insert({
    admin_id: user?.id,
    action,
    target_user_id: targetUserId,
    details,
  });
};
