import * as adminModel from '../models/adminModel';
import type { FullUserProfile, UserDetail, VerificationProfile, Errand, LogEntry, AnalyticsData } from '../models/adminModel';
import { postNotification } from './notificationController';

export type { FullUserProfile, UserDetail, VerificationProfile, Errand, LogEntry, AnalyticsData };

type Result<T = undefined> = { success: boolean; error: string; data?: T };

export const getUsers = async (): Promise<Result<FullUserProfile[]>> => {
  try {
    const { data, error } = await adminModel.getAdminUsers();
    if (error || !data) return { success: false, error: error?.message ?? 'Failed to fetch users' };

    const users = await Promise.all(
      data.map(async (user) => {
        const { data: profileData } = await adminModel.getUserIsActive(user.id);
        return { ...user, is_active: profileData?.is_active ?? true } as FullUserProfile;
      })
    );
    return { success: true, error: '', data: users };
  } catch {
    return { success: false, error: 'Failed to fetch users' };
  }
};

export const getUserDetail = async (id: string): Promise<Result<UserDetail>> => {
  try {
    const { data, error } = await adminModel.getUserDetail(id);
    if (error || !data) return { success: false, error: error?.message ?? 'User not found' };

    const { data: profileData } = await adminModel.getUserIsActive(id);
    return { success: true, error: '', data: { ...data, is_active: profileData?.is_active ?? true } as UserDetail };
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

export const updateUserActiveStatus = async (id: string, suspend: boolean): Promise<Result> => {
  try {
    const { error } = await adminModel.updateUserActiveStatus(id, !suspend);
    if (error) return { success: false, error: error.message };

    await postNotification(
      id,
      suspend ? 'Account Suspended' : 'Account Restored',
      suspend
        ? 'Your account has been suspended. Please contact support for more information.'
        : 'Your account has been restored. You can now access Pasuyo again.',
    );
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

export const updateVerificationStatus = async (id: string, approve: boolean): Promise<Result> => {
  try {
    const { error } = await adminModel.updateVerificationStatus(id, approve);
    if (error) return { success: false, error: error.message };

    await postNotification(
      id,
      approve ? 'Verification Approved' : 'Verification Rejected',
      approve
        ? 'Your identity has been verified. You now have full access to Pasuyo.'
        : 'Your verification request was rejected. Please resubmit with valid documents.',
    );
    await adminModel.postAdminLog(
      approve ? 'APPROVED_VERIFICATION' : 'REJECTED_VERIFICATION',
      id,
      `Admin ${approve ? 'approved' : 'rejected'} verification for user ${id}`,
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

export const getLogs = async (): Promise<Result<LogEntry[]>> => {
  try {
    const { data, error } = await adminModel.getAdminLogs();
    if (error || !data) return { success: false, error: error?.message ?? 'Failed to fetch logs' };
    return { success: true, error: '', data: data as LogEntry[] };
  } catch {
    return { success: false, error: 'Failed to fetch logs' };
  }
};

export const getLogsSubscription = (callback: () => void) =>
  adminModel.getAdminLogsSubscription(callback);

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
