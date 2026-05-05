import * as model from '@/models/serviceFeeModel';
import type { ServiceFeeErrand } from '@/models/serviceFeeModel';
import * as paymentModel from '@/models/serviceFeePaymentModel';
import type { ServiceFeePayment } from '@/models/serviceFeePaymentModel';
import { getErrandEventsByActor } from '@/models/errandEventModel';
import type { ErrandEvent } from '@/models/errandEventModel';

export type { ServiceFeeErrand, ErrandEvent, ServiceFeePayment };

type Result<T> = { success: true; data: T } | { success: false; error: string };

const SERVICE_FEE_RATE = 0.10;
const LIMIT_NON_VERIFIED = 1000;
const LIMIT_VERIFIED = 5000;

const mapErrands = (rows: any[]): ServiceFeeErrand[] =>
  rows
    .filter((e) => e.budget != null && e.budget > 0)
    .map((e) => ({
      id: e.id,
      title: e.title,
      budget: e.budget,
      serviceFee: Math.round(e.budget * SERVICE_FEE_RATE * 100) / 100,
      created_at: e.created_at,
      poster_name: e.poster_name,
      poster_avatar: e.poster_avatar,
    }));

const getUnpaidTotal = async (userId: string): Promise<number> => {
  const [{ data: errands }, paidAmount] = await Promise.all([
    model.getCompletedAcceptedErrands(userId),
    model.getPaidAmount(userId),
  ]);
  const totalOwed = mapErrands(errands ?? []).reduce((sum, e) => sum + e.serviceFee, 0);
  return Math.max(totalOwed - paidAmount, 0);
};

export const checkServiceFeeLimit = async (): Promise<{ allowed: boolean; error?: string }> => {
  try {
    const { data: { user } } = await model.getUser();
    if (!user) return { allowed: false, error: 'Not authenticated' };

    const [unpaidTotal, { data: profile }] = await Promise.all([
      getUnpaidTotal(user.id),
      model.getProfileVerification(user.id),
    ]);

    const isVerified = profile?.verified ?? false;
    const limit = isVerified ? LIMIT_VERIFIED : LIMIT_NON_VERIFIED;

    if (unpaidTotal >= limit) {
      return { allowed: false, error: `You have reached your unpaid service fee limit (₱${limit.toLocaleString()}). Please pay your outstanding fees before accepting new errands.` };
    }
    return { allowed: true };
  } catch {
    return { allowed: false, error: 'Failed to check service fee limit' };
  }
};

export const getErrandHistory = async (errandId: string): Promise<Result<ErrandEvent[]>> => {
  try {
    const { data: { user } } = await model.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await getErrandEventsByActor(errandId, user.id);
    if (error) return { success: false, error: 'Failed to load history' };
    return { success: true, data: data ?? [] };
  } catch {
    return { success: false, error: 'Failed to load history' };
  }
};

export const getServiceFeeErrands = async (): Promise<Result<ServiceFeeErrand[]>> => {
  try {
    const { data: { user } } = await model.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data: errands } = await model.getCompletedAcceptedErrands(user.id);
    return { success: true, data: mapErrands(errands ?? []) };
  } catch {
    return { success: false, error: 'Failed to load service fees' };
  }
};

export const getUnpaidServiceFeeTotal = async (): Promise<Result<number>> => {
  try {
    const { data: { user } } = await model.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const total = await getUnpaidTotal(user.id);
    return { success: true, data: total };
  } catch {
    return { success: false, error: 'Failed to calculate balance' };
  }
};

export const submitServiceFeePayment = async (
  referenceNo: string,
  amountSent: string,
  screenshotUri: string,
): Promise<Result<{ id: string }>> => {
  const trimmed = referenceNo.replace(/\s/g, '');
  if (trimmed.length < 6) return { success: false, error: 'Reference number must be at least 6 digits.' };
  if (!/^\d+$/.test(trimmed)) return { success: false, error: 'Reference number must contain only digits.' };

  const amount = parseFloat(amountSent);
  if (isNaN(amount) || amount <= 0) return { success: false, error: 'Enter a valid amount.' };

  try {
    const { data: { user } } = await model.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const screenshotUrl = await paymentModel.uploadReceipt(user.id, screenshotUri);
    const { data, error } = await paymentModel.insertPayment(user.id, amount, trimmed, screenshotUrl);
    if (error || !data) return { success: false, error: 'Failed to submit payment.' };

    return { success: true, data: { id: data.id } };
  } catch (e: any) {
    return { success: false, error: e.message ?? 'Something went wrong' };
  }
};

export const getUserPaymentHistory = async (): Promise<Result<ServiceFeePayment[]>> => {
  try {
    const { data: { user } } = await model.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data, error } = await paymentModel.getUserPayments(user.id);
    if (error) return { success: false, error: 'Failed to load payment history' };
    return { success: true, data: (data ?? []) as ServiceFeePayment[] };
  } catch {
    return { success: false, error: 'Failed to load payment history' };
  }
};
