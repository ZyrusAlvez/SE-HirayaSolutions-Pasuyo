import * as errandModel from '@/models/errandModel';
import { supabase } from '@/utils/supabase';

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

export type PinnedLocation = { lat: number; lng: number; name: string };

export interface PostErrandParams {
  title: string;
  description: string;
  isRemote: boolean;
  pinnedLocation: PinnedLocation | null;
  addressDetails: string;
  budget: string;
  deadline: Date | null;
  images: string[];
}

const uploadErrandImages = async (userId: string, errandId: string, images: string[]): Promise<string[]> => {
  const urls: string[] = [];
  for (const uri of images) {
    const response = await fetch(uri);
    const blob = await response.blob();
    const ext = blob.type.split('/')[1] ?? 'jpg';
    const fileName = `${userId}/${errandId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('errand-images').upload(fileName, blob, { contentType: blob.type });
    if (!error) {
      const { data } = supabase.storage.from('errand-images').getPublicUrl(fileName);
      urls.push(data.publicUrl);
    }
  }
  return urls;
};

export const postErrand = async (
  params: PostErrandParams,
): Promise<{ success: true } | { success: false; error: string }> => {
  const { title, description, isRemote, pinnedLocation, addressDetails, budget, deadline, images } = params;

  if (!title.trim()) return { success: false, error: 'Please enter a title.' };
  if (!description.trim()) return { success: false, error: 'Please enter a description.' };
  if (!isRemote && !pinnedLocation) return { success: false, error: 'Please pin a location for onsite errands.' };

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: inserted, error: insertError } = await supabase.from('errands').insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim(),
      is_remote: isRemote,
      location_lat: pinnedLocation?.lat ?? null,
      location_lng: pinnedLocation?.lng ?? null,
      location_name: pinnedLocation?.name ?? null,
      address_details: addressDetails.trim() || null,
      budget: budget ? parseFloat(budget) : null,
      deadline: deadline ? deadline.toISOString() : null,
      images: [],
    }).select('id').single();

    if (insertError) throw insertError;

    if (images.length > 0) {
      const imageUrls = await uploadErrandImages(user.id, inserted.id, images);
      await supabase.from('errands').update({ images: imageUrls }).eq('id', inserted.id);
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message ?? 'Something went wrong' };
  }
};
