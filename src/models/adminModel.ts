import { supabase, supabaseAdmin } from '../utils/supabase';

export type AccountStatus = 'verified' | 'unverified' | 'pending' | 'suspended';

export interface FullUserProfile {
  id: string;
  display_name: string | null;
  email: string | null;
  status: AccountStatus;
  role: string | null;
  created_at: string;
  rating: number | null;
  avatar_url: string | null;
  verification_submitted_at: string | null;
  id_type: string | null;
}

export interface UserDetail {
  id: string;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  suffix: string | null;
  gender: string | null;
  date_of_birth: string | null;
  address_province: string | null;
  address_city: string | null;
  address_barangay: string | null;
  address_street: string | null;
  address_house_no: string | null;
  address_building: string | null;
  address_unit: string | null;
  address_floor: string | null;
  address_block_lot: string | null;
  address_phase_subdivision: string | null;
  address_type: string | null;
  utility_bill_type: string | null;
  utility_bill_front_url: string | null;
  utility_bill_back_url: string | null;
  id_type: string | null;
  id_front_url: string | null;
  id_back_url: string | null;
  verification_submitted_at: string | null;
  avatar_url: string | null;
  last_seen: string | null;
  status: AccountStatus;
  role: string | null;
  rating: number | null;
  created_at: string;
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
  address_street: string | null;
  address_house_no: string | null;
  address_building: string | null;
  address_unit: string | null;
  address_floor: string | null;
  address_block_lot: string | null;
  address_phase_subdivision: string | null;
  address_type: string | null;
  id_type: string | null;
  id_front_url: string | null;
  id_back_url: string | null;
  utility_bill_type: string | null;
  utility_bill_front_url: string | null;
  utility_bill_back_url: string | null;
  verification_submitted_at: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Errand {
  id: string;
  user_id: string;
  title: string;
  poster_name: string | null;
  budget: number | null;
  status: string;
  is_remote: boolean;
  created_at: string;
  deadline: string | null;
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
    .select('id, display_name, email, status, role, created_at, rating, avatar_url, verification_submitted_at, id_type')
    .eq('role', 'user');

export const getUserDetail = (id: string) =>
  getAdmin()
    .from('profiles')
    .select('id, first_name, middle_name, last_name, suffix, gender, date_of_birth, address_province, address_city, address_barangay, address_street, address_house_no, address_building, address_unit, address_floor, address_block_lot, address_phase_subdivision, address_type, utility_bill_type, utility_bill_front_url, utility_bill_back_url, id_type, id_front_url, id_back_url, verification_submitted_at, avatar_url, last_seen, status, role, rating, created_at')
    .eq('id', id)
    .single();

export const getUserEmail = async (id: string) => {
  const { data } = await getAdmin().auth.admin.getUserById(id);
  const meta = data?.user?.user_metadata;
  return { data: { email: data?.user?.email ?? null, displayName: meta?.name || meta?.full_name || null } };
};

export const getVerificationProfile = (id: string) =>
  getAdmin()
    .from('profiles')
    .select('id, first_name, middle_name, last_name, suffix, gender, date_of_birth, address_province, address_city, address_barangay, address_street, address_house_no, address_building, address_unit, address_floor, address_block_lot, address_phase_subdivision, address_type, id_type, id_front_url, id_back_url, utility_bill_type, utility_bill_front_url, utility_bill_back_url, verification_submitted_at, avatar_url, created_at')
    .eq('id', id)
    .single();

export const updateUserStatus = (id: string, status: AccountStatus) =>
  getAdmin().from('profiles').update({ status }).eq('id', id);

export const updateVerificationStatus = (id: string, approve: boolean) =>
  getAdmin().from('profiles').update({ status: approve ? 'verified' : 'unverified' }).eq('id', id);

export const getAdminErrands = () =>
  getAdmin()
    .from('errands_with_profiles')
    .select('id, user_id, title, poster_name, budget, status, is_remote, created_at, deadline');

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

export const getUserErrands = (userId: string) =>
  getAdmin()
    .from('errands')
    .select('id, title, status, created_at, budget')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

export const getUserAcceptedErrands = (userId: string) =>
  getAdmin()
    .from('errands')
    .select('id, title, status, created_at, budget')
    .eq('accepted_by', userId)
    .order('created_at', { ascending: false });

export const getUserErrandEvents = (userId: string, limit?: number, offset?: number) => {
  let q = getAdmin()
    .from('activity_log')
    .select('id, errand_id, event_type, metadata, created_at', { count: 'exact' })
    .eq('actor_id', userId)
    .order('created_at', { ascending: false });
  if (limit != null && offset != null) q = q.range(offset, offset + limit - 1);
  return q;
};

export const getUserMessages = (userId: string, limit?: number, offset?: number) => {
  let q = getAdmin()
    .from('messages')
    .select('id, created_at', { count: 'exact' })
    .eq('sender_id', userId)
    .order('created_at', { ascending: false });
  if (limit != null && offset != null) q = q.range(offset, offset + limit - 1);
  return q;
};

export const getUserReports = (userId: string, limit?: number, offset?: number) => {
  let q = getAdmin()
    .from('reports')
    .select('id, reason, created_at', { count: 'exact' })
    .eq('reporter_id', userId)
    .order('created_at', { ascending: false });
  if (limit != null && offset != null) q = q.range(offset, offset + limit - 1);
  return q;
};

export const getAllActivity = () =>
  getAdmin()
    .from('activity_log')
    .select('created_at')
    .order('created_at', { ascending: true });

export const getAllMessages = () =>
  getAdmin()
    .from('messages')
    .select('created_at')
    .order('created_at', { ascending: true });

export const getAllReports = () =>
  getAdmin()
    .from('reports')
    .select('created_at')
    .order('created_at', { ascending: true });

export const getErrandsForAnalytics = () =>
  getAdmin().from('errands').select('created_at, status');

export const getAdminErrandEvents = (errandId: string) =>
  getAdmin()
    .from('activity_log')
    .select('id, errand_id, actor_id, event_type, metadata, created_at')
    .eq('errand_id', errandId)
    .order('created_at', { ascending: true });

export const getCompletedAcceptedErrands = (userId: string) =>
  getAdmin()
    .from('errands_with_profiles')
    .select('id, budget')
    .eq('accepted_by', userId)
    .eq('status', 'Completed');

export const getApprovedPaymentsTotal = async (userId: string): Promise<number> => {
  const { data } = await getAdmin()
    .from('service_fee_payments')
    .select('amount')
    .eq('user_id', userId)
    .eq('status', 'approved');
  return (data ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
};

export const getAdminReports = () =>
  getAdmin()
    .from('reports')
    .select('id, reporter_id, reported_id, type, reason, details, status, created_at, errand_id, file_urls')
    .order('created_at', { ascending: false });

export const getPendingPayments = () =>
  getAdmin()
    .from('service_fee_payments')
    .select('id, user_id, amount, reference_no, screenshot_url, status, created_at')
    .order('created_at', { ascending: false });

export const getPaymentDetail = (id: string) =>
  getAdmin()
    .from('service_fee_payments')
    .select('*')
    .eq('id', id)
    .single();

export const updatePaymentStatus = (id: string, status: 'approved' | 'rejected', adminId: string, adminNote?: string) =>
  getAdmin()
    .from('service_fee_payments')
    .update({ status, reviewed_by: adminId, reviewed_at: new Date().toISOString(), admin_note: adminNote ?? null })
    .eq('id', id);

export const getAdminErrandDetail = (id: string) =>
  getAdmin()
    .from('errands_with_profiles')
    .select('*')
    .eq('id', id)
    .single();

export const deleteAdminErrand = (id: string) =>
  getAdmin()
    .from('errands')
    .delete()
    .eq('id', id);

export const getProfileNames = (ids: string[]) =>
  getAdmin()
    .from('profiles')
    .select('id, first_name, last_name')
    .in('id', ids);

export const postAdminLog = async (action: string, targetUserId: string, details: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  return getAdmin().from('admin_logs').insert({
    admin_id: user?.id,
    action,
    target_user_id: targetUserId,
    details,
  });
};
