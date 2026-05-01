import * as model from '@/models/serviceFeeModel';
import type { ServiceFeeErrand } from '@/models/serviceFeeModel';
import { getErrandEventsByActor } from '@/models/errandEventModel';
import type { ErrandEvent } from '@/models/errandEventModel';

export type { ServiceFeeErrand, ErrandEvent };

type Result<T> = { success: true; data: T } | { success: false; error: string };

const SERVICE_FEE_RATE = 0.10;

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
