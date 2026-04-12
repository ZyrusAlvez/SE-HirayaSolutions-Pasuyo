import * as errandModel from '@/models/errandModel';

export type ErrandStatus = 'Available' | 'Expired' | 'In Progress' | 'Completed';

export type Errand = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  is_remote: boolean;
  status: ErrandStatus;
  location_lat: number | null;
  location_lng: number | null;
  location_name?: string;
  address_details?: string;
  budget?: number;
  deadline?: string;
  images?: string[];
  created_at: string;
  poster_name?: string;
  poster_avatar?: string;
  poster_rating?: number;
  poster_is_verified?: boolean;
};

type Result<T> = { success: true; data: T } | { success: false; error: string };

export const fetchErrand = async (id: string): Promise<Result<Errand>> => {
  const { data, error } = await errandModel.getErrandById(id);
  if (error || !data) return { success: false, error: 'Errand not found' };

  if (data.status === 'Available' && data.deadline && new Date(data.deadline) < new Date()) {
    data.status = 'Expired';
  }

  return { success: true, data: data as Errand };
};

export const formatDeadline = (deadline?: string): string | null =>
  deadline
    ? new Date(deadline).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

export const formatPostedOn = (createdAt: string): string =>
  new Date(createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

export const fetchErrands = async (): Promise<Result<Errand[]>> => {
  const { data, error } = await errandModel.fetchAvailableErrands();
  if (error) return { success: false, error: 'Failed to fetch errands' };
  return { success: true, data: (data ?? []) as Errand[] };
};

export const filterOnsiteErrands = (errands: Errand[]) =>
  errands.filter(e => !e.is_remote && e.location_lat && e.location_lng);

export const filterRemoteErrands = (errands: Errand[]) =>
  errands.filter(e => e.is_remote);
