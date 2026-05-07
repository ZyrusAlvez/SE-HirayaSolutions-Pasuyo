import * as adminModel from '../models/adminModel';
import type { FullUserProfile, UserDetail, VerificationProfile, Errand, LogEntry, AnalyticsData, AccountStatus } from '../models/adminModel';
import { supabase } from '../utils/supabase';
import { postNotification } from './notificationController';
import { sendAccountRestoredEmail, sendAccountSuspendedEmail, sendErrandDeletedEmail, sendVerificationEmail, sendPaymentStatusEmail } from '../models/emailModel';

export type { FullUserProfile, UserDetail, VerificationProfile, Errand, LogEntry, AnalyticsData, AccountStatus };

export type ActivityItem = {
  id: string;
  type: string;
  metadata?: Record<string, any>;
  created_at: string;
};

export type ActivityPage = {
  items: ActivityItem[];
  hasMore: boolean;
};

type Result<T = undefined> = { success: boolean; error: string; data?: T };

export const getUsers = async (): Promise<Result<FullUserProfile[]>> => {
  try {
    const { data, error } = await adminModel.getAdminUsers();
    if (error || !data) return { success: false, error: error?.message ?? 'Failed to fetch users' };
    return { success: true, error: '', data: data as FullUserProfile[] };
  } catch {
    return { success: false, error: 'Failed to fetch users' };
  }
};

export const getUserDetail = async (id: string): Promise<Result<UserDetail & { email: string | null; displayName: string | null }>> => {
  try {
    const { data, error } = await adminModel.getUserDetail(id);
    if (error || !data) return { success: false, error: error?.message ?? 'User not found' };

    // Get email and display name from auth.users
    const { data: authData } = await adminModel.getUserEmail(id);
    return { success: true, error: '', data: { ...data, email: authData?.email ?? null, displayName: authData?.displayName ?? null } as UserDetail & { email: string | null; displayName: string | null } };
  } catch {
    return { success: false, error: 'Failed to fetch user' };
  }
};

export const getVerificationProfile = async (id: string): Promise<Result<VerificationProfile>> => {
  try {
    const { data, error } = await adminModel.getVerificationProfile(id);
    if (error || !data) return { success: false, error: error?.message ?? 'Profile not found' };
    return { success: true, error: '', data: data as VerificationProfile };
  } catch {
    return { success: false, error: 'Failed to fetch verification profile' };
  }
};

export const updateUserActiveStatus = async (id: string, suspend: boolean, reason?: string): Promise<Result> => {
  try {
    if (suspend) {
      const { error } = await adminModel.updateUserStatus(id, 'suspended');
      if (error) return { success: false, error: error.message };
    } else {
      // Restore: check if user has verification docs to determine status
      const { data: profile } = await adminModel.getVerificationProfile(id);
      const hasVerificationDocs = !!(profile?.id_front_url && profile?.id_back_url);
      const { error } = await adminModel.updateUserStatus(id, hasVerificationDocs ? 'verified' : 'unverified');
      if (error) return { success: false, error: error.message };
    }

    await postNotification(
      id,
      suspend ? 'Account Suspended' : 'Account Restored',
      suspend
        ? `Your account has been suspended. Reason: ${reason || 'Violation of platform rules'}. Please contact support for more information.`
        : 'Your account has been restored. You can now access Pasuyo again.',
    );
    if (suspend) await sendAccountSuspendedEmail(id, reason || 'Violation of platform rules');
    if (!suspend) await sendAccountRestoredEmail(id);
    await adminModel.postAdminLog(
      suspend ? 'SUSPENDED_USER' : 'RESTORED_USER',
      id,
      `Admin ${suspend ? 'suspended' : 'restored'} user ${id}`,
    );
    return { success: true, error: '' };
  } catch {
    return { success: false, error: 'Action failed' };
  }
};

export const updateVerificationStatus = async (id: string, approve: boolean, reason?: string): Promise<Result> => {
  try {
    const { error } = await adminModel.updateVerificationStatus(id, approve);
    if (error) return { success: false, error: error.message };

    await postNotification(
      id,
      approve ? 'Verification Approved' : 'Verification Rejected',
      approve
        ? 'Your identity has been verified. You now have full access to Pasuyo.'
        : `Your verification request was rejected. Reason: ${reason || 'Does not meet requirements'}. Please resubmit with valid documents.`,
      '/profile',
    );
    sendVerificationEmail(id, approve, reason);
    await adminModel.postAdminLog(
      approve ? 'APPROVED_VERIFICATION' : 'REJECTED_VERIFICATION',
      id,
      `Admin ${approve ? 'approved' : 'rejected'} verification for user ${id}${reason ? `. Reason: ${reason}` : ''}`,
    );
    return { success: true, error: '' };
  } catch {
    return { success: false, error: 'Action failed' };
  }
};

export const getErrands = async (): Promise<Result<Errand[]>> => {
  try {
    const { data, error } = await adminModel.getAdminErrands();
    if (error || !data) return { success: false, error: error?.message ?? 'Failed to fetch errands' };
    return { success: true, error: '', data: data as Errand[] };
  } catch {
    return { success: false, error: 'Failed to fetch errands' };
  }
};

export type PendingPayment = {
  id: string;
  user_id: string;
  amount: number;
  reference_no: string;
  screenshot_url: string;
  status: string;
  created_at: string;
  user_name: string;
};

export const getPendingPayments = async (): Promise<Result<PendingPayment[]>> => {
  try {
    const { data, error } = await adminModel.getPendingPayments();
    if (error || !data) return { success: false, error: error?.message ?? 'Failed to fetch payments' };
    const userIds = [...new Set((data as any[]).map(p => p.user_id))];
    let names: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await adminModel.getProfileNames(userIds);
      (profiles ?? []).forEach((p: any) => {
        names[p.id] = [p.first_name, p.last_name].filter(Boolean).join(' ') || '';
      });
      // Resolve missing names from auth metadata
      const missing = userIds.filter(id => !names[id]);
      for (const uid of missing) {
        const { data: authData } = await adminModel.getUserEmail(uid);
        names[uid] = authData?.displayName || 'Unknown';
      }
    }
    const payments = (data as any[]).map(p => ({ ...p, user_name: names[p.user_id] ?? 'Unknown' }));
    return { success: true, error: '', data: payments as PendingPayment[] };
  } catch {
    return { success: false, error: 'Failed to fetch payments' };
  }
};

export const getPaymentDetail = async (id: string): Promise<Result<any>> => {
  try {
    const { data, error } = await adminModel.getPaymentDetail(id);
    if (error || !data) return { success: false, error: error?.message ?? 'Payment not found' };
    const { data: profiles } = await adminModel.getProfileNames([data.user_id]);
    const p = (profiles ?? [])[0];
    let user_name = p ? [p.first_name, p.last_name].filter(Boolean).join(' ') : '';
    if (!user_name) {
      const { data: authData } = await adminModel.getUserEmail(data.user_id);
      user_name = authData?.displayName || 'Unknown';
    }
    return { success: true, error: '', data: { ...data, user_name } };
  } catch {
    return { success: false, error: 'Failed to fetch payment' };
  }
};

export const updatePaymentStatus = async (id: string, approve: boolean, reason?: string): Promise<Result> => {
  try {
    const { data: payment } = await adminModel.getPaymentDetail(id);
    if (!payment) return { success: false, error: 'Payment not found' };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await adminModel.updatePaymentStatus(id, approve ? 'approved' : 'rejected', user.id, reason);
    if (error) return { success: false, error: error.message };

    await postNotification(
      payment.user_id,
      approve ? 'Payment Approved' : 'Payment Rejected',
      approve
        ? `Your service fee payment of ₱${payment.amount.toLocaleString()} has been approved.`
        : `Your service fee payment of ₱${payment.amount.toLocaleString()} has been rejected. Reason: ${reason || 'Does not meet requirements'}.`,
      '/service-fee',
    );
    sendPaymentStatusEmail(payment.user_id, approve, payment.amount, reason);
    await adminModel.postAdminLog(
      approve ? 'APPROVED_PAYMENT' : 'REJECTED_PAYMENT',
      payment.user_id,
      `Admin ${approve ? 'approved' : 'rejected'} payment of ₱${payment.amount} (ID: ${id})${reason ? `. Reason: ${reason}` : ''}`,
    );
    return { success: true, error: '' };
  } catch {
    return { success: false, error: 'Action failed' };
  }
};

export const getAdminErrandDetail = async (id: string): Promise<Result<any>> => {
  try {
    const { data, error } = await adminModel.getAdminErrandDetail(id);
    if (error || !data) return { success: false, error: error?.message ?? 'Errand not found' };
    return { success: true, error: '', data };
  } catch {
    return { success: false, error: 'Failed to fetch errand' };
  }
};

const SERVICE_FEE_RATE = 0.10;

export const getAdminUnpaidTotal = async (userId: string): Promise<Result<number>> => {
  try {
    const [{ data: errands }, paidAmount] = await Promise.all([
      adminModel.getCompletedAcceptedErrands(userId),
      adminModel.getApprovedPaymentsTotal(userId),
    ]);
    const totalOwed = (errands ?? [])
      .filter((e: any) => e.budget != null && e.budget > 0)
      .reduce((sum: number, e: any) => sum + Math.round(e.budget * SERVICE_FEE_RATE * 100) / 100, 0);
    return { success: true, error: '', data: totalOwed - paidAmount };
  } catch {
    return { success: false, error: 'Failed to calculate balance' };
  }
};

export type AdminErrandEvent = {
  id: string;
  errand_id: string;
  actor_id: string;
  event_type: string;
  metadata: Record<string, any>;
  created_at: string;
};

export const getAdminErrandHistory = async (errandId: string): Promise<Result<{ events: AdminErrandEvent[]; actorNames: Record<string, string> }>> => {
  try {
    const { data, error } = await adminModel.getAdminErrandEvents(errandId);
    if (error) return { success: false, error: error.message };
    const events = (data ?? []) as AdminErrandEvent[];
    const actorIds = [...new Set(events.map(e => e.actor_id))];
    let actorNames: Record<string, string> = {};
    if (actorIds.length > 0) {
      const { data: profiles } = await adminModel.getProfileNames(actorIds);
      (profiles ?? []).forEach((p: any) => {
        actorNames[p.id] = [p.first_name, p.last_name].filter(Boolean).join(' ') || '';
      });
      const missing = actorIds.filter(id => !actorNames[id]);
      for (const uid of missing) {
        const { data: authData } = await adminModel.getUserEmail(uid);
        actorNames[uid] = authData?.displayName || 'Unknown';
      }
    }
    return { success: true, error: '', data: { events, actorNames } };
  } catch {
    return { success: false, error: 'Failed to fetch history' };
  }
};

export const deleteErrandAdmin = async (errandId: string, reason: string): Promise<Result> => {
  try {
    const { data: errand, error: fetchErr } = await adminModel.getAdminErrandDetail(errandId);
    if (fetchErr || !errand) return { success: false, error: 'Errand not found' };

    const { error } = await adminModel.deleteAdminErrand(errandId);
    if (error) return { success: false, error: error.message };

    // Clean up reports for this errand
    await adminModel.deleteErrandReports(errandId);

    const errandInfo = { title: errand.title, description: errand.description, budget: errand.budget };

    // Notify poster
    await postNotification(
      errand.user_id,
      'Errand Removed',
      `Your errand "${errand.title}" has been removed by an admin. Reason: ${reason}`,
    );
    sendErrandDeletedEmail(errand.user_id, errandInfo, reason);

    // Notify runner if accepted
    if (errand.accepted_by) {
      await postNotification(
        errand.accepted_by,
        'Errand Removed',
        `The errand "${errand.title}" you accepted has been removed by an admin. Reason: ${reason}`,
      );
      sendErrandDeletedEmail(errand.accepted_by, errandInfo, reason);
    }

    await adminModel.postAdminLog('DELETED_ERRAND', errand.user_id, `Admin deleted errand "${errand.title}". Reason: ${reason}`);
    return { success: true, error: '' };
  } catch {
    return { success: false, error: 'Failed to delete errand' };
  }
};

const PAGE_SIZE = 30;

export const getUserActivity = async (
  userId: string,
  page: number,
  filter: 'All' | 'Activity' | 'Messages' | 'Reports' = 'All',
): Promise<Result<ActivityPage>> => {
  try {
    const offset = page * PAGE_SIZE;
    const activityTypes = ['posted', 'accepted', 'cancelled', 'marked_done', 'reviewed', 'edited_errand', 'deleted_errand'];

    let items: ActivityItem[] = [];
    let totalAvailable = 0;

    if (filter === 'All' || filter === 'Activity') {
      const { data, count } = await adminModel.getUserErrandEvents(userId, PAGE_SIZE, offset);
      items.push(...(data ?? []).map((e: any) => ({ id: e.id, type: e.event_type, metadata: e.metadata, created_at: e.created_at })));
      totalAvailable += count ?? 0;
    }
    if (filter === 'All' || filter === 'Messages') {
      const { data, count } = await adminModel.getUserMessages(userId, PAGE_SIZE, offset);
      items.push(...(data ?? []).map((m: any) => ({ id: m.id, type: 'message_sent', created_at: m.created_at })));
      totalAvailable += count ?? 0;
    }
    if (filter === 'All' || filter === 'Reports') {
      const { data, count } = await adminModel.getUserReports(userId, PAGE_SIZE, offset);
      items.push(...(data ?? []).map((r: any) => ({ id: r.id, type: 'reported', metadata: { reason: r.reason }, created_at: r.created_at })));
      totalAvailable += count ?? 0;
    }

    // Sort merged results newest first
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Trim to page size
    items = items.slice(0, PAGE_SIZE);

    return { success: true, error: '', data: { items, hasMore: offset + PAGE_SIZE < totalAvailable } };
  } catch {
    return { success: false, error: 'Failed to fetch activity' };
  }
};

export const getLogs = async (): Promise<Result<LogEntry[]>> => {
  try {
    const { data, error } = await adminModel.getAdminLogs();
    if (error || !data) return { success: false, error: error?.message ?? 'Failed to fetch logs' };
    return { success: true, error: '', data: data as LogEntry[] };
  } catch {
    return { success: false, error: 'Failed to fetch logs' };
  }
};

export type AdminReport = {
  id: string;
  reporter_id: string;
  reported_id: string;
  type: 'user' | 'errand';
  reason: string;
  details: string | null;
  created_at: string;
  errand_id: string | null;
  file_urls: string[] | null;
  reporter_name: string;
  reported_name: string;
};

export const getReports = async (): Promise<Result<AdminReport[]>> => {
  try {
    const { data, error } = await adminModel.getAdminReports();
    if (error || !data) return { success: false, error: error?.message ?? 'Failed to fetch reports' };
    const allIds = [...new Set((data as any[]).flatMap(r => [r.reporter_id, r.reported_id]))];
    let names: Record<string, string> = {};
    if (allIds.length > 0) {
      const { data: profiles } = await adminModel.getProfileNames(allIds);
      (profiles ?? []).forEach((p: any) => {
        names[p.id] = [p.first_name, p.last_name].filter(Boolean).join(' ') || '';
      });
      const missing = allIds.filter(id => !names[id]);
      for (const uid of missing) {
        const { data: authData } = await adminModel.getUserEmail(uid);
        names[uid] = authData?.displayName || 'Unknown';
      }
    }
    const reports = (data as any[]).map(r => ({
      ...r,
      reporter_name: names[r.reporter_id] ?? 'Unknown',
      reported_name: names[r.reported_id] ?? 'Unknown',
    }));
    return { success: true, error: '', data: reports as AdminReport[] };
  } catch {
    return { success: false, error: 'Failed to fetch reports' };
  }
};

export type ErrandReport = {
  id: string;
  reporter_id: string;
  reporter_name: string;
  reporter_avatar: string | null;
  reason: string;
  details: string | null;
  created_at: string;
};

export const getErrandReports = async (errandId: string): Promise<Result<ErrandReport[]>> => {
  try {
    const { data, error } = await adminModel.getErrandReports(errandId);
    if (error || !data) return { success: false, error: error?.message ?? 'Failed to fetch reports' };
    const reporterIds = [...new Set((data as any[]).map(r => r.reporter_id))];
    let reporters: Record<string, { name: string; avatar: string | null }> = {};
    if (reporterIds.length > 0) {
      const { data: profiles } = await adminModel.getReporterProfiles(reporterIds);
      (profiles ?? []).forEach((p: any) => {
        reporters[p.id] = {
          name: [p.first_name, p.last_name].filter(Boolean).join(' ') || '',
          avatar: p.avatar_url,
        };
      });
      const missing = reporterIds.filter(id => !reporters[id]?.name);
      for (const uid of missing) {
        const { data: authData } = await adminModel.getUserEmail(uid);
        reporters[uid] = { name: authData?.displayName || 'Unknown', avatar: reporters[uid]?.avatar ?? null };
      }
    }
    const reports = (data as any[]).map(r => ({
      id: r.id,
      reporter_id: r.reporter_id,
      reporter_name: reporters[r.reporter_id]?.name ?? 'Unknown',
      reporter_avatar: reporters[r.reporter_id]?.avatar ?? null,
      reason: r.reason,
      details: r.details,
      created_at: r.created_at,
    }));
    return { success: true, error: '', data: reports };
  } catch {
    return { success: false, error: 'Failed to fetch reports' };
  }
};

export const getLogsSubscription = (callback: () => void) =>
  adminModel.getAdminLogsSubscription(callback);

export const removeLogsSubscription = (channel: ReturnType<typeof getLogsSubscription>) =>
  adminModel.removeLogsSubscription(channel);

export const getAnalytics = async (): Promise<Result<AnalyticsData>> => {
  try {
    const { data, error } = await adminModel.getErrandsForAnalytics();
    if (error || !data) return { success: false, error: error?.message ?? 'Failed to fetch analytics' };

    const today = new Date();
    const labels: string[] = [];
    const counts: number[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const label = d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
      const dateStr = d.toISOString().split('T')[0];
      labels.push(label);
      counts.push(data.filter(e => e.created_at.startsWith(dateStr)).length);
    }

    const statusCounts: Record<string, number> = {};
    data.forEach(e => { statusCounts[e.status] = (statusCounts[e.status] ?? 0) + 1; });
    const pieData = Object.entries(statusCounts).map(([name, count]) => ({ name, count }));

    return { success: true, error: '', data: { lineData: { labels, data: counts }, pieData } };
  } catch {
    return { success: false, error: 'Failed to fetch analytics' };
  }
};
