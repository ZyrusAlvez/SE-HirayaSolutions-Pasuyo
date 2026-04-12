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

export type CurrentUser = {
  id: string;
  avatarUrl: string | null;
  isVerified: boolean;
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

export const loadCurrentUser = async (): Promise<Result<CurrentUser | null>> => {
  const { data: { user } } = await errandModel.getCurrentUser();
  if (!user) return { success: true, data: null };

  const rawUrl = user.user_metadata.custom_avatar_url || user.user_metadata.avatar_url;
  const avatarUrl = rawUrl && rawUrl !== 'default' ? rawUrl : null;

  const { data: profile } = await errandModel.getUserVerification(user.id);

  return {
    success: true,
    data: { id: user.id, avatarUrl, isVerified: profile?.verified ?? false },
  };
};

export const formatDeadline = (deadline?: string): string | null =>
  deadline
    ? new Date(deadline).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

export const formatPostedOn = (createdAt: string): string =>
  new Date(createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
