import * as model from '@/models/serviceFeeModel';
import type { ServiceFeeErrand } from '@/models/serviceFeeModel';
import { getErrandEventsByActor } from '@/models/errandEventModel';
import type { ErrandEvent } from '@/models/errandEventModel';

export type { ServiceFeeErrand, ErrandEvent };

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
      service_fee_paid: e.service_fee_paid ?? false,
      created_at: e.created_at,
      poster_name: e.poster_name,
      poster_avatar: e.poster_avatar,
    }));

export const checkServiceFeeLimit = async (): Promise<{ allowed: boolean; error?: string }> => {
  try {
    const { data: { user } } = await model.getUser();
    if (!user) return { allowed: false, error: 'Not authenticated' };

    const [{ data: errands }, { data: profile }] = await Promise.all([
      model.getUnpaidAcceptedErrands(user.id),
      model.getProfileVerification(user.id),
    ]);

    const totalFees = mapErrands(errands ?? []).reduce((sum, e) => sum + e.serviceFee, 0);
    const isVerified = profile?.verified ?? false;
    const limit = isVerified ? LIMIT_VERIFIED : LIMIT_NON_VERIFIED;

    if (totalFees >= limit) {
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

    const { data } = await model.getUnpaidAcceptedErrands(user.id);
    return { success: true, data: mapErrands(data ?? []) };
  } catch {
    return { success: false, error: 'Failed to load service fees' };
  }
};
